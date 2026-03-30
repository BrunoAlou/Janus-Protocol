const { URL, URLSearchParams } = require('url');
const { config } = require('../config/env.js');
const { ApiError } = require('../utils/apiError.js');
const { requestJson } = require('../utils/httpClient.js');

function resolveRedirectUriFromReferer(referer) {
  const fallback = 'http://localhost:5173';
  const refererUrl = new URL(referer || fallback);
  const origin = refererUrl.origin;

  let redirectUri = `${origin}/auth/callback`;
  if (origin.includes('github.io') && !refererUrl.pathname.includes('/Janus-Protocol')) {
    redirectUri = `${origin}/Janus-Protocol/auth/callback`;
  } else if (origin.includes('github.io')) {
    const pathMatch = refererUrl.pathname.match(/\/([^/]+)\//);
    if (pathMatch) redirectUri = `${origin}/${pathMatch[1]}/auth/callback`;
  }

  return redirectUri;
}

function getCallbackRedirectUri(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${protocol}://${host}/auth/callback`;
}

async function exchangeLinkedInCode(code, redirectUri) {
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.linkedIn.clientId,
    client_secret: config.linkedIn.clientSecret
  });

  const tokenResponse = await requestJson({
    hostname: 'www.linkedin.com',
    path: '/oauth/v2/accessToken',
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams.toString()
  });

  if (tokenResponse.data.error) {
    throw new ApiError(400, tokenResponse.data.error_description || tokenResponse.data.error);
  }

  const accessToken = tokenResponse.data.access_token;

  const userInfoResponse = await requestJson({
    hostname: 'api.linkedin.com',
    path: '/v2/userinfo',
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  return {
    accessToken,
    user: {
      id: userInfoResponse.data.sub,
      name: userInfoResponse.data.name,
      email: userInfoResponse.data.email,
      picture: userInfoResponse.data.picture,
      provider: 'linkedin'
    }
  };
}

async function exchangeGoogleCode(code, redirectUri) {
  if (!config.google.clientId || config.google.clientId.includes('your-client-id') || !config.google.clientSecret) {
    throw new ApiError(500, 'Google OAuth credentials are not configured on backend');
  }

  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: config.google.clientId,
    client_secret: config.google.clientSecret
  });

  const tokenResponse = await requestJson({
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json'
    },
    body: tokenParams.toString()
  });

  if (tokenResponse.data.error) {
    throw new ApiError(400, tokenResponse.data.error_description || tokenResponse.data.error);
  }

  const accessToken = tokenResponse.data.access_token;

  const userInfoResponse = await requestJson({
    hostname: 'openidconnect.googleapis.com',
    path: '/v1/userinfo',
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json'
    }
  });

  return {
    accessToken,
    user: {
      id: userInfoResponse.data.sub || userInfoResponse.data.id,
      name: userInfoResponse.data.name,
      email: userInfoResponse.data.email,
      picture: userInfoResponse.data.picture,
      provider: 'google'
    }
  };
}

async function exchangeToken({ code, provider = 'linkedin', referer }) {
  if (!code) throw new ApiError(400, 'Missing authorization code');

  const redirectUri = resolveRedirectUriFromReferer(referer);

  if (provider === 'google') {
    const data = await exchangeGoogleCode(code, redirectUri);
    return { success: true, access_token: data.accessToken, user: data.user };
  }

  if (provider !== 'linkedin') {
    throw new ApiError(400, 'Unsupported provider');
  }

  const data = await exchangeLinkedInCode(code, redirectUri);
  return { success: true, access_token: data.accessToken, user: data.user };
}

async function handleOAuthCallback(req) {
  const parsedUrl = new URL(req.originalUrl, `http://localhost:${config.port}`);
  const code = parsedUrl.searchParams.get('code');
  const error = parsedUrl.searchParams.get('error');
  const iss = parsedUrl.searchParams.get('iss') || '';
  const isGoogleCallback = iss.includes('accounts.google.com') || parsedUrl.searchParams.has('authuser');
  const provider = isGoogleCallback ? 'google' : 'linkedin';

  if (error) {
    throw new ApiError(400, parsedUrl.searchParams.get('error_description') || error, { provider });
  }

  if (!code) {
    throw new ApiError(400, 'Missing authorization code', { provider });
  }

  const redirectUri = getCallbackRedirectUri(req);
  const result = provider === 'google'
    ? await exchangeGoogleCode(code, redirectUri)
    : await exchangeLinkedInCode(code, redirectUri);

  let frontendUrl = 'https://brunoalou.github.io/Janus-Protocol';
  if (req.headers.host && (req.headers.host.includes('localhost') || req.headers.host.includes('127.0.0.1'))) {
    frontendUrl = `http://${req.headers.host}`;
  }

  const sessionData = {
    token: result.accessToken,
    user: result.user
  };

  const encodedSession = encodeURIComponent(JSON.stringify(sessionData));
  return `${frontendUrl}/?oauth_success=true#session=${encodedSession}`;
}

module.exports = {
  exchangeToken,
  handleOAuthCallback
};
