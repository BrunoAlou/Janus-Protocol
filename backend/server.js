const db = require('./database.js');
const { config } = require('./src/config/env.js');
const { createApp } = require('./src/app.js');

async function startServer() {
  try {
    await db.initializeDatabase();

    const app = createApp();
    const server = app.listen(config.port, () => {
      console.log(`[Server] Backend API running on port ${config.port}`);
      console.log(`[Server] Database: ${process.env.MONGODB_URI ? 'MongoDB Atlas' : 'Local File Storage'}`);
      console.log('[Server] API docs: /api/docs');
      console.log('[Server] OpenAPI JSON: /api/openapi.json');
      console.log('[Server] Google OAuth configured:', {
        hasClientId: Boolean(config.google.clientId && !config.google.clientId.includes('your-client-id')),
        hasClientSecret: Boolean(config.google.clientSecret),
        clientIdLooksValid: config.google.clientId.endsWith('.apps.googleusercontent.com')
      });
      console.log('[Server] Debug unlock configured:', Boolean(config.debugPassword));
    });

    process.on('SIGTERM', async () => {
      console.log('[Server] SIGTERM signal received: closing HTTP server');
      server.close(async () => {
        await db.closeDatabase();
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

startServer();
