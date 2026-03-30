const fs = require('fs');
const path = require('path');

function sanitizeEnvValue(value) {
  if (!value) return '';
  return String(value).trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

function loadEnvFile() {
  const envPath = path.join(__dirname, '../../.env');
  if (!fs.existsSync(envPath)) return;

  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (!key || valueParts.length === 0) return;

    process.env[key.trim()] = valueParts.join('=').trim();
  });
}

loadEnvFile();

const config = {
  port: Number(process.env.PORT || 3000),
  linkedIn: {
    clientId: sanitizeEnvValue(process.env.LINKEDIN_CLIENT_ID) || '77vels5rgzs1ki',
    clientSecret: sanitizeEnvValue(process.env.LINKEDIN_CLIENT_SECRET) || 'WPL_AP1.XXXXXXXX'
  },
  google: {
    clientId: sanitizeEnvValue(process.env.GOOGLE_CLIENT_ID) || 'your-client-id.apps.googleusercontent.com',
    clientSecret: sanitizeEnvValue(process.env.GOOGLE_CLIENT_SECRET)
  },
  debugPassword: sanitizeEnvValue(
    process.env.DEBUG_MANAGER_PASSWORD || process.env.PASS_MANAGER_PASSWORD || process.env.PASS_MANAGER
  )
};

module.exports = {
  config,
  sanitizeEnvValue
};
