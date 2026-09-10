// Shared helper for issuing and verifying the admin session token.
//
// Deliberately dependency-free (just Node's built-in crypto) so the
// functions bundle stays small and has nothing extra to break.
//
// Token shape: "<expiryEpochSeconds>.<hmacHex>"
// The HMAC is computed over the expiry using ADMIN_SECRET, so a token
// can't be forged or its expiry extended without knowing the secret.

const crypto = require('crypto');

const SESSION_HOURS = 12;

function getSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error(
      'ADMIN_SECRET environment variable is not set. Set it in Netlify ' +
        'Site settings → Environment variables before using the admin panel.'
    );
  }
  return secret;
}

function sign(expiry) {
  return crypto.createHmac('sha256', getSecret()).update(String(expiry)).digest('hex');
}

function issueToken() {
  const expiry = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  return `${expiry}.${sign(expiry)}`;
}

// Constant-time-ish comparison of two equal-purpose secrets. Both sides
// are hashed first so a length mismatch can't leak anything either.
function safeEqual(a, b) {
  const bufA = crypto.createHash('sha256').update(String(a)).digest();
  const bufB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(bufA, bufB);
}

function verifyPassword(candidate) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error(
      'ADMIN_PASSWORD environment variable is not set. Set it in Netlify ' +
        'Site settings → Environment variables before using the admin panel.'
    );
  }
  return typeof candidate === 'string' && candidate.length > 0 && safeEqual(candidate, expected);
}

// Reads "Authorization: Bearer <token>" from the incoming request headers
// and returns true only if the token is well-formed, correctly signed,
// and not expired.
function isAuthorized(headers) {
  const authHeader = (headers && (headers.authorization || headers.Authorization)) || '';
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  if (!match) return false;

  const token = match[1];
  const dot = token.indexOf('.');
  if (dot === -1) return false;

  const expiryStr = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry)) return false;
  if (Math.floor(Date.now() / 1000) > expiry) return false; // expired

  let expectedSig;
  try {
    expectedSig = sign(expiry);
  } catch (e) {
    return false;
  }
  if (expectedSig.length !== providedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(providedSig));
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(statusCode, body, extraHeaders) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...(extraHeaders || {}) },
    body: JSON.stringify(body),
  };
}

module.exports = { issueToken, verifyPassword, isAuthorized, json, CORS_HEADERS, SESSION_HOURS };
