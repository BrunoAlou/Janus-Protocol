const db = require('../../database.js');

async function readAll() {
  return db.readEvents();
}

async function writeAll(events) {
  await db.writeEvents(events);
}

module.exports = {
  readAll,
  writeAll
};
