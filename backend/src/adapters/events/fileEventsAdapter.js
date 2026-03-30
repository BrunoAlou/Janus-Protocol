const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../../data');
const DATA_FILE = path.join(DATA_DIR, 'events.json');

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf8');
  }
}

function readLocalEvents() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (error) {
    console.error('[Database] Error parsing local JSON:', error);
    return [];
  }
}

function writeLocalEvents(events) {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
}

function insertLocalEvent(event) {
  const events = readLocalEvents();
  events.push(event);
  writeLocalEvents(events);
  return event;
}

module.exports = {
  readLocalEvents,
  writeLocalEvents,
  insertLocalEvent
};