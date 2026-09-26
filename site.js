/* ============================================================
   IR@SABAH website — behaviour
   Reuses data.js (ICONS) and content-data.js (bundled fallback),
   then upgrades to live CMS content from /api/content, exactly like
   the kiosk app does — so edits made at /admin show up here too.
   ============================================================ */
(function(){
'use strict';

const WHATSAPP_NUMBER  = '60124775257';
const WHATSAPP_MESSAGE = 'Good Day, I would like to book an appointment. Could you please assist me with the available dates and times? Thank you.';
const WHATSAPP_LINK    = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const SLIDE_MS = 6500;

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
const store = {
  get(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem(k,v); }catch(e){} },
  sget(k){ try{ return sessionStorage.getItem(k); }catch(e){ return null; } },
  sset(k,v){ try{ sessionStorage.setItem(k,v); }catch(e){} },
};

/* ---------------- translations (website-only strings) ---------------- */
const T = {
  en:{
    enter:'Enter', tap:'Tap anywhere to begin',
    role: UI.doctorRole.en,
    nav_home:'Home', nav_doctor:'Meet the Doctor', nav_conditions:'Conditions', nav_treatments:'Treatments', nav_videos:'Videos', nav_testimonials:'Testimonials', nav_contact:'Contact',
    book:'Book Appointment', learn:'Learn More', watch:'Watch Video', wa_open:'Open WhatsApp Chat', scan:'Scan with your phone camera',
    s1_eyebrow: UI.doctorRole.en, s1_title:'Precision Care.<br><em>Minimally Invasive.</em>',
    s1_text:'Image-guided treatments that can help many patients avoid open surgery — with smaller entry points, less discomfort and a quicker return to everyday life.',
    s1_cta2:'Meet Dr. Chandran',
    s2_eyebrow:'Featured Treatment', s2_title:'Microwave Ablation for <em>Thyroid Nodules</em>',
    s2_text:'Gentle heat from a thin probe, guided by ultrasound, shrinks thyroid lumps — with no neck incision needed.',
    s3_eyebrow:'Conditions We Treat', s3_title:'From tumours to varicose veins <em>— one specialist.</em>',
    s3_text:'Liver and kidney tumours, uterine fibroids, thyroid nodules, vascular disease and more — explained in plain language.',
    s3_cta:'Explore Conditions',
    s4_eyebrow:'Why Minimally Invasive', s4_title:'Treatment through a <em>pin-sized entry point.</em>',
    s4_text:'Using real-time imaging, Dr. Chandran reaches the problem directly — so treatment can be precise, and recovery can be quicker than with traditional surgery.',
    s4_cta:'See Treatments',
    b1_t:'Small entry point', b1_d:'Often no large incision',
    b2_t:'Image-guided precision', b2_d:'Ultrasound, CT and X-ray guidance',
    b3_t:'Less discomfort', b3_d:'Gentler than open surgery',
    b4_t:'Quicker recovery', b4_d:'Back to routine sooner',
    s5_eyebrow:'Book an Appointment', s5_title:'Talk to the clinic <em>on WhatsApp.</em>',
    s5_text:'Scan the QR code or tap the button to message the clinic directly and request your appointment — the fastest way to reach us.',
    yrs_md: UI.expMdLabel.en, yrs_ir: UI.expIrLabel.en, yrs_cr: UI.expCrLabel.en, quals:'Universiti Sains Malaysia (USM)',
  },
  bm:{
    enter:'Masuk', tap:'Ketik di mana-mana untuk mula',
    role: UI.doctorRole.bm,
    nav_home:'Utama', nav_doctor:'Kenali Doktor', nav_conditions:'Penyakit', nav_treatments:'Rawatan', nav_videos:'Video', nav_testimonials:'Testimoni', nav_contact:'Hubungi',
    book:'Buat Temujanji', learn:'Ketahui Lebih Lanjut', watch:'Tonton Video', wa_open:'Buka Sembang WhatsApp', scan:'Imbas dengan kamera telefon anda',
    s1_eyebrow: UI.doctorRole.bm, s1_title:'Penjagaan Tepat.<br><em>Invasif Minimal.</em>',
    s1_text:'Rawatan berpandukan imej yang boleh membantu ramai pesakit mengelakkan pembedahan terbuka — dengan titik masuk yang kecil, kurang rasa tidak selesa dan pemulihan yang lebih pantas.',
    s1_cta2:'Kenali Dr. Chandran',
    s2_eyebrow:'Rawatan Pilihan', s2_title:'Ablasi Gelombang Mikro untuk <em>Nodul Tiroid</em>',
    s2_text:'Haba lembut daripada probe halus, dipandu ultrabunyi, mengecutkan ketulan tiroid — tanpa sayatan pada leher.',
    s3_eyebrow:'Keadaan Yang Kami Rawat', s3_title:'Daripada ketumbuhan hingga urat varikos <em>— seorang pakar.</em>',
    s3_text:'Ketumbuhan hati dan buah pinggang, fibroid rahim, nodul tiroid, penyakit vaskular dan banyak lagi — diterangkan dalam bahasa yang mudah.',
    s3_cta:'Terokai Penyakit',
    s4_eyebrow:'Mengapa Invasif Minimal', s4_title:'Rawatan melalui <em>titik masuk sebesar jarum.</em>',
    s4_text:'Menggunakan pengimejan masa nyata, Dr. Chandran sampai terus ke punca masalah — supaya rawatan lebih tepat dan pemulihan boleh lebih pantas berbanding pembedahan tradisional.',
    s4_cta:'Lihat Rawatan',
    b1_t:'Titik masuk kecil', b1_d:'Selalunya tiada sayatan besar',
    b2_t:'Ketepatan berpandukan imej', b2_d:'Panduan ultrabunyi, CT dan X-ray',
    b3_t:'Kurang rasa tidak selesa', b3_d:'Lebih lembut daripada pembedahan terbuka',
    b4_t:'Pemulihan lebih pantas', b4_d:'Kembali ke rutin lebih awal',
    s5_eyebrow:'Buat Temujanji', s5_title:'Berbual dengan klinik <em>di WhatsApp.</em>',
    s5_text:'Imbas kod QR atau tekan butang untuk menghantar mesej terus kepada klinik dan memohon temujanji — cara terpantas untuk menghubungi kami.',
    yrs_md: UI.expMdLabel.bm, yrs_ir: UI.expIrLabel.bm, yrs_cr: UI.expCrLabel.bm, quals:'Universiti Sains Malaysia (USM)',
  },
  zh:{
    enter:'进入', tap:'点击任意位置开始',
    role: UI.doctorRole.zh,
    nav_home:'首页', nav_doctor:'认识医生', nav_conditions:'疾病', nav_treatments:'治疗', nav_videos:'视频', nav_testimonials:'患者心声', nav_contact:'联系我们',
    book:'预约就诊', learn:'了解更多', watch:'观看视频', wa_open:'打开WhatsApp对话', scan:'用手机相机扫描',
    s1_eyebrow: UI.doctorRole.zh, s1_title:'精准护理，<br><em>微创治疗。</em>',
    s1_text:'影像引导治疗，可帮助许多患者避免开刀手术——入口更小、不适感更少，更快回到日常生活。',
    s1_cta2:'认识Chandran医生',
    s2_eyebrow:'精选疗法', s2_title:'甲状腺结节<em>微波消融术</em>',
    s2_text:'在超声引导下，通过细探针释放温和热能使甲状腺肿块缩小——无需颈部切口。',
    s3_eyebrow:'我们治疗的疾病', s3_title:'从肿瘤到静脉曲张<em>——一位专科医生。</em>',
    s3_text:'肝肿瘤、肾肿瘤、子宫肌瘤、甲状腺结节、血管疾病等——以通俗易懂的方式讲解。',
    s3_cta:'了解疾病',
    s4_eyebrow:'为何选择微创', s4_title:'仅需<em>针孔大小的入口</em>即可治疗。',
    s4_text:'借助实时影像，Chandran医生可直达病灶——治疗更精准，恢复也可能比传统手术更快。',
    s4_cta:'查看治疗',
    b1_t:'入口小', b1_d:'通常无需大切口',
    b2_t:'影像引导，精准治疗', b2_d:'超声、CT及X光引导',
    b3_t:'不适感较少', b3_d:'比开刀手术更温和',
    b4_t:'恢复较快', b4_d:'更快恢复日常作息',
    s5_eyebrow:'预约就诊', s5_title:'通过WhatsApp<em>联系诊所。</em>',
    s5_text:'扫描二维码或点击按钮，直接向诊所发送信息预约——这是最快的联系方式。',
    yrs_md: UI.expMdLabel.zh, yrs_ir: UI.expIrLabel.zh, yrs_cr: UI.expCrLabel.zh, quals:'马来西亚理科大学（USM）',
  }
};

const X = {
  en:{
    d_badge:'Interventional Radiology', d_kicker:'Meet Your Doctor',
    d_bio:'Dr. Chandran Nadarajan is a Consultant Clinical & Interventional Radiologist with 19 years as a medical doctor — 11 as a clinical radiologist and 8 as an interventional radiologist. Trained at Universiti Sains Malaysia (MD, M.Med Radiology), he treats a wide range of conditions with minimally invasive, image-guided procedures, so many patients can avoid open surgery.',
    c_kicker:'Conditions We Treat', c_title:'Understand your condition, <em>in plain language</em>',
    c_sub:'Tap a condition to learn about symptoms, causes, how it is diagnosed and which treatments may help.',
    search:'Search conditions…', none:'Nothing found — try another word.', all:'All', more:'Learn more', featured:'Featured',
    t_kicker:'Treatments & Procedures', t_title:'Minimally invasive options, <em>explained simply</em>',
    t_sub:'Image-guided procedures that treat the problem directly — see how each one works, what to expect and how recovery goes.',
    v_kicker:'Patient Education Videos', v_title:'Short, easy-to-understand <em>explainers</em>',
    v_ft: UI.featTitle.en, v_fd: UI.featDesc.en,
    p_kicker:'Patient Testimonials', p_title:'Real stories, <em>in patients’ own words</em>', r_title:'What patients are saying',
    k_title:'Reach the clinic <em>directly on WhatsApp</em>',
    k_text:'Scan the QR code with your phone camera, or tap the button, to message the clinic and request your appointment — the fastest way to reach us.',
    k_email:'Email',
    disclaimer:'The information on this website is for general education only and does not replace advice from a qualified doctor. Please consult a doctor about your own health.',
    tagline: UI.tagline.en,
    h_overview:'Overview', h_symptoms:'Common symptoms', h_causes:'Common causes', h_diag:'How it is diagnosed', h_steps:'How it works', h_benefits:'Benefits', h_recovery:'Recovery', h_rel_t:'Treatments that may help', h_rel_c:'Conditions treated with this',
  },
  bm:{
    d_badge:'Radiologi Intervensi', d_kicker:'Kenali Doktor Anda',
    d_bio:'Dr. Chandran Nadarajan ialah Perunding Radiologi Klinikal & Intervensi dengan pengalaman 19 tahun sebagai doktor perubatan — 11 tahun sebagai pakar radiologi klinikal dan 8 tahun sebagai pakar radiologi intervensi. Dilatih di Universiti Sains Malaysia (MD, M.Med Radiologi), beliau merawat pelbagai keadaan menggunakan prosedur invasif minimum berpandukan imej, supaya ramai pesakit dapat mengelakkan pembedahan terbuka.',
    c_kicker:'Keadaan Yang Kami Rawat', c_title:'Fahami keadaan anda, <em>dalam bahasa yang mudah</em>',
    c_sub:'Ketik pada sesuatu keadaan untuk mengetahui gejala, punca, cara diagnosis dan rawatan yang mungkin membantu.',
    search:'Cari keadaan…', none:'Tiada hasil — cuba perkataan lain.', all:'Semua', more:'Ketahui lebih lanjut', featured:'Pilihan',
    t_kicker:'Rawatan & Prosedur', t_title:'Pilihan invasif minimum, <em>diterangkan dengan mudah</em>',
    t_sub:'Prosedur berpandukan imej yang merawat masalah secara terus — lihat cara ia berfungsi, apa yang dijangka dan bagaimana pemulihan berlaku.',
    v_kicker:'Video Pendidikan Pesakit', v_title:'Penerangan ringkas yang <em>mudah difahami</em>',
    v_ft: UI.featTitle.bm, v_fd: UI.featDesc.bm,
    p_kicker:'Testimoni Pesakit', p_title:'Kisah sebenar, <em>dalam kata-kata pesakit sendiri</em>', r_title:'Apa kata pesakit',
    k_title:'Hubungi klinik <em>terus melalui WhatsApp</em>',
    k_text:'Imbas kod QR dengan kamera telefon anda, atau tekan butang, untuk menghantar mesej kepada klinik dan memohon temujanji — cara terpantas untuk menghubungi kami.',
    k_email:'Emel',
    disclaimer:'Maklumat di laman web ini hanyalah untuk pendidikan umum dan tidak menggantikan nasihat doktor yang bertauliah. Sila rujuk doktor mengenai kesihatan anda sendiri.',
    tagline: UI.tagline.bm,
    h_overview:'Gambaran keseluruhan', h_symptoms:'Gejala biasa', h_causes:'Punca biasa', h_diag:'Cara diagnosis', h_steps:'Cara ia berfungsi', h_benefits:'Kelebihan', h_recovery:'Pemulihan', h_rel_t:'Rawatan yang mungkin membantu', h_rel_c:'Keadaan yang dirawat dengan ini',
  },
  zh:{
    d_badge:'介入放射学', d_kicker:'认识您的医生',
    d_bio:'Chandran Nadarajan医生是临床及介入放射科顾问医生，拥有19年医生资历——其中11年为临床放射科医生，8年为介入放射科医生。他毕业并接受专科培训于马来西亚理科大学（MD、M.Med放射学），以微创、影像引导的手术治疗多种疾病，让许多患者可免于开刀手术。',
    c_kicker:'我们治疗的疾病', c_title:'以通俗的语言，<em>了解您的病情</em>',
    c_sub:'点击疾病，了解症状、成因、诊断方式以及可能有帮助的治疗。',
    search:'搜索疾病…', none:'未找到结果，请换个词试试。', all:'全部', more:'了解更多', featured:'精选',
    t_kicker:'治疗与手术', t_title:'微创治疗选择，<em>简单说明</em>',
    t_sub:'影像引导手术直接针对病灶——了解每种手术的原理、预期过程与恢复情况。',
    v_kicker:'患者教育视频', v_title:'简短易懂的<em>讲解视频</em>',
    v_ft: UI.featTitle.zh, v_fd: UI.featDesc.zh,
    p_kicker:'患者心声', p_title:'真实故事，<em>出自患者之口</em>', r_title:'患者的评价',
    k_title:'通过WhatsApp<em>直接联系诊所</em>',
    k_text:'用手机相机扫描二维码，或点击按钮，向诊所发送信息预约——这是最快的联系方式。',
    k_email:'电子邮件',
    disclaimer:'本网站的资讯仅供一般教育用途，不能取代合格医生的建议。有关您自身的健康问题，请咨询医生。',
    tagline: UI.tagline.zh,
    h_overview:'概述', h_symptoms:'常见症状', h_causes:'常见成因', h_diag:'诊断方式', h_steps:'治疗原理', h_benefits:'优点', h_recovery:'恢复', h_rel_t:'可能有帮助的治疗', h_rel_c:'适用此治疗的疾病',
  }
};
['en','bm','zh'].forEach(l => Object.assign(T[l], X[l]));
const Y = {
  en:{ nav_doctor:'About the Doctor',
    b_about:'About the Doctor', bs_about:'Board-certified expertise, patient-first care',
    b_conditions:'Conditions We Treat', bs_conditions:'Tap a condition to learn about symptoms, causes, diagnosis and treatment options.',
    b_treatments:'Treatments & Procedures', bs_treatments:'Image-guided procedures that treat the problem directly.',
    b_videos:'Patient Education Videos', bs_videos:'Short, easy-to-understand explainers.',
    b_contact:'Contact & Appointments', bs_contact:'Reach the clinic directly on WhatsApp.',
    ab_more:'Read full profile', hc_more:'View all conditions', ht_more:'View all treatments',
    cta_title:'Ready to book your consultation?', cta_text:'Message the clinic on WhatsApp — the fastest way to request an appointment.', cta_more:'Contact details' },
  bm:{ nav_doctor:'Tentang Doktor',
    b_about:'Tentang Doktor', bs_about:'Kepakaran bertauliah, keutamaan kepada pesakit',
    b_conditions:'Keadaan Yang Kami Rawat', bs_conditions:'Ketik pada sesuatu keadaan untuk mengetahui gejala, punca, diagnosis dan pilihan rawatan.',
    b_treatments:'Rawatan & Prosedur', bs_treatments:'Prosedur berpandukan imej yang merawat masalah secara terus.',
    b_videos:'Video Pendidikan Pesakit', bs_videos:'Penerangan ringkas yang mudah difahami.',
    b_contact:'Hubungi & Temujanji', bs_contact:'Hubungi klinik terus melalui WhatsApp.',
    ab_more:'Baca profil penuh', hc_more:'Lihat semua keadaan', ht_more:'Lihat semua rawatan',
    cta_title:'Bersedia untuk membuat temujanji?', cta_text:'Hantar mesej kepada klinik melalui WhatsApp — cara terpantas untuk memohon temujanji.', cta_more:'Butiran hubungan' },
  zh:{ nav_doctor:'关于医生',
    b_about:'关于医生', bs_about:'专业认证，以病患为先',
    b_conditions:'我们治疗的疾病', bs_conditions:'点击疾病，了解症状、成因、诊断及治疗选择。',
    b_treatments:'治疗与手术', bs_treatments:'影像引导手术直接针对病灶。',
    b_videos:'患者教育视频', bs_videos:'简短易懂的讲解视频。',
    b_contact:'联系与预约', bs_contact:'通过WhatsApp直接联系诊所。',
    ab_more:'查看完整简介', hc_more:'查看全部疾病', ht_more:'查看全部治疗',
    cta_title:'准备好预约就诊了吗？', cta_text:'通过WhatsApp向诊所发送信息——这是最快的预约方式。', cta_more:'联系方式' }
};
['en','bm','zh'].forEach(l => Object.assign(T[l], Y[l]));

Object.assign(ICONS, {
  search:'<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>'
});

let lang = 'en';
const pick = (o, base) => (o[base + '_' + lang] ?? o[base + '_en'] ?? '');

function applyLang(l){
  if(!T[l]) l = 'en';
  lang = l;
  document.documentElement.lang = l === 'zh' ? 'zh-Hans' : (l === 'bm' ? 'ms' : 'en');
  $$('[data-i18n]').forEach(el => { const v = T[l][el.dataset.i18n]; if(v != null) el.innerHTML = v; });
  $$('[data-i18n-html]').forEach(el => { const v = T[l][el.dataset.i18nHtml]; if(v != null) el.innerHTML = v; });
  // years-as-doctor chip/stat carry a "+" / number, keep it (only the label text is translated)
  $$('.lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
  $$('[data-i18n-ph]').forEach(el => { const v = T[l][el.dataset.i18nPh]; if(v != null) el.placeholder = v; });
  renderHeroConditions(); renderAll();
  store.set('irs_lang', l);
}

/* ---------------- icons ---------------- */
function svg(name){ return `<svg viewBox="0 0 24 24" aria-hidden="true">${(ICONS[name]||'')}</svg>`; }
function paintIcons(){ $$('[data-icon]').forEach(el => { el.innerHTML = svg(el.dataset.icon); }); }

/* ---------------- WhatsApp + QR ---------------- */
function wireWhatsApp(){
  $$('[data-wa]').forEach(a => { a.href = WHATSAPP_LINK; a.target = '_blank'; a.rel = 'noopener'; });
}

/* ---------------- splash ---------------- */
const splash = $('#splashScreen') || { classList:{ contains:() => true, add(){}, remove(){} }, addEventListener(){} };
function dismissSplash(){
  if(splash.classList.contains('hide')) return;
  splash.classList.add('hide');
  document.body.classList.remove('splash-open');
  store.sset('irs_splash_seen','1');
  startSlider();
}
function initSplash(){
  if(!$('#splashScreen')) return false;
  if(store.sget('irs_splash_seen') === '1' && !/[?&]splash=1/.test(location.search)){
    splash.classList.add('hide'); document.body.classList.remove('splash-open');
    return false;
  }
  splash.addEventListener('click', dismissSplash);
  document.addEventListener('keydown', e => { if(!splash.classList.contains('hide') && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape')){ e.preventDefault(); dismissSplash(); } });
  return true;
}

/* ---------------- header ---------------- */
function initHeader(){
  const hdr = $('#siteHeader'), nav = $('#mainNav'), burger = $('#burger');
  const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 40);
  onScroll(); window.addEventListener('scroll', onScroll, { passive:true });
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', open);
  });
  $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded','false'); }));
  $$('.lang-btn').forEach(b => b.addEventListener('click', () => applyLang(b.dataset.lang)));

  // highlight current section in the nav
  const links = $$('a[href^="#"]', nav).filter(a => a.getAttribute('href').length > 1);
  const map = new Map(); links.forEach(a => { const s = $(a.getAttribute('href')); if(s) map.set(s, a); });
  if('IntersectionObserver' in window && map.size){
    const io = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ links.forEach(l => l.classList.remove('active')); const l = map.get(e.target); if(l) l.classList.add('active'); }
    }), { rootMargin:'-45% 0px -50% 0px' });
    map.forEach((_, sec) => io.observe(sec));
  }
}

