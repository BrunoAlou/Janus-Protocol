// Backend API para Janus-Protocol
// - Aceita POST /api/events para gravar eventos
// - GET /api/events para listar os eventos
// - OAuth callback para LinkedIn
// - Suporta MongoDB Atlas ou armazenamento local

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');
const db = require('./database.js');

// Load .env file manually (without dotenv dependency)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
}

const PORT = process.env.PORT || 3000;

// LinkedIn OAuth config (client secret should be in environment variable)
const LINKEDIN_CLIENT_ID = '77vels5rgzs1ki';
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || 'WPL_AP1.XXXXXXXX'; // Substitua pelo seu client secret

// Google OAuth config (NEVER commit CLIENT_SECRET - use environment variables only)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'your-client-id.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || ''; // ⚠️ NUNCA faça commit disso!

// Fallback para arquivo local quando MongoDB não estiver disponível
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');
const MINIGAME_TELEMETRY_FILE = path.join(DATA_DIR, 'minigame-telemetry.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  if (!fs.existsSync(MINIGAME_TELEMETRY_FILE)) fs.writeFileSync(MINIGAME_TELEMETRY_FILE, '[]', 'utf8');
}

function readMinigameTelemetry() {
  ensureDataFile();
  const raw = fs.readFileSync(MINIGAME_TELEMETRY_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    return [];
  }
}

function writeMinigameTelemetry(arr) {
  ensureDataFile();
  fs.writeFileSync(MINIGAME_TELEMETRY_FILE, JSON.stringify(arr, null, 2), 'utf8');
}

function buildPublicAverages(records) {
  const grouped = new Map();

  for (const record of records) {
    const key = record?.minigame || record?.summary?.minigame || record?.minigameKey;
    const score = Number(record?.summary?.score);
    if (!key || !Number.isFinite(score)) continue;

    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(score);
  }

  const result = {};
  for (const [minigame, scores] of grouped.entries()) {
    if (scores.length === 0) continue;

    const totalPlayers = scores.length;
    const averageScore = scores.reduce((acc, v) => acc + v, 0) / totalPlayers;
    const variance = scores.reduce((acc, v) => acc + Math.pow(v - averageScore, 2), 0) / totalPlayers;

    result[minigame] = {
      averageScore: Math.round(averageScore * 100) / 100,
      standardDeviation: Math.round(Math.sqrt(variance) * 100) / 100,
      totalPlayers
    };
  }

  return result;
}

// Wrapper assíncrono para readEvents, sempre usando o módulo de banco.
async function readEvents() {
  return db.readEvents();
}

