const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
const MINIGAME_TELEMETRY_FILE = path.join(DATA_DIR, 'minigame-telemetry.json');

function ensureTelemetryFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(MINIGAME_TELEMETRY_FILE)) fs.writeFileSync(MINIGAME_TELEMETRY_FILE, '[]', 'utf8');
}

function readAll() {
  ensureTelemetryFile();
  const raw = fs.readFileSync(MINIGAME_TELEMETRY_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (_e) {
    return [];
  }
}

function writeAll(records) {
  ensureTelemetryFile();
  fs.writeFileSync(MINIGAME_TELEMETRY_FILE, JSON.stringify(records, null, 2), 'utf8');
}

module.exports = {
  readAll,
  writeAll
};
