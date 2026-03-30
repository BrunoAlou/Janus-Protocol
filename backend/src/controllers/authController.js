const authService = require('../services/authService.js');

async function exchangeToken(req, res) {
  const payload = await authService.exchangeToken({
    code: req.body?.code,
    provider: req.body?.provider,
    referer: req.headers.referer || req.headers.origin
  });
  res.status(200).json(payload);
}

async function oauthCallback(req, res) {
  const redirectUrl = await authService.handleOAuthCallback(req);
  res.redirect(302, redirectUrl);
}

module.exports = {
  exchangeToken,
  oauthCallback
};
