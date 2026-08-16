// ============================================================
// script.js — all rendering logic and interactivity.
// Reads content from content-data.js (CONDITIONS, TREATMENTS,
// DOCTOR_BIO, EDUCATION, VIDEOS, TESTIMONIALS, REVIEWS) and
// interface config from data.js (ICONS, UI, NAV).
// ============================================================

// tf() reads a flat CMS-style field: obj.field_en / field_bm / field_zh,
// falling back to English if the current language's value is blank.
function tf(obj, field){
  return obj[field + '_' + currentLang] || obj[field + '_en'] || '';
}

const navList = document.getElementById('navList');
function renderNav(){
  navList.innerHTML = '';
  NAV.forEach(item=>{
    const btn = document.createElement('button');
    btn.className = 'nav-btn' + (item.id==='home' ? ' active' : '');
    btn.dataset.target = item.id;
    btn.innerHTML = `<span class="ico">${svgIcon(item.icon,22)}</span><span>${L(item.label)}</span>`;
    btn.onclick = ()=>showPanel(item.id);
    navList.appendChild(btn);
  });
}
renderNav();

function showPanel(id, navOverrideId){
  document.querySelectorAll('.panel').forEach(p=>p.classList.toggle('active', p.dataset.panel===id));
  const navId = navOverrideId || id;
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.target===navId));
  document.querySelectorAll('.bottom-nav-item').forEach(b=>b.classList.toggle('active', b.dataset.bnTarget===navId));
  document.getElementById('content').scrollTop = 0;
  closeSidebarDrawer();
}

/* ---------------- MOBILE SIDEBAR DRAWER ---------------- */
function openSidebarDrawer(){
  document.querySelector('.sidebar').classList.add('open');
  document.getElementById('sidebarBackdrop').classList.add('show');
}
function closeSidebarDrawer(){
  document.querySelector('.sidebar').classList.remove('open');
  document.getElementById('sidebarBackdrop').classList.remove('show');
}
document.getElementById('hamburgerBtn').onclick = ()=>{
  const sb = document.querySelector('.sidebar');
  sb.classList.contains('open') ? closeSidebarDrawer() : openSidebarDrawer();
};
document.getElementById('sidebarBackdrop').onclick = closeSidebarDrawer;

/* ---------------- BOTTOM NAV BAR (mobile-app style, all sections) ---------------- */
const bottomNav = document.getElementById('bottomNav');
function renderBottomNav(){
  bottomNav.innerHTML = '';
  NAV.forEach(item=>{
    const btn = document.createElement('button');
    btn.className = 'bottom-nav-item' + (item.id==='home' ? ' active' : '');
    btn.dataset.bnTarget = item.id;
    btn.onclick = ()=>showPanel(item.id);
    btn.innerHTML = `<span class="bn-ico">${svgIcon(item.icon,20)}</span><span class="bn-label">${L(item.label)}</span>`;
    bottomNav.appendChild(btn);
  });
}
renderBottomNav();

/* ---------------- CONDITIONS ---------------- */
const conditionsGrid = document.getElementById('conditionsGrid');
function renderConditions(){
  conditionsGrid.innerHTML = '';
  CONDITIONS.forEach(c=>{
    conditionsGrid.innerHTML += `
      <div class="info-card" onclick="showConditionDetail('${c.id}')">
        <div class="info-ico" style="background:${c.color};color:#fff;">${svgIcon(c.icon,24)}</div>
        <span class="pill">${tf(c,'tag')}</span>
        <h3>${tf(c,'title')}</h3>
        <p>${tf(c,'desc')}</p>
      </div>`;
  });
}
renderConditions();

/* ---------------- TREATMENTS ---------------- */
const treatmentsGrid = document.getElementById('treatmentsGrid');
function renderTreatments(){
  treatmentsGrid.innerHTML = '';
  TREATMENTS.forEach(t=>{
    treatmentsGrid.innerHTML += `
      <div class="info-card" onclick="showTreatmentDetail('${t.id}')">
        <div class="info-ico" style="background:${t.color};color:#fff;">${svgIcon(t.icon,24)}</div>
        <span class="pill">${tf(t,'tag')}</span>
        <h3>${tf(t,'title')}</h3>
        <p>${tf(t,'desc')}</p>
      </div>`;
  });
}
renderTreatments();

/* ---------------- LOOKUPS + DETAIL PAGE RENDERING ---------------- */
const conditionsById = Object.fromEntries(CONDITIONS.map(c=>[c.id,c]));
const treatmentsById = Object.fromEntries(TREATMENTS.map(t=>[t.id,t]));