// Wrapper assíncrono para writeEvents, sempre usando o módulo de banco.
async function writeEvents(arr) {
  await db.writeEvents(arr);
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
    req.on('end', async () => {
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

        const events = await readEvents();
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
        await writeEvents(events);
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
    req.on('end', async () => {
      try {
        const arr = JSON.parse(body || '[]');
        if (!Array.isArray(arr)) throw new Error('expected array');
        const events = await readEvents();
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
        await writeEvents(events);
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
    (async () => {
      try {
        const parsed = new URL(req.url, `http://localhost:${PORT}`);
        const session_id = parsed.searchParams.get('session_id');
        const events = await readEvents();
        const lastHash = getLastHashForSession(session_id, events);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, last_hash: lastHash }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    })();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/events') {
    (async () => {
      try {
        const events = await readEvents();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(events));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    })();
    return;
  }

  // rota simples de status
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', backend: 'janus-protocol', port: PORT }));
    return;
  }

  // OAuth token exchange endpoint
  if (req.method === 'POST' && req.url === '/api/auth/token') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { code, provider } = JSON.parse(body || '{}');
        
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing authorization code' }));
          return;
        }

        if (provider === 'linkedin' || !provider) {
          // Determine redirect_uri based on referer or use default
          const referer = req.headers.referer || req.headers.origin || 'http://localhost:5173';
          const refererUrl = new URL(referer);
          const origin = refererUrl.origin;
          
          // For GitHub Pages, include the /Janus-Protocol path
          let redirectUri = origin + '/auth/callback';
          if (origin.includes('github.io') && !refererUrl.pathname.includes('/Janus-Protocol')) {
            redirectUri = origin + '/Janus-Protocol/auth/callback';
          } else if (origin.includes('github.io')) {
            // Extract the project path from referer
            const pathMatch = refererUrl.pathname.match(/\/([^\/]+)\//);
            if (pathMatch) {
              redirectUri = origin + '/' + pathMatch[1] + '/auth/callback';
            }
          }

          // Exchange code for access token
          const tokenParams = new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: redirectUri,
            client_id: LINKEDIN_CLIENT_ID,
            client_secret: LINKEDIN_CLIENT_SECRET
          });

          const https = require('https');
          
          const tokenResponse = await new Promise((resolve, reject) => {
            const tokenReq = https.request({
              hostname: 'www.linkedin.com',
              path: '/oauth/v2/accessToken',
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
              }
            }, (tokenRes) => {
              let data = '';
              tokenRes.on('data', chunk => data += chunk);
              tokenRes.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (e) {
                  reject(new Error('Invalid token response'));
                }
              });
            });
            tokenReq.on('error', reject);
            tokenReq.write(tokenParams.toString());
            tokenReq.end();
          });

          if (tokenResponse.error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: tokenResponse.error_description || tokenResponse.error }));
            return;
          }

          const accessToken = tokenResponse.access_token;

          // Get user profile using OpenID Connect userinfo endpoint
          const userInfo = await new Promise((resolve, reject) => {
            const userReq = https.request({
              hostname: 'api.linkedin.com',
              path: '/v2/userinfo',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            }, (userRes) => {
              let data = '';
              userRes.on('data', chunk => data += chunk);
              userRes.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (e) {
                  reject(new Error('Invalid user response'));
                }
              });
            });
            userReq.on('error', reject);
            userReq.end();
          });

          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: true,
            access_token: accessToken,
            user: {
              id: userInfo.sub,
              name: userInfo.name,
              email: userInfo.email,
              picture: userInfo.picture,
              provider: 'linkedin'
            }
          }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Unsupported provider' }));
      } catch (e) {
        console.error('[Auth] Token exchange error:', e);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: e.message }));
      }
    });
    return;
  }

  // OAuth callback handler - receives code from LinkedIn or Google
  if (req.method === 'GET' && req.url.startsWith('/auth/callback')) {
    try {
      const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
      const code = parsedUrl.searchParams.get('code');
      const error = parsedUrl.searchParams.get('error');
      const iss = parsedUrl.searchParams.get('iss') || '';
      const isGoogleCallback = iss.includes('accounts.google.com') || parsedUrl.searchParams.has('authuser');
      const provider = isGoogleCallback ? 'google' : 'linkedin';

      if (error) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error, error_description: parsedUrl.searchParams.get('error_description') }));
        return;
      }

      if (!code) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing authorization code' }));
        return;
      }

      // Build the correct redirect_uri (must match what's registered in LinkedIn)
      // Use X-Forwarded-Proto/Host for Railway (behind proxy) or fallback to req.headers
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      
      let redirectUri = `${protocol}://${host}/auth/callback`;

      console.log(`[Auth callback] Received callback from ${provider}`);
      console.log('[Auth callback] Using redirect_uri:', redirectUri);

      if (provider === 'google') {
        if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.includes('your-client-id') || !GOOGLE_CLIENT_SECRET) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Google OAuth credentials are not configured on backend',
            details: 'Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend environment'
          }));
          return;
        }
      }

      // Exchange code for access token
      const https = require('https');
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: provider === 'google' ? GOOGLE_CLIENT_ID : LINKEDIN_CLIENT_ID,
        client_secret: provider === 'google' ? GOOGLE_CLIENT_SECRET : LINKEDIN_CLIENT_SECRET
      });

      const tokenReq = https.request({
        hostname: provider === 'google' ? 'oauth2.googleapis.com' : 'www.linkedin.com',
        path: provider === 'google' ? '/token' : '/oauth/v2/accessToken',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }, (tokenRes) => {
        let tokenData = '';
        tokenRes.on('data', chunk => tokenData += chunk);
        tokenRes.on('end', () => {
          try {
            const tokenResponse = JSON.parse(tokenData);

            if (tokenResponse.error) {
              res.writeHead(400, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: tokenResponse.error_description || tokenResponse.error }));
              return;
            }

            const accessToken = tokenResponse.access_token;

            // Get user profile using access token
            const userReq = https.request({
              hostname: provider === 'google' ? 'openidconnect.googleapis.com' : 'api.linkedin.com',
              path: provider === 'google' ? '/v1/userinfo' : '/v2/userinfo',
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/json'
              }
            }, (userRes) => {
              let userData = '';
              userRes.on('data', chunk => userData += chunk);
              userRes.on('end', () => {
                try {
                  const userInfo = JSON.parse(userData);
                  
                  // Determine frontend URL (for GitHub Pages or local dev)
                  const scheme = req.headers['x-forwarded-proto'] || 'https';
                  let frontendUrl = 'https://brunoalou.github.io/Janus-Protocol';
                  
                  // For local testing
                  if (req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'))) {
                    frontendUrl = `http://${req.headers.host}`;
                  }
                  
                  // Build session data to pass back to frontend
                  const sessionData = {
                    token: accessToken,
                    user: {
                      id: userInfo.sub || userInfo.id,
                      name: userInfo.name,
                      email: userInfo.email,
                      picture: userInfo.picture,
                      provider: provider
                    }
                  };
                  
                  // Redirect to frontend with session data in hash (more secure than query params)
                  const encodedSession = encodeURIComponent(JSON.stringify(sessionData));
                  const redirectUrl = `${frontendUrl}/?oauth_success=true#session=${encodedSession}`;
                  
                  res.writeHead(302, { 'Location': redirectUrl });
                  res.end();
                } catch (e) {
                  console.error('[Auth callback] User info parsing error:', e);
                  res.writeHead(500, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Failed to parse user info' }));
                }
              });
            });
            userReq.on('error', (err) => {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: err.message }));
            });
            userReq.end();
          } catch (e) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid token response' }));
          }
        });
      });

      tokenReq.on('error', (err) => {
        console.error('[Auth callback] Token exchange error:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      tokenReq.write(tokenParams.toString());
      tokenReq.end();
    } catch (e) {
      console.error('[Auth callback] Error:', e);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  // Minigame telemetry ingest
  if (req.method === 'POST' && req.url === '/api/telemetry/minigame') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const records = readMinigameTelemetry();

        records.push({
          ...payload,
          insertedAt: new Date().toISOString()
        });

        writeMinigameTelemetry(records);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }

  // Public minigame averages used by frontend comparison panel
  if (req.method === 'GET' && req.url === '/api/minigames/public-averages') {
    try {
      const records = readMinigameTelemetry();
      const averages = buildPublicAverages(records);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(averages));
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not found' }));
});

// Initialize database and start server
async function startServer() {
  try {
    // Try to connect to MongoDB
    await db.initializeDatabase();
    
    server.listen(PORT, () => {
      console.log(`[Server] Backend API running on port ${PORT}`);
      console.log(`[Server] Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File Storage'}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('[Server] SIGTERM signal received: closing HTTP server');
      await db.closeDatabase();
      process.exit(0);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
