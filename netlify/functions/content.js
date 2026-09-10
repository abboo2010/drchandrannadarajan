// GET  /api/content?section=conditions   -> public, no auth
// POST /api/content?section=conditions   -> requires Authorization: Bearer <token>
//
// Backed by Netlify Blobs. On first GET for a section (before any admin
// edit has ever been saved), the value is seeded from the JSON file that
// shipped with the site, so the live site works identically before and
// after this CMS goes live. After the first admin Save, the blob store
// is the source of truth and updates are visible immediately — no git
// commit, no rebuild.

const { getStore } = require('@netlify/blobs');
const { isAuthorized, json, CORS_HEADERS } = require('./_auth-helper');

// Whitelist of editable sections and their seed (baked-in default) data.
// Requiring the JSON directly lets Netlify's bundler inline it into the
// function, so there's no separate file-read step at runtime.
const SEEDS = {
  conditions: require('../../content/conditions.json'),
  treatments: require('../../content/treatments.json'),
  'doctor-bio': require('../../content/doctor-bio.json'),
  education: require('../../content/education.json'),
  videos: require('../../content/videos.json'),
  testimonials: require('../../content/testimonials.json'),
  reviews: require('../../content/reviews.json'),
  'site-text': require('../../content/site-text.json'),
  'site-images': require('../../content/site-images.json'),
};

const SECTIONS = Object.keys(SEEDS);

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const section = (event.queryStringParameters || {}).section;
  if (!section || !SECTIONS.includes(section)) {
    return json(400, { error: `Unknown or missing section. Valid sections: ${SECTIONS.join(', ')}` });
  }

  const store = getStore('content');

  if (event.httpMethod === 'GET') {
    let data;
    try {
      data = await store.get(section, { type: 'json' });
    } catch (e) {
      return json(500, { error: 'Could not read content store: ' + e.message });
    }
    if (data === null) {
      // Never saved via the admin panel yet — serve the shipped default.
      data = SEEDS[section];
    }
    return json(200, data, { 'Cache-Control': 'no-store' });
  }

  if (event.httpMethod === 'POST') {
    if (!isAuthorized(event.headers)) {
      return json(401, { error: 'Not logged in, or session expired. Please log in again.' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || 'null');
    } catch (e) {
      return json(400, { error: 'Request body is not valid JSON' });
    }
    if (payload === null || typeof payload !== 'object') {
      return json(400, { error: 'Request body must be a JSON object' });
    }

    try {
      await store.setJSON(section, payload);
    } catch (e) {
      return json(500, { error: 'Could not save: ' + e.message });
    }

    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
};
