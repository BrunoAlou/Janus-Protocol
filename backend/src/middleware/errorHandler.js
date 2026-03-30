function notFoundHandler(req, res) {
  res.status(404).json({ error: 'not found' });
}

function errorHandler(err, req, res, _next) {
  const statusCode = Number(err.statusCode || 500);
  const payload = {
    ok: false,
    error: err.message || 'internal_error'
  };

  if (err.details) payload.details = err.details;
  if (process.env.NODE_ENV !== 'production' && err.stack) payload.stack = err.stack;

  res.status(statusCode).json(payload);
}

module.exports = {
  notFoundHandler,
  errorHandler
};
