// Admin-only.
//   GET  /api/push-send  -> { count }   how many devices are subscribed
//   POST /api/push-send  -> { title, message, url? }  sends to every subscribed device
//
// Requires "Authorization: Bearer <admin token>" (same login as the CMS).
// Needs Netlify env vars: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT
// (VAPID_SUBJECT looks like "mailto:you@example.com").
//
// Devices that have uninstalled the app / revoked permission come back from
// the push service as 404/410 — those are deleted so the list stays clean.

const webpush = require('web-push');
const { getBlobStore } = require('./_blobs-store');
const { isAuthorized, json, CORS_HEADERS } = require('./_auth-helper');

const BATCH_SIZE = 25;           // devices sent to in parallel
const TIME_BUDGET_MS = 8000;     // stop starting new batches near Netlify's 10s limit

function clip(s, n) {
  return String(s == null ? '' : s).trim().slice(0, n);
}

// Only allow links back to this site (or a relative path) so the admin
// screen can't be used to push arbitrary external links.
function safeUrl(u) {
  const v = clip(u, 500);
  if (!v) return '/';
  if (v.charAt(0) === '/' && v.charAt(1) !== '/') return v;
  return /^https:\/\/(www\.)?drchandranir\.info(\/|$)/.test(v) ? v : '/';
}

async function listAllKeys(store) {
  const keys = [];
  let cursor;
  // Blobs list() returns { blobs: [{ key }] }; page through in case of many devices.
  do {
    const res = await store.list(cursor ? { cursor } : undefined);
    (res.blobs || []).forEach((b) => keys.push(b.key));
    cursor = res.cursor;
  } while (cursor);
  return keys;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }
  if (!isAuthorized(event.headers)) {
    return json(401, { error: 'Not logged in, or session expired. Please log in again.' });
  }

  const store = getBlobStore('push-subs');

  if (event.httpMethod === 'GET') {
    try {
      const keys = await listAllKeys(store);
      return json(200, { count: keys.length }, { 'Cache-Control': 'no-store' });
    } catch (e) {
      return json(500, { error: 'Could not read subscribers: ' + e.message });
    }
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    return json(500, {
      error: 'Push is not set up yet: add VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT in Netlify environment variables, then redeploy.',
    });
  }

  let body;
  try {
    body = JSON.parse(event.body || 'null');
  } catch (e) {
    return json(400, { error: 'Request body is not valid JSON' });
  }
  const title = clip(body && body.title, 80);
  const message = clip(body && body.message, 200);
  if (!title || !message) {
    return json(400, { error: 'Both a title and a message are required.' });
  }

  const payload = JSON.stringify({ title, body: message, url: safeUrl(body && body.url) });
  webpush.setVapidDetails(subject, pub, priv);

  let keys;
  try {
    keys = await listAllKeys(store);
  } catch (e) {
    return json(500, { error: 'Could not read subscribers: ' + e.message });
  }

  const started = Date.now();
  let sent = 0, removed = 0, failed = 0, skipped = 0;

  for (let i = 0; i < keys.length; i += BATCH_SIZE) {
    if (Date.now() - started > TIME_BUDGET_MS) {
      skipped = keys.length - i;
      break;
    }
    const batch = keys.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (key) => {
      let sub;
      try {
        sub = await store.get(key, { type: 'json' });
      } catch (e) { failed++; return; }
      if (!sub) return;
      try {
        await webpush.sendNotification(sub, payload, { TTL: 86400 });
        sent++;
      } catch (err) {
        if (err && (err.statusCode === 404 || err.statusCode === 410)) {
          try { await store.delete(key); } catch (e) { /* ignore */ }
          removed++;
        } else {
          failed++;
        }
      }
    }));
  }

  return json(200, { ok: true, total: keys.length, sent, removed, failed, skipped });
};
