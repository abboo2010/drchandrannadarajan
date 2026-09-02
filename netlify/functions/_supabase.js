// build-marker: 2026-09-01-c
// Talks to Supabase directly over its REST API (PostgREST for the table,
// the Storage HTTP API for images) using plain fetch — no
// @supabase/supabase-js dependency. That package pulls in a realtime/
// websocket sub-dependency that isn't needed for simple table reads/
// upserts and file uploads, and repeatedly failed to deploy correctly as
// a bundled Netlify Function in this project (see cms-build-log). Using
// fetch directly removes the whole class of "did the dependency actually
// get bundled this time" problems — there's nothing to bundle.
//
// This file is require()'d only from other Netlify Functions (server-side),
// never shipped to the browser. Returns null from getSupabaseConfig() if
// the env vars aren't set yet, so callers fall back to bundled content.

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url: url.replace(/\/+$/, ''), key };
}

// GET the current row's `data` column for one section, or null if no row
// exists yet. Throws on a genuine network/HTTP error (caller decides what
// to do — content.js falls back to bundled JSON).
async function fetchSectionRow(section) {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const res = await fetch(
    `${cfg.url}/rest/v1/content_sections?section=eq.${encodeURIComponent(section)}&select=data`,
    { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } }
  );
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0].data : null;
}

// Upsert a section's whole JSON blob (PostgREST upsert via
// Prefer: resolution=merge-duplicates against the `section` primary key).
async function upsertSectionRow(section, data) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/rest/v1/content_sections`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ section, data, updated_at: new Date().toISOString() }]),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase write failed (${res.status})${text ? ': ' + text : ''}`);
  }
}

// Upload a buffer to a public Storage bucket, return its public URL.
async function uploadToStorage(bucket, key, buffer, contentType) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/storage/v1/object/${bucket}/${key}`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase upload failed (${res.status})${text ? ': ' + text : ''}`);
  }
  return `${cfg.url}/storage/v1/object/public/${bucket}/${key}`;
}

// ---- admin_users (CMS login accounts) ----

// One row (username + password_hash + sections) or null if that username
// doesn't exist.
async function fetchAdminUser(username) {
  const cfg = getSupabaseConfig();
  if (!cfg) return null;
  const res = await fetch(
    `${cfg.url}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}&select=username,password_hash,sections`,
    { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` } }
  );
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const rows = await res.json();
  return Array.isArray(rows) && rows.length ? rows[0] : null;
}

// How many accounts exist — used to gate the one-time legacy-password bootstrap.
async function countAdminUsers() {
  const cfg = getSupabaseConfig();
  if (!cfg) return 0;
  const res = await fetch(`${cfg.url}/rest/v1/admin_users?select=username`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  const rows = await res.json();
  return Array.isArray(rows) ? rows.length : 0;
}

// All accounts (username + sections + created_at — password_hash never leaves here).
async function listAdminUsers() {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/rest/v1/admin_users?select=username,sections,created_at&order=created_at.asc`, {
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  });
  if (!res.ok) throw new Error(`Supabase read failed (${res.status})`);
  return res.json();
}

// Create a new account, or fully replace an existing one's password AND
// permissions together (upsert on the username primary key). Use
// updateAdminUserSections instead when only permissions are changing —
// this always overwrites password_hash too.
async function upsertAdminUser(username, passwordHash, sections) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/rest/v1/admin_users`, {
    method: 'POST',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify([{ username, password_hash: passwordHash, sections: sections || [] }]),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase write failed (${res.status})${text ? ': ' + text : ''}`);
  }
}

// Change only which sections an existing account can access — leaves its
// password untouched (a plain PATCH, not an upsert, so there's no need to
// know or re-send the password hash just to tick a checkbox).
async function updateAdminUserSections(username, sections) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}`, {
    method: 'PATCH',
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({ sections: sections || [] }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase write failed (${res.status})${text ? ': ' + text : ''}`);
  }
}

async function deleteAdminUser(username) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase not configured');
  const res = await fetch(`${cfg.url}/rest/v1/admin_users?username=eq.${encodeURIComponent(username)}`, {
    method: 'DELETE',
    headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase delete failed (${res.status})${text ? ': ' + text : ''}`);
  }
}

module.exports = {
  getSupabaseConfig, fetchSectionRow, upsertSectionRow, uploadToStorage,
  fetchAdminUser, countAdminUsers, listAdminUsers, upsertAdminUser,
  updateAdminUserSections, deleteAdminUser,
};
