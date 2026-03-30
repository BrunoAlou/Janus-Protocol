const telemetryRepository = require('../repositories/telemetryRepository.js');

function buildPublicAverages(records) {
  const grouped = new Map();

  records.forEach((record) => {
    const key = record?.minigame || record?.summary?.minigame || record?.minigameKey;
    const score = Number(record?.summary?.score);
    if (!key || !Number.isFinite(score)) return;

    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(score);
  });

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

function insertTelemetry(payload) {
  const records = telemetryRepository.readAll();
  records.push({
    ...payload,
    insertedAt: new Date().toISOString()
  });
  telemetryRepository.writeAll(records);
}

function getPublicAverages() {
  const records = telemetryRepository.readAll();
  return buildPublicAverages(records);
}

module.exports = {
  insertTelemetry,
  getPublicAverages
};
