function getDatabaseConfig() {
  return {
    mongodbUri: process.env.MONGODB_URI || '',
    databaseName: process.env.MONGODB_DB_NAME || 'janus-protocol'
  };
}

module.exports = {
  getDatabaseConfig
};