// POST /api/auth  { password: "..." }
// -> 200 { token } on correct password
// -> 401 { error: "Incorrect password" } otherwise
//
// This is the entire login system: one shared password (set as the
// ADMIN_PASSWORD environment variable in the Netlify dashboard), no
// accounts, no database of users. Matches the simple single-password
// admin login this site's CMS was modeled on.

const { issueToken, verifyPassword, json, CORS_HEADERS } = require('./_auth-helper');

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Malformed request body' });
  }

  let isValid;
  try {
    isValid = verifyPassword(payload.password);
  } catch (e) {
    // ADMIN_PASSWORD not configured yet on this site.
    return json(500, { error: e.message });
  }

  if (!isValid) {
    return json(401, { error: 'Incorrect password' });
  }

  try {
    return json(200, { token: issueToken() });
  } catch (e) {
    // ADMIN_SECRET not configured yet on this site.
    return json(500, { error: e.message });
  }
};
