let mongoClient = null;
let mongoDb = null;

async function initializeMongoConnection(mongodbUri, databaseName) {
  const MongoClient = require('mongodb').MongoClient;
  mongoClient = new MongoClient(mongodbUri);
  await mongoClient.connect();
  mongoDb = mongoClient.db(databaseName);
  return true;
}

function isMongoReady() {
  return Boolean(mongoDb);
}

async function readMongoEvents() {
  const collection = mongoDb.collection('events');
  return collection.find().toArray();
}

async function writeMongoEvents(events) {
  if (events.length === 0) return;

  const collection = mongoDb.collection('events');
  const operations = events.map((event) => ({
    updateOne: {
      filter: { _id: event._id },
      update: { $set: event },
      upsert: true
    }
  }));

  await collection.bulkWrite(operations);
}

async function insertMongoEvent(event) {
  const collection = mongoDb.collection('events');
  await collection.insertOne(event);
  return event;
}

async function closeMongoConnection() {
  if (!mongoClient) return;
  await mongoClient.close();
  mongoClient = null;
  mongoDb = null;
}

module.exports = {
  initializeMongoConnection,
  isMongoReady,
  readMongoEvents,
  writeMongoEvents,
  insertMongoEvent,
  closeMongoConnection
};