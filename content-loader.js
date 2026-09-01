// ============================================================
// content-loader.js — fetches live content from /api/content
// (Netlify Functions backed by Supabase) and merges it into the
// app on every load. Replaces the old sheets-loader.js (Google
// Sheets CSV) now that content is edited through the /admin CMS.
//
// Same resilience pattern as before: the page already rendered
// once from the baked-in fallback (content-data.js/data.js/
// image-data.js) by the time this runs — this just quietly
// upgrades it in place. One section failing (offline, Supabase
// not configured yet) never blocks the others via Promise.allSettled,
// and content.js itself falls back to the bundled content/*.json
// server-side too, so a fresh section with nothing saved yet still
// renders correctly.
// ============================================================

async function fetchSection(section) {
  const res = await fetch('/api/content?section=' + encodeURIComponent(section), { cache: 'no-store' });
  if (!res.ok) throw new Error('content fetch failed: ' + section + ' ' + res.status);
  return res.json();
}

// Mutates an array in place so existing `const CONDITIONS` etc. bindings
// (and anything already holding a reference to them) see the update,
// without needing to reassign the const itself.
function replaceArrayContents(arr, newItems) {
  arr.length = 0;
  newItems.forEach(it => arr.push(it));
}

function rebuildLookups() {
  Object.keys(conditionsById).forEach(k => delete conditionsById[k]);
  CONDITIONS.forEach(c => { if (c.id) conditionsById[c.id] = c; });
  Object.keys(treatmentsById).forEach(k => delete treatmentsById[k]);
  TREATMENTS.forEach(t => { if (t.id) treatmentsById[t.id] = t; });
}

async function loadConditions() {
  const data = await fetchSection('conditions');
  if (Array.isArray(data) && data.length) replaceArrayContents(CONDITIONS, data);
}
async function loadTreatments() {
  const data = await fetchSection('treatments');
  if (Array.isArray(data) && data.length) replaceArrayContents(TREATMENTS, data);
}
async function loadEducation() {
  const data = await fetchSection('education');
  if (Array.isArray(data) && data.length) replaceArrayContents(EDUCATION, data);
}
async function loadVideos() {
  const data = await fetchSection('videos');
  if (Array.isArray(data) && data.length) replaceArrayContents(VIDEOS, data);
}
async function loadTestimonials() {
  const data = await fetchSection('testimonials');
  if (Array.isArray(data) && data.length) replaceArrayContents(TESTIMONIALS, data);
}
async function loadReviews() {
  const data = await fetchSection('reviews');
  if (Array.isArray(data) && data.length) replaceArrayContents(REVIEWS, data);
}
async function loadDoctorBio() {
  const data = await fetchSection('doctor-bio');
  if (data && typeof data === 'object') Object.assign(DOCTOR_BIO, data);
}
async function loadSiteText() {
  const data = await fetchSection('site-text');
  if (!data) return;
  Object.keys(data).forEach(key => {
    if (UI[key] && data[key]) Object.assign(UI[key], data[key]);
  });
}
async function loadSiteImages() {
  const data = await fetchSection('site-images');
  if (!data) return;
  const apply = (slot, url) => {
    if (!url) return;
    document.querySelectorAll('img[data-img-src="' + slot + '"]').forEach(img => { img.src = url; });
  };
  apply('doctor', data.doctor);
  apply('logo', data.logo);
  apply('splashbg', data.splashbg);
  apply('splashbgmobile', data.splashbgmobile);
}

/* ---------------- ORCHESTRATION ---------------- */
async function loadLiveContent() {
  // allSettled: one section failing never blocks the others — each just
  // keeps its fallback content.
  await Promise.allSettled([
    loadConditions(), loadTreatments(), loadDoctorBio(),
    loadEducation(), loadVideos(), loadTestimonials(), loadReviews(),
    loadSiteText(), loadSiteImages(),
  ]);

  rebuildLookups();
  renderNav(); renderBottomNav();
  renderConditions(); renderTreatments();
  renderEducation(); renderVideos();
  renderTestimonials(); renderReviews();
  renderDoctorBio();
  applyUI();

  // If a detail page happens to be open already, refresh it with the new data too
  const activePanel = document.querySelector('.panel.active');
  const activeId = activePanel ? activePanel.dataset.panel : null;
  if (activeId === 'condition-detail' && lastDetail.type === 'condition') showConditionDetail(lastDetail.id);
  if (activeId === 'treatment-detail' && lastDetail.type === 'treatment') showTreatmentDetail(lastDetail.id);
}

let lastLiveContentLoad = Date.now();
loadLiveContent().catch(() => {}).finally(() => { lastLiveContentLoad = Date.now(); });

// ---------------- REFRESH ON RETURN TO FOREGROUND ----------------
// Installed/standalone apps (added to home screen) are usually frozen in
// the background instead of being fully reloaded when reopened, so without
// this, an admin edit would only show up at the next real cold start.
// Re-run the same load whenever the app becomes visible again, throttled
// so rapid app-switching doesn't refetch on every glance.
const LIVE_CONTENT_REFRESH_THROTTLE_MS = 60 * 1000;

function refreshLiveContentIfDue() {
  if (Date.now() - lastLiveContentLoad < LIVE_CONTENT_REFRESH_THROTTLE_MS) return;
  lastLiveContentLoad = Date.now();
  loadLiveContent().catch(() => {});
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshLiveContentIfDue();
});

// iOS/Android sometimes restore a page from the back-forward cache instead
// of firing visibilitychange at all — this covers that case too.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) refreshLiveContentIfDue();
});
