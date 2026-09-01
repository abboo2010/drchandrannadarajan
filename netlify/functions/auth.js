// netlify/functions/auth.js — single shared admin password, no accounts,
// no Netlify Identity. POST { password } -> { token }. The token is
// "<expiry>.<hmac>", signed with ADMIN_SECRET, 12h expiry, Node's built-in
// crypto only (no JWT library needed for one password and one claim).
const crypto = require('crypto');

function sign(expiry, secret) {
  return crypto.createHmac('sha256', secret).update(String(expiry)).digest('hex');
}

function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [expiryStr, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (!expiry || Date.now() > expiry) return false;
  const expected = sign(expiry, secret);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

exports.verifyToken = verifyToken;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_PASSWORD || !ADMIN_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured: set ADMIN_PASSWORD and ADMIN_SECRET in Netlify environment variables.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }

  if (body.password !== ADMIN_PASSWORD) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  const expiry = Date.now() + 12 * 60 * 60 * 1000; // 12h
  const token = `${expiry}.${sign(expiry, ADMIN_SECRET)}`;
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token }) };
};
