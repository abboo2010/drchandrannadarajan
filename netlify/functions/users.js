// build-marker: 2026-09-02-b
// netlify/functions/users.js — manage CMS login accounts AND which
// sections each one can access. Every request requires a valid session
// token (same Bearer token as /api/content) belonging to an account whose
// own `sections` includes 'users' — an ordinary editor login cannot see
// or change other logins, only someone explicitly granted Manage Users.
// GET    -> { users: [{username, sections, created_at}], me: 'currentUsername' }
// POST   { username, password?, sections } -> create a new account (password
//         required) or update an existing one (password optional — omit it
//         to change only `sections` and leave the password untouched).
//         `sections` must be a non-empty array drawn from ALL_SECTIONS.
// DELETE ?username=x -> remove an account. Blocked for your own account
//         and for the last remaining account, so nobody can lock
//         everyone out of the CMS by accident.
const { verifyToken, hashPassword } = require('./auth');
const {
  getSupabaseConfig, fetchAdminUser, listAdminUsers, upsertAdminUser,
  updateAdminUserSections, deleteAdminUser, countAdminUsers,
} = require('./_supabase');
const { ALL_SECTIONS } = require('./_sections');

function bearerToken(event) {
  const h = event.headers.authorization || event.headers.Authorization || '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

const USERNAME_RE = /^[a-z0-9._-]{3,40}$/;

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

// Keep only recognized section keys, de-duplicated. Returns null if the
// input wasn't an array at all (a different error than "array but empty
// or full of junk").
function normalizeSections(input) {
  if (!Array.isArray(input)) return null;
  return [...new Set(input.filter((s) => ALL_SECTIONS.includes(s)))];
}

exports.handler = async (event) => {
  const me = verifyToken(bearerToken(event), process.env.ADMIN_SECRET || '');
  if (!me) return json(401, { error: 'Unauthorized' });
  if (!getSupabaseConfig()) {
    return json(500, { error: 'Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.' });
  }

  // Only accounts explicitly granted 'users' can view or manage other
  // logins — re-checked fresh against the database on every request
  // (not baked into the token) so a revoked permission takes effect
  // immediately instead of waiting out the token's 12h life.
  let myUser;
  try { myUser = await fetchAdminUser(me); } catch (e) {
    return json(500, { error: 'Could not verify your permissions right now.' });
  }
  if (!myUser || !Array.isArray(myUser.sections) || !myUser.sections.includes('users')) {
    return json(403, { error: "You don't have permission to manage users." });
  }

  if (event.httpMethod === 'GET') {
    try {
      const users = await listAdminUsers();
      return json(200, { users, me });
    } catch (e) {
      return json(500, { error: e.message });
    }
  }

  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { body = {}; }
    const username = (body.username || '').trim().toLowerCase();
    const password = body.password || '';
    if (!USERNAME_RE.test(username)) {
      return json(400, { error: 'Username must be 3-40 characters: letters, numbers, dot, underscore, hyphen only.' });
    }
    const sections = normalizeSections(body.sections);
    if (sections === null) {
      return json(400, { error: 'Sections must be a list.' });
    }
    if (!sections.length) {
      return json(400, { error: 'Select at least one section for this login.' });
    }

    let existing;
    try { existing = await fetchAdminUser(username); } catch (e) {
      return json(500, { error: 'Could not look up that account right now.' });
    }
    if (!existing && !password) {
      return json(400, { error: 'Password required for a new login.' });
    }
    if (password && password.length < 8) {
      return json(400, { error: 'Password must be at least 8 characters.' });
    }

    // Don't let an account remove its own Manage Users access if it's the
    // only login that has it — that would lock everyone out of ever
    // managing users again.
    if (username === me && !sections.includes('users')) {
      let allUsers = [];
      try { allUsers = await listAdminUsers(); } catch (e) { allUsers = []; }
      const otherManagers = allUsers.some((u) => u.username !== me && Array.isArray(u.sections) && u.sections.includes('users'));
      if (!otherManagers) {
        return json(400, { error: "You can't remove your own Manage Users access — no other login would be able to manage users afterward." });
      }
    }

    try {
      if (password) {
        await upsertAdminUser(username, hashPassword(password), sections);
      } else {
        await updateAdminUserSections(username, sections);
      }
      return json(200, { ok: true });
    } catch (e) {
      return json(500, { error: e.message });
    }
  }

  if (event.httpMethod === 'DELETE') {
    const username = ((event.queryStringParameters || {}).username || '').trim().toLowerCase();
    if (!username) {
      return json(400, { error: 'Missing username' });
    }
    if (username === me) {
      return json(400, { error: "You can't delete the account you're logged in as." });
    }
    try {
      const count = await countAdminUsers();
      if (count <= 1) {
        return json(400, { error: 'Cannot delete the last remaining account.' });
      }
      await deleteAdminUser(username);
      return json(200, { ok: true });
    } catch (e) {
      return json(500, { error: e.message });
    }
  }

  return json(405, { error: 'Method not allowed' });
};