function tfArr(obj, field){
  return obj[field + '_' + currentLang] || obj[field + '_en'] || [];
}
function listHtml(arr, iconType){
  // iconType: 'check' for symptom/cause lists, 'num' for step lists
  return `<ul class="detail-list">${(arr||[]).map((it,i)=>`
    <li>${iconType==='num'
        ? `<span class="num">${i+1}</span>`
        : `<span class="check">${svgIcon('check',16)}</span>`}
      <span>${it}</span>
    </li>`).join('')}</ul>`;
}

let lastDetail = {type:null, id:null};

function showConditionDetail(id){
  const c = conditionsById[id];
  if(!c) return;
  lastDetail = {type:'condition', id};
  const relatedHtml = (c.related||'').split(',').map(x=>x.trim()).filter(Boolean).map(tid=>{
    const t = treatmentsById[tid];
    if(!t) return '';
    return `<div class="related-card" onclick="showTreatmentDetail('${t.id}')">
      <div class="related-ico" style="background:${t.color};">${svgIcon(t.icon,20)}</div>
      <div><h4>${tf(t,'title')}</h4><span>${L(UI.treatmentOption)}</span></div>
    </div>`;
  }).join('');

  document.getElementById('conditionDetailBody').innerHTML = `
    <div class="detail-head">
      <div class="detail-ico" style="background:${c.color};">${svgIcon(c.icon,32)}</div>
      <div><div class="detail-tag">${tf(c,'tag')}</div><h1>${tf(c,'title')}</h1></div>
    </div>
    <div class="detail-grid">
      <div>
        <div class="detail-card"><h3>${L(UI.overview)}</h3><p>${tf(c,'overview')}</p></div>
        <div class="detail-card"><h3>${L(UI.commonSymptoms)}</h3>${listHtml(tfArr(c,'symptoms'))}</div>
        <div class="detail-card"><h3>${L(UI.commonCauses)}</h3>${listHtml(tfArr(c,'causes'))}</div>
        <div class="detail-card"><h3>${L(UI.howDiagnosed)}</h3><p>${tf(c,'diagnosis')}</p></div>
      </div>
      <div>
        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L((c.related||'').split(',').filter(Boolean).length>1?UI.relatedTreatments:UI.relatedTreatment)}</h3>
        ${relatedHtml}
        <div class="cta-card" style="margin-top:16px;">
          <p>${L(UI.questionsAboutCondition)}</p>
          <button class="submit-btn" onclick="showPanel('appointment')">${L(UI.bookConsultation)}</button>
        </div>
      </div>
    </div>`;
  showPanel('condition-detail', 'conditions');
}

function showTreatmentDetail(id){
  const t = treatmentsById[id];
  if(!t) return;
  lastDetail = {type:'treatment', id};
  const relatedHtml = (t.related||'').split(',').map(x=>x.trim()).filter(Boolean).map(cid=>{
    const c = conditionsById[cid];
    if(!c) return '';
    return `<div class="related-card" onclick="showConditionDetail('${c.id}')">
      <div class="related-ico" style="background:${c.color};">${svgIcon(c.icon,20)}</div>
      <div><h4>${tf(c,'title')}</h4><span>${L(UI.conditionTreated)}</span></div>
    </div>`;
  }).join('');

  document.getElementById('treatmentDetailBody').innerHTML = `
    <div class="detail-head">
      <div class="detail-ico" style="background:${t.color};">${svgIcon(t.icon,32)}</div>
      <div><div class="detail-tag">${tf(t,'tag')}</div><h1>${tf(t,'title')}</h1></div>
    </div>
    <div class="detail-grid">
      <div>
        <div class="detail-card"><h3>${L(UI.overview)}</h3><p>${tf(t,'overview')}</p></div>
        <div class="detail-card"><h3>${L(UI.howItWorks)}</h3>${listHtml(tfArr(t,'steps'), 'num')}</div>
        <div class="detail-card"><h3>${L(UI.benefits)}</h3>${listHtml(tfArr(t,'benefits'))}</div>
        <div class="detail-card"><h3>${L(UI.recovery)}</h3><p>${tf(t,'recovery')||''}</p></div>
      </div>
      <div>
        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L((t.related||'').split(',').filter(Boolean).length>1?UI.conditionsThisTreatsPlural:UI.conditionsThisTreats)}</h3>
        ${relatedHtml}
        <div class="cta-card" style="margin-top:16px;">
          <p>${L(UI.curiousAboutTreatment)}</p>
          <button class="submit-btn" onclick="showPanel('appointment')">${L(UI.bookConsultation)}</button>
        </div>
      </div>
    </div>`;
  showPanel('treatment-detail', 'treatments');
}

