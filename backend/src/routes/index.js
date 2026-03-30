const express = require('express');
const swaggerUi = require('swagger-ui-express');

const asyncHandler = require('../middleware/asyncHandler.js');
const eventsController = require('../controllers/eventsController.js');
const authController = require('../controllers/authController.js');
const telemetryController = require('../controllers/telemetryController.js');
const debugController = require('../controllers/debugController.js');
const healthController = require('../controllers/healthController.js');
const {
  validateObjectBody,
  validateEventBody,
  validateEventsBatchBody,
  validateAuthTokenBody,
  validateDebugUnlockBody
} = require('../middleware/requestValidation.js');
const { createOpenApiSpec } = require('../docs/openapi.js');

function buildRouter() {
  const router = express.Router();

  router.get('/', healthController.rootStatus);

  router.get('/api/events', asyncHandler(eventsController.listEvents));
  router.post('/api/events', validateEventBody, asyncHandler(eventsController.postEvent));
  router.post('/api/events/batch', validateEventsBatchBody, asyncHandler(eventsController.postBatch));
  router.get('/api/last_hash', asyncHandler(eventsController.getLastHash));

  router.post('/api/auth/token', validateAuthTokenBody, asyncHandler(authController.exchangeToken));
  router.get('/auth/callback', asyncHandler(authController.oauthCallback));

  router.post('/api/telemetry/minigame', validateObjectBody, asyncHandler(telemetryController.ingestMinigameTelemetry));
  router.get('/api/minigames/public-averages', asyncHandler(telemetryController.getPublicAverages));

  router.post('/api/debug/unlock', validateDebugUnlockBody, asyncHandler(debugController.unlockDebug));

  const openApiSpec = createOpenApiSpec();
  router.get('/api/openapi.json', (req, res) => res.status(200).json(openApiSpec));
  router.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true }));

  return router;
}

module.exports = {
  buildRouter
};