/* ---------------- hero slider ---------------- */
let idx = 0, timer = null, started = false, hovering = false, slides = [], dots = [];
function go(n){
  idx = (n + slides.length) % slides.length;
  slides.forEach((s,i) => { s.classList.toggle('active', i === idx); s.setAttribute('aria-hidden', i === idx ? 'false' : 'true'); });
  dots.forEach((d,i) => { d.classList.toggle('active', i === idx); d.setAttribute('aria-selected', i === idx); const f = d.firstElementChild; f.style.animation='none'; void f.offsetWidth; f.style.animation=''; });
  restart();
}
function restart(){ clearTimeout(timer); if(!started || hovering || document.hidden) return; timer = setTimeout(() => go(idx + 1), SLIDE_MS); }
function startSlider(){ started = true; if(slides.length) restart(); }
function initSlider(){
  const hero = $('#hero'); if(!hero) return;
  slides = $$('.slide', hero);
  const dotsEl = $('#dots'); hero.style.setProperty('--dur', SLIDE_MS + 'ms');
  slides.forEach((_,i) => {
    const b = document.createElement('button'); b.className = 'dot-btn' + (i===0?' active':''); b.setAttribute('role','tab'); b.setAttribute('aria-label','Slide ' + (i+1)); b.innerHTML = '<i></i>';
    b.addEventListener('click', () => go(i)); dotsEl.appendChild(b); dots.push(b);
  });
  $('#prevSlide').addEventListener('click', () => go(idx - 1));
  $('#nextSlide').addEventListener('click', () => go(idx + 1));
  hero.addEventListener('mouseenter', () => { hovering = true; hero.classList.add('paused'); clearTimeout(timer); });
  hero.addEventListener('mouseleave', () => { hovering = false; hero.classList.remove('paused'); go(idx); });
  document.addEventListener('visibilitychange', () => { if(document.hidden) clearTimeout(timer); else go(idx); });
  document.addEventListener('keydown', e => {
    if(!splash.classList.contains('hide') || !$('#videoModal').hidden) return;
    if(e.key === 'ArrowLeft') go(idx - 1); if(e.key === 'ArrowRight') go(idx + 1);
  });
  // swipe
  let x0 = null, y0 = null;
  hero.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive:true });
  hero.addEventListener('touchend', e => {
    if(x0 == null) return; const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0; x0 = null;
    if(Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(idx + (dx < 0 ? 1 : -1));
  }, { passive:true });
  // hide the dot fill until the splash is gone (slider timer starts on Enter)
  slides.forEach((s,i) => s.setAttribute('aria-hidden', i === 0 ? 'false' : 'true'));
}

