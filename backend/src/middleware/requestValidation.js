const { ApiError } = require('../utils/apiError.js');

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateObjectBody(req, _res, next) {
  if (!isPlainObject(req.body)) {
    next(new ApiError(400, 'invalid_payload', { expected: 'object' }));
    return;
  }
  next();
}

function validateEventBody(req, _res, next) {
  if (!isPlainObject(req.body)) {
    next(new ApiError(400, 'invalid_payload', { expected: 'object' }));
    return;
  }
  next();
}

function validateEventsBatchBody(req, _res, next) {
  if (!Array.isArray(req.body)) {
    next(new ApiError(400, 'invalid_payload', { expected: 'array' }));
    return;
  }

  const invalidIndex = req.body.findIndex((item) => !isPlainObject(item));
  if (invalidIndex >= 0) {
    next(new ApiError(400, 'invalid_payload', { expected: 'array<object>', invalid_index: invalidIndex }));
    return;
  }

  next();
}

function validateAuthTokenBody(req, _res, next) {
  if (!isPlainObject(req.body)) {
    next(new ApiError(400, 'invalid_payload', { expected: 'object' }));
    return;
  }

  const { code, provider } = req.body;
  if (typeof code !== 'string' || !code.trim()) {
    next(new ApiError(400, 'invalid_payload', { field: 'code', expected: 'non-empty string' }));
    return;
  }

  if (provider !== undefined && provider !== 'linkedin' && provider !== 'google') {
    next(new ApiError(400, 'invalid_payload', { field: 'provider', expected: 'linkedin|google' }));
    return;
  }

  next();
}

function validateDebugUnlockBody(req, _res, next) {
  if (!isPlainObject(req.body)) {
    next(new ApiError(400, 'invalid_payload', { expected: 'object' }));
    return;
  }

  if (typeof req.body.password !== 'string' || !req.body.password.trim()) {
    next(new ApiError(400, 'invalid_payload', { field: 'password', expected: 'non-empty string' }));
    return;
  }

  next();
}

module.exports = {
  validateObjectBody,
  validateEventBody,
  validateEventsBatchBody,
  validateAuthTokenBody,
  validateDebugUnlockBody
};