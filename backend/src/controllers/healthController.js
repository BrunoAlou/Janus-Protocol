const { config } = require('../config/env.js');

function rootStatus(req, res) {
  res.status(200).json({
    status: 'ok',
    backend: 'janus-protocol',
    port: config.port,
    docs: '/api/docs'
  });
}

module.exports = {
  rootStatus
};
