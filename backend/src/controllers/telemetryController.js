const telemetryService = require('../services/telemetryService.js');

async function ingestMinigameTelemetry(req, res) {
  telemetryService.insertTelemetry(req.body || {});
  res.status(200).json({ ok: true });
}

async function getPublicAverages(req, res) {
  const averages = telemetryService.getPublicAverages();
  res.status(200).json(averages);
}

module.exports = {
  ingestMinigameTelemetry,
  getPublicAverages
};
