// build-marker: 2026-09-02-a
// netlify/functions/auth.js — real accounts (username + password), stored
// in Supabase's admin_users table (password_hash only, never plaintext —
// see hashPassword/verifyPassword below, Node's built-in crypto.scrypt,
// no bcrypt dependency needed). POST { username, password } -> { token,
// username }. Token is "<expiry>.<username>.<hmac>", signed with
// ADMIN_SECRET, 12h expiry.
//
// One-time bootstrap: before any account exists (admin_users is empty),
// logging in with the OLD shared ADMIN_PASSWORD env var still works —
// using whatever username is typed — and immediately creates that as a
// real account. Once one account exists, this path is dead; only real
// accounts (managed from the CMS's "Manage Users" panel) work from then
// on. This means the migration from the old single-password setup needs
// no manual SQL beyond creating the admin_users table itself.
const crypto = require('crypto');
const { fetchAdminUser, countAdminUsers, upsertAdminUser } = require('./_supabase');

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

function verifyToken(token, secret) {
  if (!token || !secret) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [expiryStr, username, sig] = parts;
  const expiry = parseInt(expiryStr, 10);
  if (!expiry || Date.now() > expiry || !username) return false;
  const expected = sign(`${expiryStr}.${username}`, secret);
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expected, 'hex');
  if (a.length !== b.length) return false;
  if (!crypto.timingSafeEqual(a, b)) return false;
  return username;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

function verifyPassword(password, stored) {
  const [saltHex, hashHex] = (stored || '').split(':');
  if (!saltHex || !hashHex) return false;
  let salt, expected;
  try { salt = Buffer.from(saltHex, 'hex'); expected = Buffer.from(hashHex, 'hex'); } catch { return false; }
  const actual = crypto.scryptSync(password, salt, 64);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server not configured: set ADMIN_SECRET in Netlify environment variables.' }),
    };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
  const username = (body.username || '').trim().toLowerCase();
  const password = body.password || '';
  if (!username || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Username and password required' }) };
  }

  let user = null;
  try {
    user = await fetchAdminUser(username);
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Could not verify credentials right now.' }) };
  }

  let ok = false;
  if (user) {
    ok = verifyPassword(password, user.password_hash);
  } else {
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    let existingCount = 1; // fail safe: assume accounts exist unless proven otherwise
    try { existingCount = await countAdminUsers(); } catch (e) { existingCount = 1; }
    if (existingCount === 0 && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      try {
        await upsertAdminUser(username, hashPassword(password));
        ok = true;
      } catch (e) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Could not create the first account: ' + e.message }) };
      }
    }
  }

  if (!ok) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Incorrect username or password' }) };
  }

  const expiry = Date.now() + 12 * 60 * 60 * 1000; // 12h
  const token = `${expiry}.${username}.${sign(`${expiry}.${username}`, ADMIN_SECRET)}`;
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, username }) };
};
