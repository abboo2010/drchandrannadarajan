// build-marker: 2026-09-01-c
// netlify/functions/content.js
// GET  /api/content?section=X  — public. Reads the current value for one
//      of 9 sections from Supabase (content_sections table, over plain
//      REST — see _supabase.js); if nothing has ever been saved for that
//      section (or Supabase isn't configured yet), falls back to the
//      bundled content/*.json file, so the site behaves identically
//      before and after the CMS goes live.
// POST /api/content?section=X  — auth required (Bearer session token from
//      /api/auth). Upserts the new value straight into Supabase — visible
//      on the very next GET, no rebuild/redeploy.
const { fetchSectionRow, upsertSectionRow, getSupabaseConfig, fetchAdminUser } = require('./_supabase');
const { verifyToken } = require('./auth');

// NOTE: this folder is named "seed-content", not "content" — a sibling
// folder literally named "content" collided with this function's own name
// (content.js) once bundled, and Netlify's function loader crashed trying
// to resolve which one "content" meant (ERR_UNSUPPORTED_DIR_IMPORT). Do
// not rename this back to "content" or the same crash comes back.
const FALLBACKS = {
  'conditions': () => require('../../seed-content/conditions.json'),
  'treatments': () => require('../../seed-content/treatments.json'),
  'doctor-bio': () => require('../../seed-content/doctor-bio.json'),
  'education': () => require('../../seed-content/education.json'),
  'videos': () => require('../../seed-content/videos.json'),
  'testimonials': () => require('../../seed-content/testimonials.json'),
  'reviews': () => require('../../seed-content/reviews.json'),
  'site-text': () => require('../../seed-content/site-text.json'),
  'site-images': () => require('../../seed-content/site-images.json'),
};

function bearerToken(event) {
  const h = event.headers.authorization || event.headers.Authorization || '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

exports.handler = async (event) => {
  const section = (event.queryStringParameters || {}).section;
  if (!section || !FALLBACKS[section]) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unknown or missing section' }) };
  }

  if (event.httpMethod === 'GET') {
    if (getSupabaseConfig()) {
      try {
        const data = await fetchSectionRow(section);
        if (data !== null && data !== undefined) {
          return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) };
        }
      } catch (e) {
        // Supabase unreachable/misconfigured — fall through to bundled fallback below.
      }
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(FALLBACKS[section]()) };
  }

  if (event.httpMethod === 'POST') {
    const username = verifyToken(bearerToken(event), process.env.ADMIN_SECRET || '');
    if (!username) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    // Re-checked fresh against the database on every save (not baked into
    // the token) so a permission change takes effect immediately instead
    // of waiting out the token's 12h life.
    let user;
    try { user = await fetchAdminUser(username); } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Could not verify your permissions right now.' }) };
    }
    if (!user || !Array.isArray(user.sections) || !user.sections.includes(section)) {
      return { statusCode: 403, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: "You don't have permission to edit this section." }) };
    }
    if (!getSupabaseConfig()) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Server not configured: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify environment variables.' }),
      };
    }
    let payload;
    try { payload = JSON.parse(event.body || 'null'); } catch {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Invalid JSON body' }) };
    }
    if (payload === null) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Empty body' }) };
    }
    try {
      await upsertSectionRow(section, payload);
    } catch (e) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: e.message }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
};
