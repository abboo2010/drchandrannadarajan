// build-marker: 2026-09-01-b
// netlify/functions/content.js
// GET  /api/content?section=X  — public. Reads the current value for one
//      of 9 sections from Supabase (content_sections table); if nothing
//      has ever been saved for that section (or Supabase isn't configured
//      yet), falls back to the bundled content/*.json file, so the site
//      behaves identically before and after the CMS goes live.
// POST /api/content?section=X  — auth required (Bearer session token from
//      /api/auth). Upserts the new value straight into Supabase — visible
//      on the very next GET, no rebuild/redeploy.
const { getSupabase } = require('./_supabase');
const { verifyToken } = require('./auth');

const FALLBACKS = {
  'conditions': () => require('../../content/conditions.json'),
  'treatments': () => require('../../content/treatments.json'),
  'doctor-bio': () => require('../../content/doctor-bio.json'),
  'education': () => require('../../content/education.json'),
  'videos': () => require('../../content/videos.json'),
  'testimonials': () => require('../../content/testimonials.json'),
  'reviews': () => require('../../content/reviews.json'),
  'site-text': () => require('../../content/site-text.json'),
  'site-images': () => require('../../content/site-images.json'),
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
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('content_sections')
          .select('data')
          .eq('section', section)
          .maybeSingle();
        if (!error && data && data.data !== null && data.data !== undefined) {
          return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data.data) };
        }
      } catch (e) {
        // Supabase unreachable — fall through to bundled fallback below.
      }
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(FALLBACKS[section]()) };
  }

  if (event.httpMethod === 'POST') {
    if (!verifyToken(bearerToken(event), process.env.ADMIN_SECRET || '')) {
      return { statusCode: 401, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Unauthorized' }) };
    }
    const supabase = getSupabase();
    if (!supabase) {
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
    const { error } = await supabase
      .from('content_sections')
      .upsert({ section, data: payload, updated_at: new Date().toISOString() }, { onConflict: 'section' });
    if (error) {
      return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: error.message }) };
    }
    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ok: true }) };
  }

  return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
};
