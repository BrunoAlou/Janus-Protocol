const { getDatabaseConfig } = require('../config/database.js');
const mongoAdapter = require('../adapters/events/mongoEventsAdapter.js');
const fileAdapter = require('../adapters/events/fileEventsAdapter.js');

let useMongo = false;

async function initializeDatabase() {
  const config = getDatabaseConfig();

  if (!config.mongodbUri) {
    useMongo = false;
    console.log('[Database] MongoDB URI not configured, using local file storage');
    return false;
  }

  try {
    await mongoAdapter.initializeMongoConnection(config.mongodbUri, config.databaseName);
    useMongo = true;
    console.log('[Database] Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    useMongo = false;
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    console.log('[Database] Falling back to local file storage');
    return false;
  }
}

async function readEvents() {
  if (useMongo && mongoAdapter.isMongoReady()) {
    try {
      return await mongoAdapter.readMongoEvents();
    } catch (error) {
      console.error('[Database] Error reading from MongoDB:', error);
      throw error;
    }
  }

  return fileAdapter.readLocalEvents();
}

async function writeEvents(events) {
  if (useMongo && mongoAdapter.isMongoReady()) {
    try {
      await mongoAdapter.writeMongoEvents(events);
      return;
    } catch (error) {
      console.error('[Database] Error writing to MongoDB:', error);
      throw error;
    }
  }

  fileAdapter.writeLocalEvents(events);
}

async function insertEvent(event) {
  if (useMongo && mongoAdapter.isMongoReady()) {
    try {
      return await mongoAdapter.insertMongoEvent(event);
    } catch (error) {
      console.error('[Database] Error inserting event:', error);
      throw error;
    }
  }

  return fileAdapter.insertLocalEvent(event);
}

async function closeDatabase() {
  if (mongoAdapter.isMongoReady()) {
    await mongoAdapter.closeMongoConnection();
    console.log('[Database] Disconnected from MongoDB');
  }
}

module.exports = {
  initializeDatabase,
  readEvents,
  writeEvents,
  insertEvent,
  closeDatabase
};