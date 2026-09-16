// Wraps @netlify/blobs' getStore() so content.js and image.js keep working
// even when Netlify's automatic (zero-config) site/token handshake fails
// for this deploy (this is what caused the "MissingBlobsEnvironmentError"
// / random 502s on 2026-09-16).
//
// If BLOBS_SITE_ID and BLOBS_TOKEN are set as environment variables in the
// Netlify dashboard (Project configuration -> Environment variables), this
// uses them directly instead of relying on Netlify's automatic wiring.
// If they are NOT set yet, this falls back to the old automatic behavior,
// so merging this file alone never makes things worse.
const { getStore } = require('@netlify/blobs');

function getBlobStore(name) {
  const siteID = process.env.BLOBS_SITE_ID;
  const token = process.env.BLOBS_TOKEN;
  if (siteID && token) {
    return getStore({ name, siteID, token });
  }
  return getStore(name);
}

module.exports = { getBlobStore };