/* ---------------- hero: conditions chips (slide 3) ---------------- */
function renderHeroConditions(){
  const box = $('#heroConditions'); if(!box || typeof CONDITIONS === 'undefined') return;
  const picks = CONDITIONS.slice(0, 8);
  box.innerHTML = picks.map(c =>
    `<a class="chip" href="/conditions"><span class="ico" style="background:${c.color || '#2f6fed'}">${svg(c.icon)}</span><span>${pick(c,'title')}</span></a>`
  ).join('');
}

/* ---------------- video modal ---------------- */
function ytId(u){ const m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/); return m ? m[1] : null; }
function openVideo(url){
  const modal = $('#videoModal'), wrap = $('#videoWrap'); clearTimeout(timer);
  const id = ytId(url);
  wrap.innerHTML = id
    ? `<iframe src="https://www.youtube.com/embed/${id}?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`
    : `<video controls playsinline autoplay src="${url}"></video>`;
  modal.hidden = false;
}
function closeVideo(){ const modal = $('#videoModal'); $('#videoWrap').innerHTML = ''; modal.hidden = true; if(started) restart(); }
function initVideo(){
  document.addEventListener('click', e => { const b = e.target.closest('[data-video]'); if(b){ e.preventDefault(); openVideo(b.dataset.video); } });
  $('#videoClose').addEventListener('click', closeVideo);
  $('#videoModal').addEventListener('click', e => { if(e.target.id === 'videoModal') closeVideo(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('#videoModal').hidden) closeVideo(); });
}

