// Utilitário simples de telemetria para desenvolvimento local.
// Envia eventos para o backend em http://localhost:3000/api/events
// Se o envio falhar, guarda no localStorage e tenta reenviar mais tarde.

if (typeof window !== 'undefined' && window.console) console.log('telemetry module loaded');

const BACKEND_URL = (typeof window !== 'undefined' && window.__BACKEND_URL__) ? window.__BACKEND_URL__ : 'http://localhost:3000';
const ANON_SALT = (typeof window !== 'undefined' && window.__ANON_SALT__) ? window.__ANON_SALT__ : 'janus-salt-please-change';

function getSessionId() {
  if (typeof window === 'undefined') return null;
  let sid = window.sessionStorage.getItem('janus_session_id');
  if (!sid) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) sid = crypto.randomUUID();
    else sid = 'sid-' + Date.now() + '-' + Math.floor(Math.random()*10000);
    window.sessionStorage.setItem('janus_session_id', sid);
  }
  return sid;
}

function enrichEvent(evt, incrementSeq = true) {
  const anon = getAnonId();
  const consent = getConsentFlag();
  const seq = (incrementSeq) ? getAndIncrementSeq() : null;
  const base = Object.assign({
    _id: generateObjectId(), // pseudo ObjectId
    insertedAt: new Date().toISOString(),
    server_timestamp: new Date().toISOString(),
    event_version: evt.event_version || '1',
    session_id: getSessionId(),
    seq_in_session: seq,
    user_anon_id: anon,
    user_id: null,
    client: (typeof navigator !== 'undefined') ? navigator.userAgent : 'node',
    consent: consent
  }, evt, { type_event: evt.event_type || evt.type_event || 'unknown' });
  // remove seq_in_session if not incremented to avoid counting samples
  if (!incrementSeq) delete base.seq_in_session;
  return base;
}

function generateObjectId() {
  // gera 24 hex chars parecido com Mongo ObjectId
  let s = '';
  for (let i = 0; i < 24; i++) s += Math.floor(Math.random()*16).toString(16);
  return s;
}

function getAndIncrementSeq() {
  if (typeof window === 'undefined') return null;
  const key = 'janus_seq_in_session';
  let v = parseInt(window.sessionStorage.getItem(key) || '0', 10);
  v = v + 1;
  window.sessionStorage.setItem(key, String(v));
  return v;
}

function getConsentFlag() {
  if (typeof window === 'undefined') return false;
  const v = window.sessionStorage.getItem('janus_consent');
  if (v === null) return false; // default conservative
  return v === 'true' || v === '1';
}

function fnv1a(str) {
  // simple FNV-1a 32-bit hash -> hex
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24)) >>> 0;
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

function getAnonId() {
  if (typeof window === 'undefined') return null;
  let id = window.sessionStorage.getItem('janus_anon_id');
  if (!id) {
    const sid = getSessionId() || ('s' + Date.now());
    id = fnv1a(sid + ANON_SALT);
    window.sessionStorage.setItem('janus_anon_id', id);
  }
  return id;
}

// Batched sender: guarda na fila em memória e persiste em localStorage como fallback.
const MEM_QUEUE = [];
const LS_KEY = 'janus_telemetry_queue';
const FLUSH_INTERVAL_MS = 5000; // flush a cada 5s
const FLUSH_BATCH_SIZE = 10; // ou quando atingir 10 eventos

const LAST_HASH_KEY_PREFIX = 'janus_last_hash_';
const SEND_WHITELIST = new Set(['session_start','session_end','interaction','player_action','player_step','player_action']);

function persistQueueToLocalStorage() {
  try {
    const existing = JSON.parse(window.localStorage.getItem(LS_KEY) || '[]');
    const merged = existing.concat(MEM_QUEUE);
    window.localStorage.setItem(LS_KEY, JSON.stringify(merged));
  } catch (e) {
    console.error('telemetry: erro ao persistir fila', e);
  }
}

async function postBatch(docs) {
  const url = BACKEND_URL + '/api/events/batch';
  // server doesn't have /api/events/batch, so we fallback to individual posts if 404.
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docs)
    });
    if (res.ok) return true;
    // if not ok, try sending individually
  } catch (e) {
    // ignore and fallback to individual
  }
  // fallback: send individually
  for (const d of docs) {
    try {
      const r = await fetch(BACKEND_URL + '/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
    } catch (err) {
      console.warn('telemetry: falha ao postar evento individual, manter na LS', err);
      // persist remaining
      queueEventLocal(d);
    }
  }
  return false;
}

function queueEventLocal(doc) {
  try {
    const q = JSON.parse(window.localStorage.getItem(LS_KEY) || '[]');
    q.push(doc);
    window.localStorage.setItem(LS_KEY, JSON.stringify(q));
  } catch (e) {
    console.error('telemetry: não foi possível enfileirar evento', e);
  }
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(stableStringify).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + stableStringify(obj[k])).join(',') + '}';
}

async function sha256Hex(str) {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const enc = new TextEncoder().encode(str);
      const hashBuf = await window.crypto.subtle.digest('SHA-256', enc);
      const hashArray = Array.from(new Uint8Array(hashBuf));
      return hashArray.map(b => b.toString(16).padStart(2,'0')).join('');
    }
  } catch (e) {
    // fallthrough to fallback
  }
  // fallback: use simple FNV (not cryptographically secure) if SubtleCrypto not present
  return fnv1a(str);
}

