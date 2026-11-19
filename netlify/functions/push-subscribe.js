// POST /api/push-subscribe
//   { action: "subscribe",   subscription: <PushSubscription JSON> }  -> saves this phone
//   { action: "unsubscribe", endpoint: "<endpoint url>" }             -> removes it
//
// Public (no login) — a patient's installed app calls this after they tap
// "Allow". Subscriptions live in the Netlify Blobs store "push-subs", one
// record per device, keyed by a hash of the push endpoint so the same phone
// subscribing twice just overwrites itself.

const crypto = require('crypto');
const { getBlobStore } = require('./_blobs-store');
const { json, CORS_HEADERS } = require('./_auth-helper');

const MAX_BODY_BYTES = 5000;

function keyFor(endpoint) {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

function validSubscription(sub) {
  if (!sub || typeof sub !== 'object') return false;
  if (typeof sub.endpoint !== 'string' || !/^https:\/\//.test(sub.endpoint)) return false;
  if (sub.endpoint.length > 1000) return false;
  const keys = sub.keys;
  return !!(keys && typeof keys.p256dh === 'string' && typeof keys.auth === 'string');
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }
  if ((event.body || '').length > MAX_BODY_BYTES) {
    return json(413, { error: 'Request too large' });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || 'null');
  } catch (e) {
    return json(400, { error: 'Request body is not valid JSON' });
  }
  if (!payload || typeof payload !== 'object') {
    return json(400, { error: 'Request body must be a JSON object' });
  }

  const store = getBlobStore('push-subs');

  try {
    if (payload.action === 'unsubscribe') {
      if (typeof payload.endpoint !== 'string' || !payload.endpoint) {
        return json(400, { error: 'Missing endpoint' });
      }
      await store.delete(keyFor(payload.endpoint));
      return json(200, { ok: true });
    }

    if (payload.action === 'subscribe') {
      const sub = payload.subscription;
      if (!validSubscription(sub)) {
        return json(400, { error: 'Invalid subscription' });
      }
      // Store only what is needed to send; nothing personal is collected.
      await store.setJSON(keyFor(sub.endpoint), {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        lang: typeof payload.lang === 'string' ? payload.lang.slice(0, 5) : '',
        createdAt: Date.now(),
      });
      return json(200, { ok: true });
    }
  } catch (e) {
    return json(500, { error: 'Could not update subscriptions: ' + e.message });
  }

  return json(400, { error: 'Unknown action' });
};