/* ---------------- count-up stats ---------------- */
function initCounters(){
  const els = $$('[data-count]'); if(!els.length) return;
  const run = el => {
    const end = +el.dataset.count, suf = el.dataset.suffix || '', t0 = performance.now(), dur = 1400;
    const step = t => { const p = Math.min(1, (t - t0) / dur); el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + suf; if(p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if(!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } }), { threshold:.6 });
  els.forEach(el => io.observe(el));
}

/* ---------------- sections: doctor, conditions, treatments, videos, stories ---------------- */
const asList = v => Array.isArray(v) ? v : (typeof v === 'string' ? v.split(/\n+/).map(x => x.trim()).filter(Boolean) : []);
const state = { condTag:'*', treatTag:'*', q:'' };
const live = { doctor:null, testimonials:null, reviews:null, testiOn:false };

function renderDoctor(){
  if(!$('#docBio')) return;
  const bio = $('#docBio'), cred = $('#docCred'), extra = $('#docExtra');
  const d = live.doctor;
  if(d && d['bio_' + lang] && !/dummy/i.test(d['bio_en'] || '')){
    bio.innerHTML = d['bio_' + lang];
    const list = asList((d.credentials || []).map(c => c['text_' + lang] || c.text_en));
    extra.innerHTML = list.map(t => `<li>${t}</li>`).join(''); extra.hidden = !list.length;
  } else { bio.innerHTML = T[lang].d_bio; extra.hidden = true; }
  // focus areas: real treatment names from the treatments list
  const foc = $('#docFocus');
  foc.innerHTML = (typeof TREATMENTS !== 'undefined' ? TREATMENTS.filter(t => t.tag_en !== 'General').slice(0, 6) : [])
    .map(t => `<span class="tag-chip">${pick(t,'title')}</span>`).join('');
}

