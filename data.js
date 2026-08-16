// ============================================================
// data.js — developer-owned static config: icons, interface
// translations (nav labels, buttons, headings), and nav order.
// This is NOT edited via the CMS — it rarely changes. Actual
// clinic content (conditions, treatments, doctor bio, etc.)
// lives in content-data.js, generated from /content/*.json.
// ============================================================

const ICONS = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/>',
  stethoscope: '<path d="M5 3v5a4 4 0 0 0 8 0V3"/><path d="M9 15a5 5 0 0 0 10 0v-2"/><circle cx="19" cy="8.5" r="2"/><path d="M5 8a2.5 2.5 0 0 0 2.5 2.5"/>',
  syringe: '<path d="M18 2l4 4"/><path d="M17 7l-9.5 9.5"/><path d="M13 3l8 8"/><path d="M5 19l-2 3"/><path d="M7.5 16.5 10 19l-3.5 3.5-3-3z"/><path d="M9.5 10.5l4 4"/><path d="M12 8l4 4"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5z"/>',
  star: '<path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.1 6.5L12 17.3 6.2 20.5l1.1-6.5L2.5 9.4l6.6-.9z"/>',
  message: '<path d="M4 5h16v11H8l-4 4z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 10h17"/>',
  qr: '<rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="14" y="3.5" width="6.5" height="6.5" rx="1"/><rect x="3.5" y="14" width="6.5" height="6.5" rx="1"/><path d="M14 14h3v3h-3zM20 14v3M14 20h3M17.5 17.5H20"/>',
  liver: '<path d="M3 12c0-4.5 4-8 9-8s9 3 8 7-5 5-8 5-2 2-5 2-4-2.5-4-6z"/>',
  kidney: '<path d="M9 3C5.5 3 3 6 3 10c0 5 3 11 7 11 2 0 2-2 1.5-4S10 13 12 13s4 1.5 5 4 3 0 3-3c0-3-1-5-3-6 1-1 1-3-.5-4.2C15 2.3 12 3 11 4.5 10.5 3.5 9.8 3 9 3z"/>',
  uterus: '<path d="M12 4v6"/><path d="M8 10c-3 0-5 2.5-5 5.5S4.5 20 6 20s2-1.5 2.5-3c.3-1 .8-1.7 1.5-1.7s1.2.7 1.5 1.7c.5 1.5 1 3 2.5 3s6-1 6-4.5S19 10 16 10z"/>',
  leg: '<path d="M9 3h6l1 8-2 2 2 8h-4l-1-7-3 2-2-2 3-11z"/>',
  prostate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.5"/>',
  heartpulse: '<path d="M20 8.5c0-2.5-2-4.5-4.5-4.5-1.4 0-2.7.7-3.5 1.8-.8-1.1-2.1-1.8-3.5-1.8C6 4 4 6 4 8.5 4 13 12 19 12 19s8-6 8-10.5z"/><path d="M6 11h2.5l1.5-3 2 5 1.5-2H15"/>',
  syringe2: '<path d="M19 3l2 2"/><path d="M18 4 6.5 15.5"/><path d="M4 20l2.5-2.5"/><path d="M8 12l4 4"/>',
  flame: '<path d="M12 2s-6 6-6 11a6 6 0 0 0 12 0c0-2-1-3.5-2-4.5 0 2-1 3-2 3-1.5 0-2-1.5-1-3.5C13.5 6 12 4 12 2z"/>',
  droplet: '<path d="M12 3s6 7 6 11.5a6 6 0 0 1-12 0C6 10 12 3 12 3z"/>',
  document: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  checklist: '<path d="M4 5.5h16M4 12h16M4 18.5h16"/><path d="M4 5.5l1.5 1.5L8 4M4 12l1.5 1.5L8 10.5M4 18.5l1.5 1.5L8 17"/>',
  question: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.2a2.5 2.5 0 1 1 3.7 2.2c-.9.5-1.2 1-1.2 2"/><path d="M12 17h.01"/>',
  apple: '<path d="M12 8c-3.5 0-6 2.7-6 6.5S8.5 21 11 21c.7 0 1.3-.2 2-.5.7.3 1.3.5 2 .5 2.5 0 5-2.7 5-6.5S16.5 8 13 8h-1z"/><path d="M12 8c0-2 1-3.5 2.5-4.5"/>',
  pill: '<rect x="3" y="10" width="18" height="7" rx="3.5" transform="rotate(-25 12 13.5)"/><path d="M9.5 9 12 15"/>',
  phone: '<path d="M6 3.5c1 0 2.5.3 2.5 1.5 0 1-1 1.5-1 2.5s2 4 4 6 5 4 6 4 1.5-1 2.5-1 1.5 1.5 1.5 2.5-2 2.5-3.5 2.5C13 21.5 4 12.5 4 8 4 6.5 5 4.5 6 3.5z"/>',
  sparkle: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',
  volume: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 8.5a5 5 0 0 1 0 7M19.5 6a8.5 8.5 0 0 1 0 12"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  thyroid: '<path d="M12 8.5c-1.5-2.5-5-3-6.5-.8-1.5 2.2-.7 6.3 2.3 7.8 1.2.6 2.3.3 2.7-1 .3-1 .8-1.7 1.5-1.7s1.2.7 1.5 1.7c.4 1.3 1.5 1.6 2.7 1 3-1.5 3.8-5.6 2.3-7.8-1.5-2.2-5-1.7-6.5.8z"/>',
  whatsapp: '<path d="M6 18l1.1-3.3A7 7 0 1 1 10 17l-4 1z"/><path d="M9.2 10c0 2.5 2.3 4.8 4.8 4.8.5 0 .9-.3 1-.7l.2-.8c.1-.4-.1-.8-.4-1l-1-.6c-.3-.2-.7-.1-.9.1l-.3.4c-.7-.3-1.5-1.1-1.8-1.8l.4-.3c.2-.2.3-.6.1-.9l-.6-1c-.2-.3-.6-.5-1-.4l-.8.2c-.4.1-.7.5-.7 1z"/>',
  instagram: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1"/>',
  facebook: '<path d="M14 21v-7h2.5l.5-3H14v-2c0-.9.2-1.5 1.6-1.5H17V4.2C16.6 4.1 15.6 4 14.4 4 12 4 10.3 5.5 10.3 8.2V11H8v3h2.3v7z" stroke-linejoin="round"/>',
  linkedin: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 10v6M8 7.5v.01"/><path d="M12 16v-3.5c0-1.5 1-2.5 2.3-2.5S16 11 16 12.5V16"/><path d="M12 10v6"/>',
};
function svgIcon(name, size=24, sw=2){
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]||''}</svg>`;
}
/* Replace any static SVGICON:name:size placeholders left in the markup */
document.body.innerHTML = document.body.innerHTML.replace(/SVGICON:([a-zA-Z0-9]+):(\d+)/g, (m,name,size)=>svgIcon(name, parseInt(size)));

/* ---------------- I18N CORE ---------------- */
let currentLang = 'en'; // 'en' or 'bm'
function L(field){
  // field is either a {en, bm} object, or a plain string (untranslated) — handle both.
  if(field && typeof field === 'object') return field[currentLang] ?? field.en;
  return field;
}
const UI = {
  tagline: {en:'Interactive Patient Education', bm:'Pendidikan Interaktif Pesakit', zh:'互动病患教育'},
  brandSub: {en:'CONSULTANT CLINICAL &amp; INTERVENTIONAL RADIOLOGIST', bm:'PERUNDING KLINIKAL &amp; RADIOLOGI INTERVENSI', zh:'临床顾问兼介入放射科医生'},
  welcomeTo: {en:'Welcome to', bm:'Selamat Datang ke', zh:'欢迎使用'},
  heroSub: {en:'Your trusted guide to better health', bm:'Panduan dipercayai anda ke arah kesihatan yang lebih baik', zh:'您值得信赖的健康指南'},
  doctorRole: {en:'Consultant Clinical &amp; Interventional Radiologist', bm:'Perunding Klinikal &amp; Radiologi Intervensi', zh:'临床顾问兼介入放射科医生'},
  yearsExperience: {en:'Years Experience', bm:'Tahun Pengalaman', zh:'年经验'},
  procedures: {en:'Procedures', bm:'Prosedur', zh:'手术例数'},
  patientsTreated: {en:'Patients Treated', bm:'Pesakit Dirawat', zh:'诊治病患'},
  featuredTag: {en:'FEATURED TREATMENT', bm:'RAWATAN PILIHAN', zh:'精选疗法'},
  featTitle: {en:'Microwave Ablation for Thyroid Nodule', bm:'Ablasi Gelombang Mikro untuk Nodul Tiroid', zh:'甲状腺结节微波消融术'},
  featDesc: {en:'Microwave Ablation (MWA) is a minimally invasive procedure that uses gentle heat from microwaves to shrink thyroid lumps.', bm:'Ablasi Gelombang Mikro (MWA) ialah prosedur invasif minimum yang menggunakan haba lembut daripada gelombang mikro untuk mengecutkan ketulan tiroid.', zh:'微波消融术（MWA）是一种微创手术，利用微波产生的温和热能使甲状腺肿块缩小。'},
  watchVideoBtn: {en:'Watch Video', bm:'Tonton Video', zh:'观看视频'},
  learnMoreBtn: {en:'Learn More ›', bm:'Ketahui Lebih Lanjut ›', zh:'了解更多 ›'},
  doctorH1: {en:'Meet Your Doctor', bm:'Kenali Doktor Anda', zh:'认识您的医生'},
  doctorSub: {en:'Board-certified expertise, patient-first care', bm:'Kepakaran bertauliah, keutamaan kepada pesakit', zh:'专业认证，以病患为先'},
  doctorCredLine: {en:'Consultant Clinical &amp; Interventional Radiologist, MBBS, FRCR', bm:'Perunding Klinikal &amp; Radiologi Intervensi, MBBS, FRCR', zh:'临床顾问兼介入放射科医生，MBBS，FRCR'},
  doctorBio: {en:"Dr. Nadarajan has spent over two decades pioneering minimally invasive, image-guided treatments for tumors, vascular conditions, and fibroids — helping patients avoid open surgery wherever possible. (Dummy bio text — replace with the real profile.)",
    bm:"Dr. Nadarajan telah menghabiskan lebih dua dekad merintis rawatan invasif minimum berpandukan imej untuk ketumbuhan, keadaan vaskular, dan fibroid — membantu pesakit mengelakkan pembedahan terbuka apabila boleh. (Teks bio contoh — gantikan dengan profil sebenar.)",
    zh:"Nadarajan 医生二十多年来致力开创微创、影像引导的肿瘤、血管疾病及子宫肌瘤治疗方法，尽可能协助病患避免开刀手术。（示例简介文字——请以真实资料替换。）"},
  cred1: {en:'Fellowship in Vascular &amp; Interventional Radiology, Singapore General Hospital', bm:'Felowship dalam Radiologi Vaskular &amp; Intervensi, Singapore General Hospital', zh:'新加坡中央医院血管与介入放射学专科培训'},
  cred2: {en:'Member, Cardiovascular and Interventional Radiological Society', bm:'Ahli, Cardiovascular and Interventional Radiological Society', zh:'心血管与介入放射学会会员'},
  cred3: {en:'5,000+ image-guided procedures performed', bm:'5,000+ prosedur berpandukan imej telah dijalankan', zh:'已完成5,000多例影像引导手术'},
  cred4: {en:'Regular speaker at regional radiology conferences', bm:'Penceramah tetap di persidangan radiologi serantau', zh:'区域放射学会议常任讲者'},
  spec1: {en:'Tumor Ablation', bm:'Ablasi Ketumbuhan', zh:'肿瘤消融术'},
  spec2: {en:'Fibroid Embolization', bm:'Embolisasi Fibroid', zh:'子宫肌瘤栓塞术'},
  spec3: {en:'Vascular Access', bm:'Akses Vaskular', zh:'血管通路'},
  spec4: {en:'Prostate Artery Embolization', bm:'Embolisasi Arteri Prostat', zh:'前列腺动脉栓塞术'},
  spec5: {en:'Varicose Vein Therapy', bm:'Terapi Vena Varikos', zh:'静脉曲张治疗'},
  followLabel: {en:'Follow Dr. Chandran', bm:'Ikuti Dr. Chandran', zh:'关注 Chandran 医生'},
  doctorNamePlain: {en:'Dr. Chandran Nadarajan', bm:'Dr. Chandran Nadarajan', zh:'钱德兰·纳达拉扬医生'},
  doctorNameSidebar: {en:'DR. CHANDRAN<br><span class="accent">NADARAJAN</span>', bm:'DR. CHANDRAN<br><span class="accent">NADARAJAN</span>', zh:'钱德兰·纳达拉扬<br><span class="accent">医生</span>'},
  conditionsH1: {en:'Conditions We Treat', bm:'Keadaan Yang Kami Rawat', zh:'我们治疗的疾病'},
  conditionsSub: {en:'Tap a condition to learn more', bm:'Ketik satu keadaan untuk ketahui lebih lanjut', zh:'点击病症以了解更多'},
  backToConditions: {en:'‹ Back to Conditions', bm:'‹ Kembali ke Keadaan', zh:'‹ 返回疾病列表'},
  treatmentsH1: {en:'Treatments &amp; Procedures', bm:'Rawatan &amp; Prosedur', zh:'疗法与手术'},
  treatmentsSub: {en:'Minimally invasive options explained simply', bm:'Pilihan invasif minimum diterangkan dengan mudah', zh:'简明介绍各种微创疗法'},
  backToTreatments: {en:'‹ Back to Treatments', bm:'‹ Kembali ke Rawatan', zh:'‹ 返回疗法列表'},
  videosH1: {en:'Patient Education Videos', bm:'Video Pendidikan Pesakit', zh:'病患教育视频'},
  videosSub: {en:'Short, easy-to-understand explainers', bm:'Penerangan ringkas yang mudah difahami', zh:'简短易懂的讲解视频'},
  educationH1: {en:'Education Library', bm:'Pustaka Pendidikan', zh:'教育资料库'},
  educationSub: {en:'Guides and brochures to read at your own pace', bm:'Panduan dan risalah untuk dibaca mengikut masa anda', zh:'指南与手册，随时阅读'},
  testimonialsH1: {en:'Patient Testimonials', bm:'Testimoni Pesakit', zh:'病患心声'},
  testimonialsSub: {en:"Real stories, in patients' own words", bm:'Kisah benar, dalam kata-kata pesakit sendiri', zh:'病患真实经历分享'},
  reviewsH1: {en:'Reviews', bm:'Ulasan', zh:'评价'},
  reviewsSub: {en:'What patients are saying', bm:'Apa kata pesakit kami', zh:'病患怎么说'},
  apptH1: {en:'Book an Appointment', bm:'Tempah Janji Temu', zh:'预约看诊'},
  apptSub: {en:'Reach the clinic directly on WhatsApp', bm:'Hubungi klinik terus melalui WhatsApp', zh:'通过WhatsApp直接联系诊所'},
  waH2: {en:'Book via WhatsApp', bm:'Tempah melalui WhatsApp', zh:'通过WhatsApp预约'},
  waP: {en:'Scan the QR code with your phone camera to start a chat with the clinic and request your appointment directly — fastest way to reach us.',
    bm:'Imbas kod QR dengan kamera telefon anda untuk memulakan sembang dengan klinik dan mohon janji temu terus — cara terpantas untuk menghubungi kami.',
    zh:'用手机相机扫描二维码，即可与诊所开始对话并直接预约——是联系我们最快的方式。'},
  clinicContactLabel: {en:'Clinic contact:', bm:'Hubungi klinik:', zh:'诊所联系方式：'},
  clinicContactLabel2: {en:'Clinic contact:', bm:'Hubungi klinik:', zh:'诊所联系方式：'},
  waOpenBtn: {en:'Open WhatsApp Chat', bm:'Buka Sembang WhatsApp', zh:'打开WhatsApp对话'},
  qrH1: {en:'Scan to Chat on WhatsApp', bm:'Imbas untuk Sembang di WhatsApp', zh:'扫描以在WhatsApp上对话'},
  qrSub: {en:'Message the clinic directly to book or ask a question', bm:'Hantar mesej terus kepada klinik untuk menempah atau bertanya soalan', zh:'直接发送信息给诊所以预约或咨询问题'},
  qrScanH3: {en:'Scan with your phone camera', bm:'Imbas dengan kamera telefon anda', zh:'用手机相机扫描'},
  qrScanP: {en:'This opens a WhatsApp chat with the clinic so you can book an appointment or ask a question directly.',
    bm:'Ini akan membuka sembang WhatsApp dengan klinik supaya anda boleh menempah janji temu atau bertanya soalan terus.',
    zh:'这将打开与诊所的WhatsApp对话，方便您直接预约或咨询问题。'},
  patientEducationSeries: {en:'Patient Education Series', bm:'Siri Pendidikan Pesakit', zh:'病患教育系列'},
  watchOnYoutube: {en:'Watch on YouTube instead', bm:'Tonton di YouTube sebaliknya', zh:'改为在YouTube观看'},
  microwaveVideoTitle: {en:'Microwave Ablation for Thyroid Nodule', bm:'Ablasi Gelombang Mikro untuk Nodul Tiroid', zh:'甲状腺结节微波消融术'},
  overview: {en:'Overview', bm:'Gambaran Keseluruhan', zh:'概述'},
  commonSymptoms: {en:'Common Symptoms', bm:'Gejala Biasa', zh:'常见症状'},
  commonCauses: {en:'Common Causes', bm:'Punca Biasa', zh:'常见病因'},
  howDiagnosed: {en:"How It's Diagnosed", bm:'Cara Ia Didiagnosis', zh:'诊断方式'},
  howItWorks: {en:'How It Works', bm:'Cara Ia Berfungsi', zh:'手术过程'},
  benefits: {en:'Benefits', bm:'Faedah', zh:'优点'},
  recovery: {en:'Recovery', bm:'Pemulihan', zh:'恢复情况'},
  relatedTreatment: {en:'Related Treatment', bm:'Rawatan Berkaitan', zh:'相关疗法'},
  relatedTreatments: {en:'Related Treatments', bm:'Rawatan Berkaitan', zh:'相关疗法'},
  conditionsThisTreats: {en:'Condition This Treats', bm:'Keadaan Yang Dirawat', zh:'适用病症'},
  conditionsThisTreatsPlural: {en:'Conditions This Treats', bm:'Keadaan Yang Dirawat', zh:'适用病症'},
  treatmentOption: {en:'Treatment option', bm:'Pilihan rawatan', zh:'治疗选项'},
  conditionTreated: {en:'Condition treated', bm:'Keadaan dirawat', zh:'相关病症'},
  questionsAboutCondition: {en:'Have questions about this condition?', bm:'Ada soalan tentang keadaan ini?', zh:'对这个病症有疑问吗？'},
  bookConsultation: {en:'Book a Consultation', bm:'Tempah Konsultasi', zh:'预约咨询'},
  curiousAboutTreatment: {en:'Curious if this treatment is right for you?', bm:'Ingin tahu jika rawatan ini sesuai untuk anda?', zh:'想知道这个疗法是否适合您？'},
};
function applyUI(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.dataset.i18n;
    if(UI[key]) el.innerHTML = L(UI[key]);
  });
}

/* ---------------- NAV CONFIG ---------------- */
const NAV = [
  {id:'home', label:{en:'Home', bm:'Utama', zh:'首页'}, color:'#d4a94a', icon:'home'},
  {id:'doctor', label:{en:'Meet Doctor', bm:'Kenali Doktor', zh:'认识医生'}, color:'#2f6fed', icon:'user'},
  {id:'conditions', label:{en:'Conditions', bm:'Keadaan', zh:'疾病'}, color:'#14b8a6', icon:'stethoscope'},
  {id:'treatments', label:{en:'Treatments', bm:'Rawatan', zh:'疗法'}, color:'#8b5cf6', icon:'syringe'},
  {id:'videos', label:{en:'Videos', bm:'Video', zh:'视频'}, color:'#ef4444', icon:'play'},
  {id:'education', label:{en:'Education', bm:'Pendidikan', zh:'教育资料'}, color:'#f97316', icon:'book'},
  {id:'testimonials', label:{en:'Testimonials', bm:'Testimoni', zh:'病患心声'}, color:'#14b8a6', icon:'star'},
  {id:'reviews', label:{en:'Reviews', bm:'Ulasan', zh:'评价'}, color:'#eab308', icon:'message'},
  {id:'appointment', label:{en:'Appointment', bm:'Janji Temu', zh:'预约'}, color:'#2f6fed', icon:'calendar'},
  {id:'qr', label:{en:'Scan QR Code', bm:'Imbas Kod QR', zh:'扫描二维码'}, color:'#ec4899', icon:'qr'},
];
