// build-marker: 2026-09-01-b (forces Netlify to re-bundle/re-upload this
// function instead of reusing a cached artifact from before the
// @supabase/supabase-js dependency was actually installed — see
// cms-build-log for the "0 new function(s) to upload" issue this fixes)
// Shared Supabase client helper, service-role key only — this file is
// require()'d only from other Netlify Functions (server-side), never
// shipped to the browser. If the env vars aren't set yet (Supabase
// project not created / configured), getSupabase() returns null and
// callers fall back to the bundled content/*.json files instead of
// erroring out.
const { createClient } = require('@supabase/supabase-js');

let client = null;

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!client) client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

module.exports = { getSupabase };
