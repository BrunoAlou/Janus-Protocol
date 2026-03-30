const { config } = require('../config/env.js');
const eventsService = require('../services/eventsService.js');

async function postEvent(req, res) {
  const result = await eventsService.ingestSingle(req.body || {});
  res.status(200).json({ ok: true, ...result });
}

async function postBatch(req, res) {
  try {
    const result = await eventsService.ingestBatch(req.body || []);
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    if (err.statusCode === 207) {
      res.status(207).json({ ok: false, ...(err.details || {}) });
      return;
    }
    throw err;
  }
}

async function getLastHash(req, res) {
  const sessionId = eventsService.parseSessionIdFromUrl(req.originalUrl, config.port);
  const lastHash = await eventsService.getLastHash(sessionId);
  res.status(200).json({ ok: true, last_hash: lastHash });
}

async function listEvents(req, res) {
  const events = await eventsService.listEvents();
  res.status(200).json(events);
}

module.exports = {
  postEvent,
  postBatch,
  getLastHash,
  listEvents
};