function getLastHashLocal(session_id) {
  try {
    return window.localStorage.getItem(LAST_HASH_KEY_PREFIX + session_id) || null;
  } catch (e) { return null; }
}

function setLastHashLocal(session_id, hash) {
  try { window.localStorage.setItem(LAST_HASH_KEY_PREFIX + session_id, hash); } catch (e) { /* ignore */ }
}

function makeHashInput(evt) {
  const canonical = {};
  const keys = ['_id','session_id','seq_in_session','type_event','payload','prev_hash','insertedAt','user_anon_id'];
  for (const k of keys) if (Object.prototype.hasOwnProperty.call(evt, k)) canonical[k] = evt[k];
  return canonical;
}

async function flushMemQueue() {
  if (!MEM_QUEUE.length) return;
  const toSend = MEM_QUEUE.splice(0, FLUSH_BATCH_SIZE);
  try {
    await postBatch(toSend);
  } catch (e) {
    // se falhar, persistir localmente
    persistQueueToLocalStorage();
  }
}

// flushQueue: tenta reenviar eventos persistidos em localStorage (somente whitelisted)
async function flushQueue() {
  try {
    const raw = window.localStorage.getItem(LS_KEY) || '[]';
    const q = JSON.parse(raw);
    if (!Array.isArray(q) || q.length === 0) return;
    const toSend = q.splice(0, FLUSH_BATCH_SIZE);
    // try batch first
    const ok = await postBatch(toSend);
    if (ok) {
      // write remaining back
      window.localStorage.setItem(LS_KEY, JSON.stringify(q));
    }
  } catch (e) {
    // noop
  }
}

// Periodic flush
if (typeof window !== 'undefined') {
  window.__janus_telemetry_flush_timer = setInterval(() => {
    try { flushMemQueue(); } catch (e) { /* ignore */ }
  }, FLUSH_INTERVAL_MS);
  // beforeunload: try to send remaining items via sendBeacon
  window.addEventListener('beforeunload', () => {
    try {
      if (MEM_QUEUE.length) {
        // try sendBeacon for reliability
        if (navigator && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(MEM_QUEUE)], { type: 'application/json' });
          navigator.sendBeacon(BACKEND_URL + '/api/events/batch', blob);
        } else {
          persistQueueToLocalStorage();
        }
      }
    } catch (e) {
      // noop
    }
  });
}

// Exported API
// Abstract action logger: sends one primary event (action) and then a position_sample chained to it.
export async function logAction(type, info = {}, position = null) {
  try {
    console.log('logAction entered', type);
    const session = getSessionId();
    // build primary event object
    const evt = { event_type: type, event_version: '1', payload: info };
    // enrich and increment seq for action events
    const doc = enrichEvent(evt, true);
    const lastLocal = getLastHashLocal(session);
    console.log('logAction', type, 'lastLocal=', lastLocal);
    doc.prev_hash = lastLocal || null;
    const hashInput = makeHashInput(doc);
    const canonical = stableStringify(hashInput);
    console.log('logAction', type, 'computing sha256 for doc');
    const h = await sha256Hex(canonical);
    console.log('logAction', type, 'sha256 done, hash=', h);
    doc.hash = h;
    // persist last hash locally (so offline chains can continue)
    setLastHashLocal(session, h);

    // enqueue primary event
    MEM_QUEUE.push(doc);

    // flush aggressively
    setTimeout(() => { try { flushMemQueue(); } catch (e) {} }, 50);

    // create position_sample chained to the primary event if position provided
    if (position && typeof position === 'object') {
      console.log('logAction', type, 'creating position_sample chained to', doc.hash);
      const ps = { event_type: 'position_sample', event_version: '1', payload: position };
      // enrich without incrementing seq (samples should not affect seq)
      const psDoc = enrichEvent(ps, false);
      // chain to primary event
      psDoc.prev_hash = doc.hash;
      const inputPs = makeHashInput(psDoc);
      const canonicalPs = stableStringify(inputPs);
      console.log('logAction', type, 'computing sha256 for position_sample');
      const hps = await sha256Hex(canonicalPs);
      console.log('logAction', type, 'position_sample sha256 done, hash=', hps);
      psDoc.hash = hps;
      // update last hash local to the sample's hash
      setLastHashLocal(session, hps);
      MEM_QUEUE.push(psDoc);
      // try flush
      setTimeout(() => { try { flushMemQueue(); } catch (e) {} }, 100);
    }

    return { ok: true, event: doc };
  } catch (e) {
    console.error('logAction error', e && e.stack ? e.stack : e, e);
    // on error, fallback to local queue store (both primary and sample if created)
    try { queueEventLocal(evt); if (position) queueEventLocal({ event_type: 'position_sample', payload: position }); } catch (x) { console.error('logAction fallback queue failed', x); }
    return { ok: false, error: e.message };
  }
}

// Backwards-compatible exporter: logEvent keeps previous behavior but marks non-whitelisted events as local-only
export async function logEvent(event) {
  const isAction = SEND_WHITELIST.has(event.event_type || event.type_event || event.type);
  if (isAction) {
    // forward to logAction and no position sampled (caller may pass position explicitly)
    return logAction(event.event_type || event.type_event || event.type, event.payload || {}, event.payload && event.payload.position ? event.payload.position : null);
  }
  // non-action: persist locally only
  try {
    const doc = enrichEvent(event, false);
    queueEventLocal(doc);
    return { ok: true, local: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export function resendQueued() {
  // chamada explícita para tentar esvaziar a fila
  setTimeout(() => flushQueue(), 100);
}

export default { logEvent, resendQueued };
