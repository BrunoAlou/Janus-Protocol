// Servidor HTTP simples para desenvolvimento local.
// Aceita POST /api/events para gravar eventos em backend/data/events.json
// e GET /api/events para listar os eventos.

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');
const PORT = process.env.PORT || 3000;

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
}

function readEvents() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try { return JSON.parse(raw || '[]'); } catch (e) { return []; }
}

function writeEvents(arr) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function generateObjectId() {
  let s = '';
  for (let i = 0; i < 24; i++) s += Math.floor(Math.random()*16).toString(16);
  return s;
}

function stableStringify(obj) {
  // deterministic JSON stringify with sorted object keys
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

function computeHashHexForEvent(evt) {
  // Use a stable canonicalization over a restricted set of fields so client/server agree.
  const canonical = {};
  const keys = ['_id','session_id','seq_in_session','type_event','payload','prev_hash','insertedAt','user_anon_id'];
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(evt, k)) canonical[k] = evt[k];
  const s = stableStringify(canonical);
  return crypto.createHash('sha256').update(s, 'utf8').digest('hex');
}

function getLastHashForSession(session_id, events) {
  if (!session_id) return null;
  for (let i = events.length - 1; i >= 0; i--) {
    const e = events[i];
    if (e.session_id === session_id && e.hash) return e.hash;
  }
  return null;
}

const server = http.createServer((req, res) => {
  // CORS headers para desenvolvimento local
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/events') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const obj = JSON.parse(body || '{}');
        // enrich and normalize basic fields (client should provide _id/insertedAt/hash)
        if (!obj._id) obj._id = generateObjectId();
        if (!obj.insertedAt) obj.insertedAt = new Date().toISOString();
        obj.server_timestamp = new Date().toISOString();
        if (!obj.event_version) obj.event_version = '1';
        // normalize type enum
        const allowed = ['collision','movement','interaction','session_start','session_end','position_sample','player_step','player_action'];
        if (obj.type_event && !allowed.includes(obj.type_event)) {
          obj.type_event = 'unknown';
        }
        if (!obj.type_event && obj.event_type && allowed.includes(obj.event_type)) obj.type_event = obj.event_type;

        const events = readEvents();
        const lastHash = getLastHashForSession(obj.session_id, events);

        // If client provided prev_hash, validate it against last known hash for session
        if (Object.prototype.hasOwnProperty.call(obj, 'prev_hash')) {
          // explicit mismatch -> reject
          if (lastHash && obj.prev_hash !== lastHash) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'prev_hash_mismatch', last_hash: lastHash }));
            return;
          }
        }

        // recompute hash server-side using canonicalization of agreed fields
        const recomputed = computeHashHexForEvent(obj);
        if (Object.prototype.hasOwnProperty.call(obj, 'hash')) {
          if (obj.hash !== recomputed) {
            res.writeHead(409, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'hash_mismatch', expected: recomputed }));
            return;
          }
        }
        // ensure stored object has authoritative hash field
        obj.hash = recomputed;

        events.push(obj);
        writeEvents(events);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, insertedId: obj._id, hash: obj.hash, last_hash: lastHash }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Batch ingest: accepts array of events
  if (req.method === 'POST' && req.url === '/api/events/batch') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const arr = JSON.parse(body || '[]');
        if (!Array.isArray(arr)) throw new Error('expected array');
        const events = readEvents();
        const failures = [];
        for (const obj of arr) {
          if (!obj._id) obj._id = generateObjectId();
          if (!obj.insertedAt) obj.insertedAt = new Date().toISOString();
          obj.server_timestamp = new Date().toISOString();
          if (!obj.event_version) obj.event_version = '1';
          const lastHash = getLastHashForSession(obj.session_id, events);
          if (Object.prototype.hasOwnProperty.call(obj, 'prev_hash') && lastHash && obj.prev_hash !== lastHash) {
            failures.push({ _id: obj._id, error: 'prev_hash_mismatch', last_hash: lastHash });
            continue;
          }
          const recomputed = computeHashHexForEvent(obj);
          if (Object.prototype.hasOwnProperty.call(obj, 'hash') && obj.hash !== recomputed) {
            failures.push({ _id: obj._id, error: 'hash_mismatch', expected: recomputed });
            continue;
          }
          obj.hash = recomputed;
          events.push(obj);
        }
        writeEvents(events);
        if (failures.length) {
          res.writeHead(207, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, failures }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, inserted: arr.length }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // GET last_hash by session
  if (req.method === 'GET' && req.url.startsWith('/api/last_hash')) {
    try {
      const parsed = new URL(req.url, `http://localhost:${PORT}`);
      const session_id = parsed.searchParams.get('session_id');
      const events = readEvents();
      const lastHash = getLastHashForSession(session_id, events);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, last_hash: lastHash }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  if (req.method === 'GET' && req.url === '/api/events') {
    const events = readEvents();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(events));
    return;
  }

  // rota simples de status
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', backend: 'janus-protocol', port: PORT }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

server.listen(PORT, () => console.log(`Backend de telemetria rodando em http://localhost:${PORT}`));
