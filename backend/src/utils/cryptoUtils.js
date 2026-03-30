const crypto = require('crypto');

function generateObjectId() {
  let s = '';
  for (let i = 0; i < 24; i += 1) s += Math.floor(Math.random() * 16).toString(16);
  return s;
}

function stableStringify(obj) {
  if (obj === null || typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return `[${obj.map(stableStringify).join(',')}]`;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

function computeHashHexForEvent(evt) {
  const canonical = {};
  const keys = ['_id', 'session_id', 'seq_in_session', 'type_event', 'payload', 'prev_hash', 'insertedAt', 'user_anon_id'];
  keys.forEach((k) => {
    if (Object.prototype.hasOwnProperty.call(evt, k)) canonical[k] = evt[k];
  });
  return crypto.createHash('sha256').update(stableStringify(canonical), 'utf8').digest('hex');
}

function safePasswordEquals(input, expected) {
  if (typeof input !== 'string' || typeof expected !== 'string') return false;
  const a = Buffer.from(input, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  generateObjectId,
  computeHashHexForEvent,
  safePasswordEquals
};