function tagsOf(items, skip){
  const seen = new Map();
  items.forEach(i => { const k = i.tag_en; if(k && !seen.has(k) && k !== skip) seen.set(k, pick(i,'tag')); });
  return [...seen.entries()];
}
function renderFilters(box, items, key, skip){
  const tags = tagsOf(items, skip);
  box.innerHTML = [`<button class="filter${state[key]==='*'?' active':''}" data-tag="*">${T[lang].all}</button>`]
    .concat(tags.map(([k,l]) => `<button class="filter${state[key]===k?' active':''}" data-tag="${k.replace(/"/g,'&quot;')}">${l}</button>`)).join('');
}
function card(item, type){
  const feat = item.tag_en === 'Featured';
  return `<button class="card${feat?' featured-card':''}" style="--c:${item.color||'#2f6fed'}" data-open="${type}:${item.id}">
    <span class="c-ico"><span class="ico">${svg(item.icon)}</span></span>
    <span class="c-tag">${pick(item,'tag')}</span>
    <h3>${pick(item,'title')}</h3>
    <p>${pick(item,'desc')}</p>
    <span class="c-more">${T[lang].more}</span></button>`;
}
function renderConditions(){
  if(typeof CONDITIONS === 'undefined' || !$('#condGrid')) return;
  renderFilters($('#condFilters'), CONDITIONS, 'condTag');
  const q = state.q.trim().toLowerCase();
  const list = CONDITIONS.filter(c => (state.condTag === '*' || c.tag_en === state.condTag) &&
    (!q || (pick(c,'title') + ' ' + pick(c,'desc') + ' ' + pick(c,'tag')).toLowerCase().includes(q)));
  $('#condGrid').innerHTML = list.map(c => card(c, 'c')).join('');
  $('#condEmpty').hidden = list.length > 0;
}
function renderTreatments(){
  if(typeof TREATMENTS === 'undefined' || !$('#treatGrid')) return;
  renderFilters($('#treatFilters'), TREATMENTS, 'treatTag', 'Featured');
  const list = TREATMENTS.filter(t => state.treatTag === '*' || t.tag_en === state.treatTag);
  $('#treatGrid').innerHTML = list.map(t => card(t, 't')).join('');
}
function renderVideos(){
  const grid = $('#videoGrid'); if(!grid || typeof VIDEOS === 'undefined') return;
  // The bundled sample list points at "placeholder.mp4" — only real videos are shown.
  const real = VIDEOS.filter(v => v.file && !/placeholder/i.test(v.file));
  grid.innerHTML = real.map(v => `<button class="v-item" data-video="${v.file}"><span class="v-play"><span class="ico">${svg('play')}</span></span><span><b>${pick(v,'title')}</b><small>${v.length || ''}</small></span></button>`).join('');
}
const initial = n => (n || '?').trim().charAt(0).toUpperCase();
function renderStories(){
  const sec = $('#testimonials'); if(!sec) return;
  const T1 = live.testiOn && live.testimonials && live.testimonials.length ? live.testimonials : [];
  const R1 = live.reviews && live.reviews.length ? live.reviews : [];
  const showRev = R1.length > 0;
  sec.hidden = !(T1.length || showRev);
  $$('a[href="#testimonials"]').forEach(a => { a.hidden = sec.hidden; });
  $('#testiCarousel').hidden = !T1.length;
  $('#testiTrack').innerHTML = T1.map(t => `<figure class="quote" style="margin:0"><p>${pick(t,'quote')}</p><figcaption class="q-who"><span class="q-av" style="background:${t.color||'#2f6fed'}">${initial(t.name)}</span><span><b>${t.name}</b><small>${pick(t,'meta')}</small></span></figcaption></figure>`).join('');
  $('#reviewsBlock').hidden = !showRev;
  $('#revTrack').innerHTML = R1.map(r => { const n = Math.max(0, Math.min(5, +r.stars || 5));
    return `<figure class="quote" style="margin:0"><div class="stars" aria-label="${n} / 5">${'★'.repeat(n)}<span class="off">${'★'.repeat(5-n)}</span></div><p>${pick(r,'quote')}</p><figcaption class="q-who"><span class="q-av" style="background:${r.color||'#2f6fed'}">${initial(r.name)}</span><span><b>${r.name}</b></span></figcaption></figure>`; }).join('');
}
function renderHome(){
  const c = $('#homeConds'), t = $('#homeTreats');
  if(c && typeof CONDITIONS !== 'undefined') c.innerHTML = CONDITIONS.slice(0, 6).map(x => card(x, 'c')).join('');
  if(t && typeof TREATMENTS !== 'undefined') t.innerHTML = TREATMENTS.slice(0, 4).map(x => card(x, 't')).join('');
}
function renderAll(){ renderDoctor(); renderConditions(); renderTreatments(); renderVideos(); renderStories(); renderHome(); }