/* ---------------- VIDEOS ---------------- */
const SAMPLE_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';
const videoGrid = document.getElementById('videoGrid');
function renderVideos(){
  videoGrid.innerHTML = '';
  VIDEOS.forEach(v=>{
    const title = tf(v,'title');
    videoGrid.innerHTML += `
      <div class="video-card" onclick="openVideo('${v.file}', '${title.replace(/'/g,"\\'")}')">
        <div class="video-thumb"><div class="play-circle" style="color:var(--navy-900);">${svgIcon('play',22)}</div><span class="duration">${v.length}</span></div>
        <div class="video-info"><h4>${title}</h4><span>${L(UI.patientEducationSeries)}</span></div>
      </div>`;
  });
}
renderVideos();

function getYouTubeId(url){
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
  return m ? m[1] : null;
}

function openVideo(url, title){
  const modal = document.getElementById('videoModal');
  const wrap = document.getElementById('modalVideoWrap');
  const fallback = document.getElementById('modalYtFallback');
  const ytId = getYouTubeId(url);

  if(ytId){
    const origin = (location.protocol === 'http:' || location.protocol === 'https:') ? `&origin=${encodeURIComponent(location.origin)}` : '';
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0${origin}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
    fallback.href = `https://www.youtube.com/watch?v=${ytId}`;
    fallback.style.display = 'flex';
  } else {
    wrap.innerHTML = `<video id="modalVideo" controls playsinline preload="auto" src="${url}"></video>`;
    fallback.style.display = 'none';
    const videoEl = document.getElementById('modalVideo');
    // Try to autoplay (allowed since this runs from a real click); if the
    // browser blocks it, the video still shows its first frame instead of
    // staying on a blank black box, and the visible controls let the
    // person press play themselves.
    const tryPlay = ()=> videoEl.play().catch(()=>{});
    videoEl.addEventListener('loadeddata', tryPlay, { once: true });
    tryPlay();
  }
  document.getElementById('modalVideoTitle').textContent = title;
  modal.classList.add('show');
}
function closeVideoModal(){
  const modal = document.getElementById('videoModal');
  document.getElementById('modalVideoWrap').innerHTML = '';
  document.getElementById('modalYtFallback').style.display = 'none';
  modal.classList.remove('show');
}

/* ---------------- EDUCATION ---------------- */
const educationGrid = document.getElementById('educationGrid');
function renderEducation(){
  educationGrid.innerHTML = '';
  EDUCATION.forEach(e=>{
    educationGrid.innerHTML += `
      <div class="info-card">
        <div class="info-ico" style="background:${e.color};color:#fff;">${svgIcon(e.icon,24)}</div>
        <span class="pill">${tf(e,'tag')}</span>
        <h3>${tf(e,'title')}</h3>
        <p>${tf(e,'desc')}</p>
      </div>`;
  });
}
renderEducation();

/* ---------------- TESTIMONIALS ---------------- */
const testimonialGrid = document.getElementById('testimonialGrid');
function renderTestimonials(){
  testimonialGrid.innerHTML = '';
  TESTIMONIALS.forEach(t=>{
    const initials = t.name.split(' ').map(w=>w[0]).join('');
    testimonialGrid.innerHTML += `
      <div class="test-card">
        <div class="avatar" style="background:${t.color}">${initials}</div>
        <div>
          <div class="test-name">${t.name}</div>
          <div class="test-meta">${tf(t,'meta')}</div>
          <div class="test-quote">"${tf(t,'quote')}"</div>
        </div>
      </div>`;
  });
}
renderTestimonials();

/* ---------------- REVIEWS ---------------- */
const reviewGrid = document.getElementById('reviewGrid');
function renderReviews(){
  reviewGrid.innerHTML = '';
  REVIEWS.forEach(r=>{
    const initials = r.name.split(' ').map(w=>w[0]).join('');
    reviewGrid.innerHTML += `
      <div class="test-card">
        <div class="avatar" style="background:${r.color}">${initials}</div>
        <div>
          <div class="test-name">${r.name}</div>
          <div class="stars">${'★'.repeat(r.stars)}${'☆'.repeat(5-r.stars)}</div>
          <div class="test-quote">"${tf(r,'quote')}"</div>
        </div>
      </div>`;
  });
}
renderReviews();

/* ---------------- DOCTOR BIO (from content-data.js, CMS-editable) ---------------- */
function renderDoctorBio(){
  const b = DOCTOR_BIO;
  if(!b) return;
  const credLineEls = document.querySelectorAll('[data-doctor="credLine"]');
  credLineEls.forEach(el => el.textContent = tf(b,'credLine'));

  const bioEls = document.querySelectorAll('[data-doctor="bio"]');
  bioEls.forEach(el => el.textContent = tf(b,'bio'));

  const credListEl = document.getElementById('doctorCredList');
  if(credListEl){
    credListEl.innerHTML = (b.credentials||[]).map(c => `<div class="cred-item"><span class="cred-dot"></span> <span>${tf(c,'text')}</span></div>`).join('');
  }

  const specTagsEl = document.getElementById('doctorSpecTags');
  if(specTagsEl){
    specTagsEl.innerHTML = (b.specialties||[]).map(s => `<div class="spec-tag">${tf(s,'text')}</div>`).join('');
  }

  if(b.social){
    const ig = document.getElementById('socialInstagram');
    const fb = document.getElementById('socialFacebook');
    const li = document.getElementById('socialLinkedin');
    if(ig && b.social.instagram) ig.href = b.social.instagram;
    if(fb && b.social.facebook) fb.href = b.social.facebook;
    if(li && b.social.linkedin) li.href = b.social.linkedin;
  }
}
renderDoctorBio();

