const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { buildRouter } = require('./routes/index.js');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler.js');

function createApp() {
  const app = express();

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: '*' }));
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan('dev'));

  app.use(buildRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
