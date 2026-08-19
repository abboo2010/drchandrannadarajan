// ============================================================
// sheets-loader.js — fetches live content from your published
// Google Sheet (one CSV per tab) and merges it into the app on
// every load. If a fetch fails (offline, sheet unreachable, a
// tab renamed/unpublished), that section silently keeps whatever
// was already baked in from content-data.js — the app never
// breaks, it just won't show your latest edit until the sheet is
// reachable again.
//
// To point this at a different spreadsheet: replace the 7 URLs
// below with fresh ones from File > Share > Publish to web,
// one per tab, each as "Comma-separated values (.csv)".
// ============================================================

const SHEET_URLS = {
  conditions:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=329777031&single=true&output=csv",
  treatments:   "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=1645090722&single=true&output=csv",
  doctorBio:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=364954468&single=true&output=csv",
  education:    "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=1913386333&single=true&output=csv",
  videos:       "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=991388330&single=true&output=csv",
  testimonials: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=37369027&single=true&output=csv",
  reviews:      "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=2001278192&single=true&output=csv",
  siteText:     "https://docs.google.com/spreadsheets/d/e/2PACX-1vTtPbm6DHSRK0MfstKlRfA9lICSbsNxW4Eaw7Jf9N4kUj1K2wWoyO5XJadlvsmkFFvD8HBG2Tkl1CqN/pub?gid=291625750&single=true&output=csv",
};

/* ---------------- CSV PARSING ---------------- */
// Handles quoted fields with embedded commas, newlines, and escaped
// quotes ("") — a plain text.split(',') would break on your multi-line
// Symptoms/Steps/Bio cells, so this is a real (if minimal) CSV parser.
function parseCSV(text){
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++){
    const c = text[i], next = text[i+1];
    if (inQuotes){
      if (c === '"' && next === '"'){ field += '"'; i++; }
      else if (c === '"'){ inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"'){ inQuotes = true; }
      else if (c === ','){ row.push(field); field = ''; }
      else if (c === '\r'){ /* ignore, \n handles the line break */ }
      else if (c === '\n'){ row.push(field); rows.push(row); row = []; field = ''; }
      else { field += c; }
    }
  }
  if (field.length || row.length){ row.push(field); rows.push(row); }
  return rows;
}

function csvToObjects(text){
  const rows = parseCSV(text).filter(r => r.some(c => (c || '').trim() !== ''));
  if (!rows.length) return [];
  const headers = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || '').trim(); });
    return obj;
  });
}

// "- item one\n- item two" (the spreadsheet's list-field convention) -> ["item one","item two"]
function parseListField(text){
  if (!text) return [];
  return text.split('\n').map(l => l.replace(/^-\s*/, '').trim()).filter(Boolean);
}

