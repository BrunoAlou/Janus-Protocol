const { URL } = require('url');
const { generateObjectId, computeHashHexForEvent } = require('../utils/cryptoUtils.js');
const { ApiError } = require('../utils/apiError.js');
const eventsRepository = require('../repositories/eventsRepository.js');

const ALLOWED_EVENT_TYPES = new Set([
  'collision',
  'movement',
  'interaction',
  'session_start',
  'session_end',
  'position_sample',
  'player_step',
  'player_action'
]);

function normalizeType(event) {
  if (event.type_event && !ALLOWED_EVENT_TYPES.has(event.type_event)) {
    event.type_event = 'unknown';
  }
  if (!event.type_event && event.event_type && ALLOWED_EVENT_TYPES.has(event.event_type)) {
    event.type_event = event.event_type;
  }
}

function getLastHashForSession(sessionId, events) {
  if (!sessionId) return null;
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const evt = events[i];
    if (evt.session_id === sessionId && evt.hash) return evt.hash;
  }
  return null;
}

function enrichEvent(rawEvent) {
  const event = { ...rawEvent };
  if (!event._id) event._id = generateObjectId();
  if (!event.insertedAt) event.insertedAt = new Date().toISOString();
  event.server_timestamp = new Date().toISOString();
  if (!event.event_version) event.event_version = '1';
  normalizeType(event);
  return event;
}

function validateHashChain(event, lastHash) {
  if (Object.prototype.hasOwnProperty.call(event, 'prev_hash')) {
    if (lastHash && event.prev_hash !== lastHash) {
      throw new ApiError(409, 'prev_hash_mismatch', { last_hash: lastHash });
    }
  }

  const recomputed = computeHashHexForEvent(event);
  if (Object.prototype.hasOwnProperty.call(event, 'hash') && event.hash !== recomputed) {
    throw new ApiError(409, 'hash_mismatch', { expected: recomputed });
  }

  event.hash = recomputed;
}

async function ingestSingle(rawEvent) {
  const event = enrichEvent(rawEvent);
  const events = await eventsRepository.readAll();
  const lastHash = getLastHashForSession(event.session_id, events);
  validateHashChain(event, lastHash);

  events.push(event);
  await eventsRepository.writeAll(events);

  return {
    insertedId: event._id,
    hash: event.hash,
    last_hash: lastHash
  };
}

async function ingestBatch(rawEvents) {
  if (!Array.isArray(rawEvents)) {
    throw new ApiError(400, 'expected array');
  }

  const events = await eventsRepository.readAll();
  const failures = [];

  rawEvents.forEach((rawEvent) => {
    try {
      const event = enrichEvent(rawEvent);
      const lastHash = getLastHashForSession(event.session_id, events);
      validateHashChain(event, lastHash);
      events.push(event);
    } catch (err) {
      failures.push({
        _id: rawEvent?._id || null,
        error: err.message,
        ...(err.details || {})
      });
    }
  });

  await eventsRepository.writeAll(events);

  if (failures.length > 0) {
    throw new ApiError(207, 'partial_failure', { failures });
  }

  return { inserted: rawEvents.length };
}

async function getLastHash(sessionId) {
  const events = await eventsRepository.readAll();
  return getLastHashForSession(sessionId, events);
}

async function listEvents() {
  return eventsRepository.readAll();
}

function parseSessionIdFromUrl(url, basePort) {
  const parsed = new URL(url, `http://localhost:${basePort}`);
  return parsed.searchParams.get('session_id');
}

module.exports = {
  ingestSingle,
  ingestBatch,
  getLastHash,
  listEvents,
  parseSessionIdFromUrl
};
