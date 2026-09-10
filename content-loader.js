// ============================================================
// content-loader.js — fetches the CMS-edited content from the live
// admin API (/api/content?section=X, backed by Netlify Blobs and
// edited via the custom admin panel at /admin) and merges it into
// the app on every load. An edit saved in the admin panel is written
// straight to the blob store, so it shows up here on the very next
// load — no git commit, no rebuild.
//
// Kept as a separate "upgrade over the baked-in fallback" step
// (rather than making the API the only source) for the same reason
// as before: if a request ever fails (network hiccup, offline PWA
// use before the service worker has this exact version cached), the
// page still renders from whatever shipped in content-data.js
// instead of breaking.
// ============================================================

const CONTENT_URLS = {
  conditions:   "/api/content?section=conditions",
  treatments:   "/api/content?section=treatments",
  doctorBio:    "/api/content?section=doctor-bio",
  education:    "/api/content?section=education",
  videos:       "/api/content?section=videos",
  testimonials: "/api/content?section=testimonials",
  reviews:      "/api/content?section=reviews",
  siteText:     "/api/content?section=site-text",
  siteImages:   "/api/content?section=site-images",
};

async function fetchJSON(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Content fetch failed: ' + url + ' (' + res.status + ')');
  return res.json();
}

// Mutates an array in place so existing `const CONDITIONS` etc. bindings
// (and anything already holding a reference to them) see the update,
// without needing to reassign the const itself.
function replaceArrayContents(arr, newItems){
  arr.length = 0;
  newItems.forEach(it => arr.push(it));
}

function rebuildLookups(){
  Object.keys(conditionsById).forEach(k => delete conditionsById[k]);
  CONDITIONS.forEach(c => { if (c.id) conditionsById[c.id] = c; });
  Object.keys(treatmentsById).forEach(k => delete treatmentsById[k]);
  TREATMENTS.forEach(t => { if (t.id) treatmentsById[t.id] = t; });
}

/* ---------------- PER-FILE LOADERS ---------------- */

async function loadConditions(){
  const data = await fetchJSON(CONTENT_URLS.conditions);
  if (data.items && data.items.length) replaceArrayContents(CONDITIONS, data.items);
}
async function loadTreatments(){
  const data = await fetchJSON(CONTENT_URLS.treatments);
  if (data.items && data.items.length) replaceArrayContents(TREATMENTS, data.items);
}
async function loadDoctorBio(){
  const data = await fetchJSON(CONTENT_URLS.doctorBio);
  Object.assign(DOCTOR_BIO, data);
}
async function loadEducation(){
  const data = await fetchJSON(CONTENT_URLS.education);
  if (data.items && data.items.length) replaceArrayContents(EDUCATION, data.items);
}
async function loadVideos(){
  const data = await fetchJSON(CONTENT_URLS.videos);
  if (data.items && data.items.length) replaceArrayContents(VIDEOS, data.items);
}
async function loadTestimonials(){
  const data = await fetchJSON(CONTENT_URLS.testimonials);
  if (data.items && data.items.length) replaceArrayContents(TESTIMONIALS, data.items);
}
async function loadReviews(){
  const data = await fetchJSON(CONTENT_URLS.reviews);
  if (data.items && data.items.length) replaceArrayContents(REVIEWS, data.items);
}
// Editable short phrases used in the header, homepage hero, and splash
// (name/role/tagline) — anything tied to a data-i18n key.
async function loadSiteText(){
  const data = await fetchJSON(CONTENT_URLS.siteText);
  Object.keys(data).forEach(key => {
    if (!UI[key]) return; // unknown/renamed key — skip rather than create a broken one
    UI[key] = data[key];
  });
}
// Doctor photo, clinic logo, and the two splash backgrounds — every
// <img data-img-src="X"> on the page gets pointed at whatever path this
// file currently holds for X, so uploading a replacement in the CMS
// (which saves to a new file and updates this JSON) takes effect without
// touching any markup.
async function loadSiteImages(){
  const data = await fetchJSON(CONTENT_URLS.siteImages);
  Object.keys(data).forEach(key => {
    document.querySelectorAll('img[data-img-src="' + key + '"]').forEach(img => { img.src = data[key]; });
  });
}

/* ---------------- ORCHESTRATION ---------------- */
async function loadLiveContent(){
  // allSettled: one file failing (missing, malformed, offline) never
  // blocks the others — each section just keeps its fallback content.
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

// The page already rendered once from the baked-in fallback (content-data.js)
// by the time this script runs — this just quietly upgrades it in place.
let lastLiveContentLoad = Date.now();
loadLiveContent().catch(()=>{}).finally(() => { lastLiveContentLoad = Date.now(); });

// ---------------- REFRESH ON RETURN TO FOREGROUND ----------------
// Installed/standalone apps (added to home screen) are usually frozen in
// the background instead of being fully reloaded when reopened, so without
// this, the content would only ever reflect whatever was live at the last
// real cold start. Re-run the same load whenever the app becomes visible
// again, throttled so rapid app-switching doesn't refetch on every glance.
const LIVE_CONTENT_REFRESH_THROTTLE_MS = 60 * 1000;

function refreshLiveContentIfDue(){
  if (Date.now() - lastLiveContentLoad < LIVE_CONTENT_REFRESH_THROTTLE_MS) return;
  lastLiveContentLoad = Date.now();
  loadLiveContent().catch(()=>{});
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') refreshLiveContentIfDue();
});

// iOS/Android sometimes restore a page from the back-forward cache instead
// of firing visibilitychange at all — this covers that case too.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) refreshLiveContentIfDue();
});
