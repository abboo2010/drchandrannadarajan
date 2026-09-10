// POST /api/image   (auth required)   { key: "doctor", dataUrl: "data:image/jpeg;base64,..." }
//   -> { url: "/api/image?key=doctor-<timestamp>" }
//   Stores the image and returns a URL to fetch it back. The admin UI
//   resizes/compresses images in the browser before sending them here,
//   so this function just stores whatever bytes it's given.
//
// GET  /api/image?key=doctor-<timestamp>   (public, no auth)
//   -> the raw image bytes, with the content-type it was uploaded as.
//   Every upload gets a fresh key (name + timestamp) instead of
//   overwriting the old one in place, so browsers never show a stale
//   cached copy after a photo is swapped.

const { getStore } = require('@netlify/blobs');
const { isAuthorized, json, CORS_HEADERS } = require('./_auth-helper');

const MAX_BYTES = 8 * 1024 * 1024; // 8MB, comfortably under the function payload limit
const DATA_URL_RE = /^data:([a-zA-Z0-9!#$&.+\-^_]+\/[a-zA-Z0-9!#$&.+\-^_]+);base64,(.+)$/;
const KEY_RE = /^[a-zA-Z0-9_-]{1,80}$/;

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  const store = getStore('images');

  if (event.httpMethod === 'GET') {
    const key = (event.queryStringParameters || {}).key;
    if (!key || !KEY_RE.test(key)) {
      return json(400, { error: 'Missing or invalid key' });
    }

    let result;
    try {
      result = await store.getWithMetadata(key, { type: 'arrayBuffer' });
    } catch (e) {
      return json(500, { error: 'Could not read image: ' + e.message });
    }
    if (!result) {
      return { statusCode: 404, headers: CORS_HEADERS, body: 'Not found' };
    }

    const contentType = (result.metadata && result.metadata.contentType) || 'application/octet-stream';
    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
      body: Buffer.from(result.data).toString('base64'),
      isBase64Encoded: true,
    };
  }

  if (event.httpMethod === 'POST') {
    if (!isAuthorized(event.headers)) {
      return json(401, { error: 'Not logged in, or session expired. Please log in again.' });
    }

    let payload;
    try {
      payload = JSON.parse(event.body || '{}');
    } catch (e) {
      return json(400, { error: 'Malformed request body' });
    }

    const { key: rawKey, dataUrl } = payload;
    if (!rawKey || !/^[a-zA-Z0-9_-]{1,40}$/.test(rawKey)) {
      return json(400, { error: 'Invalid or missing "key"' });
    }
    if (typeof dataUrl !== 'string') {
      return json(400, { error: 'Missing "dataUrl"' });
    }

    const match = DATA_URL_RE.exec(dataUrl);
    if (!match) {
      return json(400, { error: 'dataUrl must be a base64 data URL (e.g. data:image/jpeg;base64,...)' });
    }
    const contentType = match[1];
    if (!contentType.startsWith('image/')) {
      return json(400, { error: 'Only image uploads are allowed' });
    }

    const buffer = Buffer.from(match[2], 'base64');
    if (buffer.length > MAX_BYTES) {
      return json(413, { error: `Image too large (max ${Math.round(MAX_BYTES / 1024 / 1024)}MB)` });
    }

    const storedKey = `${rawKey}-${Date.now()}`;
    try {
      await store.set(storedKey, buffer, { metadata: { contentType } });
    } catch (e) {
      return json(500, { error: 'Could not save image: ' + e.message });
    }

    return json(200, { url: `/api/image?key=${encodeURIComponent(storedKey)}` });
  }

  return json(405, { error: 'Method not allowed' });
};
