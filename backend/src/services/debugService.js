const { safePasswordEquals } = require('../utils/cryptoUtils.js');
const { config } = require('../config/env.js');
const { ApiError } = require('../utils/apiError.js');

function validateDebugPassword(candidate) {
  if (!config.debugPassword) {
    throw new ApiError(503, 'debug_password_not_configured');
  }

  const valid = safePasswordEquals(String(candidate || ''), config.debugPassword);
  if (!valid) {
    throw new ApiError(401, 'invalid_password');
  }

  return { unlocked: true };
}

module.exports = {
  validateDebugPassword
};
