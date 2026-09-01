// netlify/functions/image.js — POST (auth required): the admin panel
// resizes/compresses the image client-side, base64-encodes it, and posts
// { dataUrl, filename }. This stores it in the public Supabase Storage
// bucket "site-images" under a fresh timestamped key (avoids stale
// browser caching after a swap) and returns its public URL.
const { getSupabase } = require('./_supabase');
const { verifyToken } = require('./auth');

function bearerToken(event) {
  const h = event.headers.authorization || event.headers.Authorization || '';
  return h.replace(/^Bearer\s+/i, '').trim();
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }
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
  const { dataUrl, filename } = payload || {};
  const m = /^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/.exec(dataUrl || '');
  if (!m) {
    return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Expected a base64 image data URL' }) };
  }
  const contentType = m[1];
  const buffer = Buffer.from(m[2], 'base64');
  const ext = (contentType.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
  const safeName = (filename || 'image').toString().replace(/[^a-zA-Z0-9-_]/g, '-').slice(0, 60);
  const key = `${safeName}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('site-images').upload(key, buffer, {
    contentType,
    upsert: false,
  });
  if (uploadError) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: uploadError.message }) };
  }

  const { data } = supabase.storage.from('site-images').getPublicUrl(key);
  return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: data.publicUrl }) };
};