/* ---------------- WHATSAPP QR (real, scannable) ---------------- */
const WHATSAPP_NUMBER = '60124775257'; // Dr Chandran Clinic WhatsApp: +60 12-477 5257
const WHATSAPP_MESSAGE = "Good Day, I would like to book an appointment. Could you please assist me with the available dates and times? Thank you.";
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const WHATSAPP_QR_IMG = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data=${encodeURIComponent(WHATSAPP_LINK)}`;

document.getElementById('waQrImg').src = WHATSAPP_QR_IMG;
document.getElementById('qrPageImg').src = WHATSAPP_QR_IMG;
document.getElementById('waOpenBtn').href = WHATSAPP_LINK;

/* ---------------- LIVE CLOCK ---------------- */
function tick(){
  const now = new Date();
  const locale = currentLang === 'bm' ? 'ms-MY' : currentLang === 'zh' ? 'zh-CN' : undefined;
  const time = now.toLocaleTimeString(locale, {hour:'2-digit', minute:'2-digit'});
  const date = now.toLocaleDateString(locale, {month:'short', day:'numeric', year:'numeric'}) + ' | ' + now.toLocaleDateString(locale, {weekday:'long'});
  document.getElementById('clockTime').textContent = time;
  document.getElementById('clockDate').textContent = date;
}
tick(); setInterval(tick, 1000*30);

/* ---------------- LANGUAGE SWITCHING ---------------- */
function setLanguage(lang){
  if(lang !== 'en' && lang !== 'bm' && lang !== 'zh') return;
  currentLang = lang;

  document.querySelectorAll('.lang-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === lang);
  });

  applyUI();
  renderNav();
  renderBottomNav();
  renderConditions();
  renderTreatments();
  renderEducation();
  renderVideos();
  renderTestimonials();
  renderReviews();
  renderDoctorBio();
  tick();

  // Re-apply the correct active nav highlight + panel after re-rendering nav buttons
  const activePanel = document.querySelector('.panel.active');
  const activePanelId = activePanel ? activePanel.dataset.panel : 'home';
  if(activePanelId === 'condition-detail' && lastDetail.type === 'condition'){
    showConditionDetail(lastDetail.id);
  } else if(activePanelId === 'treatment-detail' && lastDetail.type === 'treatment'){
    showTreatmentDetail(lastDetail.id);
  } else {
    showPanel(activePanelId);
  }
}
document.querySelectorAll('.lang-btn').forEach(b=>{
  b.onclick = ()=> setLanguage(b.dataset.lang);
});
/* ---------------- SPLASH SCREEN ---------------- */
(function(){
  const splash = document.getElementById('splashScreen');
  const enterBtn = document.getElementById('splashEnterBtn');
  let dismissed = false;
  function dismissSplash(){
    if(dismissed) return;
    dismissed = true;
    splash.classList.add('hide');
    setTimeout(()=>{ splash.remove(); }, 550);
  }
  // Waits for an explicit tap — either the Enter button or anywhere on the splash.
  enterBtn.addEventListener('click', dismissSplash);
  splash.addEventListener('click', dismissSplash);
})();

/* ---------------- PWA SERVICE WORKER REGISTRATION ---------------- */

/* ---------------- SPLASH SCREEN ---------------- */
(function(){
  const splash = document.getElementById('splashScreen');
  const enterBtn = document.getElementById('splashEnterBtn');
  let dismissed = false;
  function dismissSplash(){
    if(dismissed) return;
    dismissed = true;
    splash.classList.add('hide');
    setTimeout(()=>{ splash.remove(); }, 550);
  }
  // Waits for an explicit tap — either the Enter button or anywhere on the splash.
  enterBtn.addEventListener('click', dismissSplash);
  splash.addEventListener('click', dismissSplash);
})();

/* ---------------- PWA SERVICE WORKER REGISTRATION ---------------- */
/* Only registers over https (or localhost) — browsers block service workers
   on file:// pages entirely, so this quietly does nothing until the app is
   actually hosted. That's expected, not an error. */
if('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(()=>{});
  });
}
