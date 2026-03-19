/**
 * Database Module - Suporta MongoDB Atlas ou Local File Storage
 * 
 * Se MONGODB_URI estiver definido, usa MongoDB
 * Caso contrário, usa armazenamento em arquivo local
 */

const fs = require('fs');
const path = require('path');

let mongoClient = null;
let mongoDb = null;

/**
 * Inicializa a conexão com MongoDB (se disponível)
 */
async function initializeDatabase() {
  if (!process.env.MONGODB_URI) {
    console.log('[Database] MongoDB URI not configured, using local file storage');
    return false;
  }

  try {
    const MongoClient = require('mongodb').MongoClient;
    mongoClient = new MongoClient(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await mongoClient.connect();
    mongoDb = mongoClient.db('janus-protocol');
    
    console.log('[Database] Connected to MongoDB Atlas');
    return true;
  } catch (error) {
    console.error('[Database] Failed to connect to MongoDB:', error.message);
    console.log('[Database] Falling back to local file storage');
    return false;
  }
}

/**
 * Lê eventos do banco de dados (MongoDB ou arquivo local)
 */
async function readEvents() {
  if (mongoDb) {
    try {
      const collection = mongoDb.collection('events');
      return await collection.find().toArray();
    } catch (error) {
      console.error('[Database] Error reading from MongoDB:', error);
      throw error;
    }
  } else {
    // Fallback para arquivo local
    const DATA_DIR = path.join(__dirname, '../data');
    const DATA_FILE = path.join(DATA_DIR, 'events.json');
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
    }
    
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    try {
      return JSON.parse(raw || '[]');
    } catch (e) {
      console.error('[Database] Error parsing JSON:', e);
      return [];
    }
  }
}

/**
 * Escreve eventos no banco de dados
 */
async function writeEvents(events) {
  if (mongoDb) {
    try {
      const collection = mongoDb.collection('events');
      // Usa bulkWrite para performance
      if (events.length === 0) return;
      
      const operations = events.map(event => ({
        updateOne: {
          filter: { _id: event._id },
          update: { $set: event },
          upsert: true
        }
      }));
      
      await collection.bulkWrite(operations);
    } catch (error) {
      console.error('[Database] Error writing to MongoDB:', error);
      throw error;
    }
  } else {
    // Fallback para arquivo local
    const DATA_DIR = path.join(__dirname, '../data');
    const DATA_FILE = path.join(DATA_DIR, 'events.json');
    
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(events, null, 2), 'utf8');
  }
}

/**
 * Insere um novo evento
 */
async function insertEvent(event) {
  if (mongoDb) {
    try {
      const collection = mongoDb.collection('events');
      await collection.insertOne(event);
      return event;
    } catch (error) {
      console.error('[Database] Error inserting event:', error);
      throw error;
    }
  } else {
    // Fallback para arquivo local
    const events = await readEvents();
    events.push(event);
    await writeEvents(events);
    return event;
  }
}

/**
 * Fecha a conexão com MongoDB
 */
async function closeDatabase() {
  if (mongoClient) {
    await mongoClient.close();
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