/* ---------------- detail modal ---------------- */
function findItem(type, id){ const arr = type === 'c' ? CONDITIONS : TREATMENTS; return arr.find(i => i.id === id); }
function section(h, html){ return html ? `<section><h4>${T[lang][h]}</h4>${html}</section>` : ''; }
function ul(v){ const a = asList(v); return a.length ? `<ul>${a.map(x => `<li>${x}</li>`).join('')}</ul>` : ''; }
function ol(v){ const a = asList(v); return a.length ? `<ol>${a.map(x => `<li>${x}</li>`).join('')}</ol>` : ''; }
function openDetail(type, id){
  const it = findItem(type, id); if(!it) return;
  const L = k => it[k + '_' + lang] ?? it[k + '_en'];
  $('#dHead').style.setProperty('--c', it.color || '#2f6fed');
  $('#dIco').innerHTML = `<span class="ico">${svg(it.icon)}</span>`; $('#dIco').style.setProperty('--c', it.color || '#2f6fed');
  $('#dTag').innerHTML = pick(it,'tag'); $('#dTitle').innerHTML = pick(it,'title');
  const relType = type === 'c' ? 't' : 'c';
  const rel = (it.related || '').split(',').map(x => x.trim()).filter(Boolean).map(id2 => findItem(relType, id2)).filter(Boolean);
  const relHtml = rel.length ? `<div class="rel-row">${rel.map(r => `<button class="rel" data-open="${relType}:${r.id}">${pick(r,'title')}</button>`).join('')}</div>` : '';
  const p = v => v ? `<p>${v}</p>` : '';
  $('#dBody').innerHTML = type === 'c'
    ? section('h_overview', p(L('overview'))) + section('h_symptoms', ul(L('symptoms'))) + section('h_causes', ul(L('causes'))) + section('h_diag', p(L('diagnosis'))) + section(type === 'c' ? 'h_rel_t' : 'h_rel_c', relHtml)
    : section('h_overview', p(L('overview'))) + section('h_steps', ol(L('steps'))) + section('h_benefits', ul(L('benefits'))) + section('h_recovery', p(L('recovery'))) + section('h_rel_c', relHtml);
  const m = $('#detailModal'); m.hidden = false; m.scrollTop = 0; document.body.classList.add('modal-open');
  $('#detailClose').focus({ preventScroll:true });
}
function closeDetail(){ $('#detailModal').hidden = true; document.body.classList.remove('modal-open'); }
function initSections(){
  document.addEventListener('click', e => {
    const o = e.target.closest('[data-open]'); if(o){ const [t,id] = o.dataset.open.split(':'); openDetail(t, id); return; }
    const f = e.target.closest('.filter'); if(f){
      const grp = f.parentElement.id; if(grp === 'condFilters') state.condTag = f.dataset.tag; else state.treatTag = f.dataset.tag;
      renderConditions(); renderTreatments();
    }
  });
  const cs = $('#condSearch'); if(cs) cs.addEventListener('input', e => { state.q = e.target.value; renderConditions(); });
  $('#detailClose').addEventListener('click', closeDetail);
  $('#detailModal').addEventListener('click', e => { if(e.target.id === 'detailModal') closeDetail(); });
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !$('#detailModal').hidden) closeDetail(); });
  // carousels
  $$('.carousel').forEach(c => { const tr = $('.car-track', c);
    const step = () => Math.max(280, tr.clientWidth * .8);
    $('.prev', c).addEventListener('click', () => tr.scrollBy({ left:-step() }));
    $('.next', c).addEventListener('click', () => tr.scrollBy({ left: step() }));
  });
  // reveal on scroll
  const els = $$('.reveal');
  if('IntersectionObserver' in window){
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold:.12, rootMargin:'0px 0px -6% 0px' });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));
  $('#yr').textContent = new Date().getFullYear();
}

