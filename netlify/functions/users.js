// build-marker: 2026-09-02-a
// netlify/functions/users.js — manage CMS login accounts. Every request
// requires a valid session token (same Bearer token as /api/content) —
// this is only reachable once someone is already logged in.
// GET    -> { users: [{username, created_at}], me: 'currentUsername' }
// POST   { username, password } -> create a new account or reset an
//         existing one's password (upsert on username).
// DELETE ?username=x -> remove an account. Blocked for your own account
//         and for the last remaining account, so nobody can lock
//         everyone out of the CMS by accident.
const { verifyToken, hashPassword } = require('./auth');
const { getSupabaseConfig, listAdminUsers, upsertAdminUser, deleteAdminUser, countAdminUsers } = require('./_supabase');

function bearerToken(event) {
  const h = event.headers.authorization || event.headers.Authorization || '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

const USERNAME_RE = /^[a-z0-9._-]{3,40}$/;

exports.handler = async (event) => {
  const me = verifyToken(bearerToken(event), process.env.ADMIN_SECRET || '');
  if (!me) {
    return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
  }
  if (!getSupabaseConfig()) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.' }),
    };
  }

  if (event.httpMethod === 'GET') {
    try {
      const users = await listAdminUsers();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ users, me }) };
    } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    if (!USERNAME_RE.test(username)) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Username must be 3-40 characters: letters, numbers, dot, underscore, hyphen only.' }) };
    }
    if (password.length < 8) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Password must be at least 8 characters.' }) };
    }
    try {
      await upsertAdminUser(username, hashPassword(password));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
  }

  if (event.httpMethod === 'DELETE') {
    const username = ((event.queryStringParameters || {}).username || '').trim().toLowerCase();
    if (!username) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Missing username' }) };
    }
    if (username === me) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: "You can't delete the account you're logged in as." }) };
    }
    try {
      const count = await countAdminUsers();
      if (count <= 1) {
        return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Cannot delete the last remaining account.' }) };
      }
      await deleteAdminUser(username);
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
    } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
  }

  return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
};