async function fetchSheet(url){
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Sheet fetch failed: ' + res.status);
  return csvToObjects(await res.text());
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

/* ---------------- PER-SHEET LOADERS ---------------- */
// Each inherits icon/color from the matching baked-in fallback item
// (matched by ID for conditions/treatments, by row position for the
// rest) since those are design choices, not something the sheet edits.

async function loadConditions(){
  const rows = await fetchSheet(SHEET_URLS.conditions);
  const byId = Object.fromEntries(CONDITIONS.map(c => [c.id, c]));
  const out = rows.map(r => {
    const id = r['ID (do not edit)'];
    const existing = byId[id] || {};
    return {
      id,
      icon: existing.icon || 'stethoscope',
      color: existing.color || '#14b8a6',
      title_en: r['Title EN'], title_bm: r['Title BM'], title_zh: r['Title ZH'],
      tag_en: r['Tag EN'], tag_bm: r['Tag BM'], tag_zh: r['Tag ZH'],
      desc_en: r['Short Desc EN'], desc_bm: r['Short Desc BM'], desc_zh: r['Short Desc ZH'],
      overview_en: r['Overview EN'], overview_bm: r['Overview BM'], overview_zh: r['Overview ZH'],
      symptoms_en: parseListField(r['Symptoms EN']), symptoms_bm: parseListField(r['Symptoms BM']), symptoms_zh: parseListField(r['Symptoms ZH']),
      causes_en: parseListField(r['Causes EN']), causes_bm: parseListField(r['Causes BM']), causes_zh: parseListField(r['Causes ZH']),
      diagnosis_en: r['Diagnosis EN'], diagnosis_bm: r['Diagnosis BM'], diagnosis_zh: r['Diagnosis ZH'],
      related: r['Related Treatment IDs (comma-separated)'] || '',
    };
  }).filter(c => c.id);
  if (out.length) replaceArrayContents(CONDITIONS, out);
}

async function loadTreatments(){
  const rows = await fetchSheet(SHEET_URLS.treatments);
  const byId = Object.fromEntries(TREATMENTS.map(t => [t.id, t]));
  const out = rows.map(r => {
    const id = r['ID (do not edit)'];
    const existing = byId[id] || {};
    return {
      id,
      icon: existing.icon || 'syringe2',
      color: existing.color || '#8b5cf6',
      title_en: r['Title EN'], title_bm: r['Title BM'], title_zh: r['Title ZH'],
      tag_en: r['Tag EN'], tag_bm: r['Tag BM'], tag_zh: r['Tag ZH'],
      desc_en: r['Short Desc EN'], desc_bm: r['Short Desc BM'], desc_zh: r['Short Desc ZH'],
      overview_en: r['Overview EN'], overview_bm: r['Overview BM'], overview_zh: r['Overview ZH'],
      steps_en: parseListField(r['Steps EN']), steps_bm: parseListField(r['Steps BM']), steps_zh: parseListField(r['Steps ZH']),
      benefits_en: parseListField(r['Benefits EN']), benefits_bm: parseListField(r['Benefits BM']), benefits_zh: parseListField(r['Benefits ZH']),
      recovery_en: r['Recovery EN'], recovery_bm: r['Recovery BM'], recovery_zh: r['Recovery ZH'],
      related: r['Related Condition IDs (comma-separated)'] || '',
    };
  }).filter(t => t.id);
  if (out.length) replaceArrayContents(TREATMENTS, out);
}

async function loadDoctorBio(){
  const rows = await fetchSheet(SHEET_URLS.doctorBio);
  const byField = {};
  rows.forEach(r => { byField[r['Field']] = r; });
  if (!Object.keys(byField).length) return;

  const get = (label, lang) => {
    const r = byField[label];
    if (!r) return '';
    return lang === 'en' ? r['English'] : lang === 'bm' ? r['Bahasa Melayu'] : r['Chinese'];
  };

  ['en','bm','zh'].forEach(lang => {
    const cred = get('Credential line (under name)', lang);
    const bio = get('Bio paragraph', lang);
    if (cred) DOCTOR_BIO['credLine_' + lang] = cred;
    if (bio) DOCTOR_BIO['bio_' + lang] = bio;
  });

  const credentials = [];
  for (let i = 1; i <= 8; i++){
    const label = 'Credential bullet ' + i;
    if (!byField[label]) continue;
    credentials.push({ text_en: get(label,'en'), text_bm: get(label,'bm'), text_zh: get(label,'zh') });
  }
  if (credentials.length) DOCTOR_BIO.credentials = credentials;

  const specialties = [];
  for (let i = 1; i <= 8; i++){
    const label = 'Specialty tag ' + i;
    if (!byField[label]) continue;
    specialties.push({ text_en: get(label,'en'), text_bm: get(label,'bm'), text_zh: get(label,'zh') });
  }
  if (specialties.length) DOCTOR_BIO.specialties = specialties;
}

async function loadEducation(){
  const rows = await fetchSheet(SHEET_URLS.education);
  const out = rows.map((r, i) => {
    const existing = EDUCATION[i] || {};
    return {
      icon: existing.icon || 'document',
      color: existing.color || '#f97316',
      title_en: r['Title EN'], title_bm: r['Title BM'], title_zh: r['Title ZH'],
      tag_en: r['Tag EN'], tag_bm: r['Tag BM'], tag_zh: r['Tag ZH'],
      desc_en: r['Desc EN'], desc_bm: r['Desc BM'], desc_zh: r['Desc ZH'],
    };
  }).filter(e => e.title_en);
  if (out.length) replaceArrayContents(EDUCATION, out);
}

async function loadVideos(){
  const rows = await fetchSheet(SHEET_URLS.videos);
  const out = rows.map(r => ({
    title_en: r['Title EN'], title_bm: r['Title BM'], title_zh: r['Title ZH'],
    length: r['Length (mm:ss)'],
    file: r['Video URL/filename'],
  })).filter(v => v.title_en);
  if (out.length) replaceArrayContents(VIDEOS, out);
}

async function loadTestimonials(){
  const rows = await fetchSheet(SHEET_URLS.testimonials);
  const out = rows.map((r, i) => {
    const existing = TESTIMONIALS[i] || {};
    return {
      name: r['Patient Name'],
      color: existing.color || '#2f6fed',
      meta_en: r['Meta EN (procedure · year)'], meta_bm: r['Meta BM'], meta_zh: r['Meta ZH'],
      quote_en: r['Quote EN'], quote_bm: r['Quote BM'], quote_zh: r['Quote ZH'],
    };
  }).filter(t => t.name);
  if (out.length) replaceArrayContents(TESTIMONIALS, out);
}

async function loadReviews(){
  const rows = await fetchSheet(SHEET_URLS.reviews);
  const out = rows.map((r, i) => {
    const existing = REVIEWS[i] || {};
    return {
      name: r['Reviewer Name'],
      color: existing.color || '#eab308',
      stars: parseInt(r['Star Rating (1-5)'], 10) || 5,
      quote_en: r['Quote EN'], quote_bm: r['Quote BM'], quote_zh: r['Quote ZH'],
    };
  }).filter(r => r.name);
  if (out.length) replaceArrayContents(REVIEWS, out);
}

// Editable short phrases used in the header, homepage hero, and splash
// (name/role/tagline) — anything tied to a data-i18n key. One row per
// phrase; the "Key" column must match the key already in data.js exactly.
async function loadSiteText(){
  const rows = await fetchSheet(SHEET_URLS.siteText);
  rows.forEach(r => {
    const key = r['Key (do not edit)'];
    if (!key || !UI[key]) return; // unknown/renamed key — skip rather than create a broken one
    if (r['English']) UI[key].en = r['English'];
    if (r['Bahasa Melayu']) UI[key].bm = r['Bahasa Melayu'];
    if (r['Chinese']) UI[key].zh = r['Chinese'];
  });
}

/* ---------------- ORCHESTRATION ---------------- */
async function loadLiveContent(){
  // allSettled: one tab failing (renamed, unpublished, offline) never
  // blocks the others — each section just keeps its fallback content.
  await Promise.allSettled([
    loadConditions(), loadTreatments(), loadDoctorBio(),
    loadEducation(), loadVideos(), loadTestimonials(), loadReviews(),
    loadSiteText(),
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
loadLiveContent().catch(()=>{});