/* ---------------- live CMS content (same API the kiosk uses) ---------------- */
async function getJSON(u){ const r = await fetch(u, { cache:'no-store' }); if(!r.ok) throw new Error(u); return r.json(); }
function swap(arr, items){ if(items && items.length){ arr.length = 0; items.forEach(i => arr.push(i)); } }
async function loadLive(){
  await Promise.allSettled([
    getJSON('/api/content?section=conditions').then(d => swap(CONDITIONS, d.items)),
    getJSON('/api/content?section=treatments').then(d => swap(TREATMENTS, d.items)),
    getJSON('/api/content?section=videos').then(d => swap(VIDEOS, d.items)),
    getJSON('/api/content?section=doctor-bio').then(d => { live.doctor = d; }),
    getJSON('/api/content?section=testimonials').then(d => { live.testimonials = d.items; live.testiOn = d.enabled !== false; }),
    getJSON('/api/content?section=reviews').then(d => { live.reviews = d.items; }),
    getJSON('/api/content?section=site-images').then(d => Object.keys(d).forEach(k => { if(d[k]) $$(`img[data-img-src="${k}"]`).forEach(i => { i.src = d[k]; }); })),
  ]);
  renderHeroConditions(); renderAll();
}

/* ---------------- boot ---------------- */
function boot(){
  paintIcons();
  wireWhatsApp();
  initHeader();
  initSlider();
  initVideo();
  initCounters();
  initSections();
  const saved = store.get('irs_lang'); applyLang(T[saved] ? saved : 'en');
  const splashShowing = initSplash();
  if(!splashShowing) startSlider();
  loadLive().catch(()=>{});
}
document.addEventListener('DOMContentLoaded', boot);
})();
