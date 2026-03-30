const debugService = require('../services/debugService.js');

async function unlockDebug(req, res) {
  debugService.validateDebugPassword(req.body?.password);
  res.status(200).json({ ok: true, unlocked: true });
}

module.exports = {
  unlockDebug
};
