/* ============================================================
   IR@SABAH FAQ chatbot — widget + keyword matching (no AI, no network).
   Wording lives in chatbot-data.js. Condition / treatment answers are read
   live from CONDITIONS / TREATMENTS (content-data.js, refreshed from the CMS
   by site.js), so the bot only repeats text already reviewed for the site.
   Everything is inserted with textContent — no innerHTML from content.
   ============================================================ */
(function(){
'use strict';
if(!window.CHATBOT_DATA || window.__irsChat) return;
window.__irsChat = true;

const D = window.CHATBOT_DATA;
const LANGS = ['en','bm','zh'];
const FALLBACK_WA = 'https://wa.me/60124775257';

/* ---------- helpers ---------- */
const decode = s => { const t = document.createElement('textarea'); t.innerHTML = s == null ? '' : String(s); return t.value; };
const asList = v => Array.isArray(v) ? v : (v ? String(v).split(/\n+/).map(x => x.trim()).filter(Boolean) : []);
const conds  = () => (typeof CONDITIONS !== 'undefined' && Array.isArray(CONDITIONS)) ? CONDITIONS : [];
const treats = () => (typeof TREATMENTS !== 'undefined' && Array.isArray(TREATMENTS)) ? TREATMENTS : [];
const kindList = k => k === 'c' ? conds() : treats();
const findItem = (k, id) => kindList(k).find(i => i.id === id);
const curLang = () => { const l = (document.documentElement.lang || 'en').toLowerCase(); return l.startsWith('zh') ? 'zh' : (l === 'ms' || l.startsWith('ms-') ? 'bm' : 'en'); };
const ui = () => D.ui[curLang()];
const L = (it, base) => decode(it[base + '_' + curLang()] || it[base + '_en'] || '');
const waHref = () => { const a = document.querySelector('a[data-wa][href^="http"]'); return a ? a.href : FALLBACK_WA; };
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

function el(tag, cls, text){
  const n = document.createElement(tag);
  if(cls) n.className = cls;
  if(text != null) n.textContent = text;
  return n;
}

/* ---------- matching ---------- */
const STOP = new Set(['and','the','for','with','long','term','general','related','what','about']);
const stem = w => w.replace(/(es|s)$/,'');
const words = q => q.split(/[^a-z0-9]+/).filter(Boolean);
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function kwHit(q, k){
  k = k.toLowerCase();
  if(/[^\x00-\x7f]/.test(k)) return q.includes(k);               // Chinese: substring
  return new RegExp('(^|[^a-z0-9])' + escRe(k)).test(q);          // Latin: word-start (allows plurals)
}
function faqScore(q, f){
  let s = 0;
  LANGS.forEach(l => (f.kw[l] || []).forEach(k => { if(kwHit(q, k)) s += k.includes(' ') ? 2 : 1; }));
  return s;
}
function itemScore(it, q, qStems){
  let s = 0;
  ['en','bm'].forEach(l => {
    const title = decode(it['title_' + l]).toLowerCase();
    if(title.length >= 4 && q.includes(title)) s += 5;
    title.split(/[^a-z0-9]+/).forEach(t => {
      if(t.length >= 3 && !STOP.has(t) && qStems.has(stem(t))) s += 1;
    });
  });
  const zh = decode(it.title_zh);
  if(zh && q.includes(zh)) s += 5;
  for(let i = 0; i + 2 <= zh.length; i++) if(q.includes(zh.slice(i, i + 2))) s += 1;
  return s;
}
function bestItems(q){
  const qStems = new Set(words(q).map(stem));
  const all = [];
  [['c', conds()], ['t', treats()]].forEach(([k, arr]) => arr.forEach(it => {
    const sc = itemScore(it, q, qStems); if(sc > 0) all.push({ k, it, sc });
  }));
  all.sort((a, b) => b.sc - a.sc);
  return all;
}
const SECTION_KW = {
  symptoms:  ['symptom','sign','gejala','simptom','症状','徵','征'],
  causes:    ['cause','why','risk factor','punca','sebab','成因','原因','为什么'],
  diagnosis: ['diagnos','test','scan','detect','ujian','imbasan','诊断','检查','检测'],
  steps:     ['how is it done','how does','how it work','procedure','step','prosedur','cara','langkah','过程','步骤','怎么做','怎样'],
  benefits:  ['benefit','advantage','manfaat','kelebihan','好处','优点'],
  recovery:  ['recover','after','pemulihan','selepas','康复','恢复','术后']
};
const COND_SECTIONS  = ['symptoms','causes','diagnosis'];
const TREAT_SECTIONS = ['steps','benefits','recovery'];

/* ---------- UI ---------- */
let fab, panel, msgs, chips, input, form, titleEl, subEl, noteEl, closeBtn, sendBtn;
let started = false, busy = false;

const ICON_CHAT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.2 3.6c-.5.4-1.3.1-1.3-.6V16A2.5 2.5 0 0 1 4 13.5v-8Z"/><circle cx="9" cy="9.5" r="1.1"/><circle cx="12" cy="9.5" r="1.1"/><circle cx="15" cy="9.5" r="1.1"/></svg>';

function build(){
  fab = el('button', 'irs-chat-fab'); fab.type = 'button'; fab.innerHTML = ICON_CHAT;
  fab.setAttribute('aria-expanded', 'false'); fab.setAttribute('aria-controls', 'irsChat');

  panel = el('section', 'irs-chat'); panel.id = 'irsChat'; panel.hidden = true;
  panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'false');

  const head = el('header', 'irs-chat-head');
  const ttl = el('div', 'irs-chat-ttl'); titleEl = el('strong'); subEl = el('small'); ttl.append(titleEl, subEl);
  closeBtn = el('button', 'irs-chat-x', '✕'); closeBtn.type = 'button';
  head.append(ttl, closeBtn);

  msgs = el('div', 'irs-chat-msgs'); msgs.setAttribute('aria-live', 'polite'); msgs.tabIndex = 0;
  chips = el('div', 'irs-chat-chips');
  noteEl = el('p', 'irs-chat-note');

  form = el('form', 'irs-chat-form'); form.autocomplete = 'off';
  input = el('input'); input.type = 'text'; input.maxLength = 200; input.setAttribute('enterkeyhint', 'send');
  sendBtn = el('button', 'irs-chat-send'); sendBtn.type = 'submit';
  sendBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12 20 4l-4 16-4-6-8-2Z"/></svg>';
  form.append(input, sendBtn);

  panel.append(head, msgs, chips, noteEl, form);
  document.body.append(panel, fab);

  fab.addEventListener('click', () => panel.hidden ? open() : close());
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', e => { if(e.key === 'Escape' && !panel.hidden) close(); });
  form.addEventListener('submit', e => { e.preventDefault(); const v = input.value.trim(); if(v){ input.value = ''; ask(v); } });

  // follow the site's language switch
  new MutationObserver(applyUiText).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });
  applyUiText();
}

function applyUiText(){
  const u = ui();
  titleEl.textContent = u.title; subEl.textContent = u.sub;
  fab.setAttribute('aria-label', u.open); fab.title = u.open;
  closeBtn.setAttribute('aria-label', u.close);
  panel.setAttribute('aria-label', u.title);
  input.placeholder = u.placeholder; input.setAttribute('aria-label', u.placeholder);
  sendBtn.setAttribute('aria-label', u.send);
  noteEl.textContent = u.disclaimer;
  if(started && !busy && chips.dataset.mode === 'menu') showMenu();
}

function open(){
  panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); document.body.classList.add('irs-chat-open');
  if(!started){ started = true; botSay([u => el('p', null, u.welcome)]).then(showMenu); }
  setTimeout(() => input.focus({ preventScroll: true }), 50);
}
function close(){
  panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); document.body.classList.remove('irs-chat-open');
  fab.focus({ preventScroll: true });
}

/* ---------- messages ---------- */
function scrollDown(){ msgs.scrollTop = msgs.scrollHeight; }
function userSay(text){ const m = el('div', 'irs-msg irs-user'); m.append(el('p', null, text)); msgs.append(m); scrollDown(); }

/* parts: array of nodes or functions(ui) -> node. Resolved when shown so the UI language is current. */
function botSay(parts){
  busy = true; chips.replaceChildren();
  const typing = el('div', 'irs-msg irs-bot irs-typing'); typing.setAttribute('aria-hidden', 'true');
  typing.innerHTML = '<span></span><span></span><span></span>';
  msgs.append(typing); scrollDown();
  return new Promise(res => setTimeout(() => {
    typing.remove();
    const m = el('div', 'irs-msg irs-bot');
    parts.forEach(p => { const n = typeof p === 'function' ? p(ui()) : p; if(n) m.append(n); });
    msgs.append(m); scrollDown(); busy = false; res();
  }, reduceMotion ? 0 : 380));
}

function listNode(items, ordered){
  const ul = el(ordered ? 'ol' : 'ul');
  items.forEach(x => ul.append(el('li', null, decode(x))));
  return ul;
}
function linkBtn(href, label, cls, external){
  const a = el('a', 'irs-btn ' + (cls || ''), label); a.href = href;
  if(external){ a.target = '_blank'; a.rel = 'noopener'; }
  return a;
}
const waBtn = () => linkBtn(waHref(), ui().wa, 'irs-btn-wa', true);

/* ---------- chips ---------- */
function setChips(list, mode){
  chips.replaceChildren(); chips.dataset.mode = mode || '';
  list.forEach(c => {
    const b = el('button', 'irs-chip' + (c.cls ? ' ' + c.cls : ''), c.label); b.type = 'button';
    b.addEventListener('click', () => { if(busy) return; userSay(c.label); c.fn(); });
    chips.append(b);
  });
  scrollDown();
}
function showMenu(){
  const u = ui();
  setChips([
    { label: u.topics.cond,  fn: pickList.bind(null, 'c') },
    { label: u.topics.treat, fn: pickList.bind(null, 't') },
    { label: u.topics.book,  fn: () => answerFaq('book') },
    { label: u.topics.about, fn: () => answerFaq('about') },
    { label: u.topics.ir,    fn: () => answerFaq('ir') }
  ], 'menu');
}
const menuChip = () => ({ label: ui().menu, cls: 'irs-chip-alt', fn: () => botSay([]).then(showMenu) });

/* ---------- answers ---------- */
function pickList(kind){
  const u = ui();
  botSay([() => el('p', null, kind === 'c' ? u.pickCond : u.pickTreat)]).then(() => {
    setChips(kindList(kind).map(it => ({ label: L(it, 'title'), fn: () => answerItem(kind, it) })).concat([menuChip()]));
  });
}

function sectionNodes(kind, it, sec){
  const u = ui();
  const key = sec === 'overview' ? 'overview' : sec;
  const h = el('h4', null, u.sec[sec]);
  let body;
  if(['symptoms','causes','steps','benefits'].includes(key)){
    const list = asList(it[key + '_' + curLang()] || it[key + '_en']);
    if(!list.length) return null;
    body = listNode(list, key === 'steps');
  } else {
    const txt = L(it, key); if(!txt) return null;
    body = el('p', null, txt);
  }
  return [h, body];
}
function hasSection(kind, it, sec){ return !!sectionNodes(kind, it, sec); }

function answerItem(kind, it, sec){
  sec = sec || 'overview';
  const u = ui();
  const first = (kind === 'c' ? COND_SECTIONS : TREAT_SECTIONS).includes(sec) || sec === 'overview' ? sec : 'overview';
  const nodes = sectionNodes(kind, it, first) || sectionNodes(kind, it, 'overview');
  const parts = [() => { const t = el('p', 'irs-title', L(it, 'title')); return t; }];
  if(nodes) nodes.forEach(n => parts.push(() => n));
  botSay(parts).then(() => {
    const secs = (kind === 'c' ? COND_SECTIONS : TREAT_SECTIONS).filter(s => s !== first && hasSection(kind, it, s));
    if(first !== 'overview' && hasSection(kind, it, 'overview')) secs.unshift('overview');
    const list = secs.map(s => ({ label: u.sec[s], fn: () => answerItem(kind, it, s) }));
    // related items of the other kind
    const relKind = kind === 'c' ? 't' : 'c';
    String(it.related || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 4).forEach(id => {
      const r = findItem(relKind, id); if(r) list.push({ label: L(r, 'title'), cls: 'irs-chip-rel', fn: () => answerItem(relKind, r) });
    });
    // "full details" opens the site's own detail modal (only on pages that have it)
    if(document.getElementById('detailModal')){
      const more = el('button', 'irs-chip irs-chip-alt', u.seeMore); more.type = 'button';
      more.dataset.open = kind + ':' + it.id;
      setChips(list.concat([menuChip()]));
      chips.append(more);
    } else setChips(list.concat([menuChip()]));
    if(kind === 'c' && first === 'overview') offerBook();
  });
}
function offerBook(){ /* a quiet extra: WhatsApp button inside chips area */
  const w = waBtn(); w.classList.add('irs-btn-inline'); chips.append(w); scrollDown();
}

function answerFaq(id){
  const f = D.faqs.find(x => x.id === id); if(!f) return noMatch();
  const l = curLang(), u = ui();
  const parts = [el('p', null, f.a[l] || f.a.en)];
  if(f.link) parts.push(linkBtn(f.link.href, f.link.label[l] || f.link.label.en, 'irs-btn-link'));
  if(f.cta === 'wa') parts.push(waBtn());
  botSay(parts).then(() => setChips([menuChip()]));
}
function noMatch(extra){
  botSay([u => el('p', null, u.noMatch), () => waBtn()]).then(() => setChips([menuChip()]));
}

/* ---------- free text ---------- */
function isUrgent(q){ return LANGS.some(l => (D.urgentKw[l] || []).some(k => kwHit(q, k))); }

function ask(text){
  if(busy) return;
  userSay(text);
  const q = text.toLowerCase();
  const urgent = isUrgent(q);
  const run = () => route(q);
  if(urgent) botSay([u => { const p = el('p', 'irs-urgent', u.urgent); return p; }]).then(run); else run();
}

function route(q){
  const items = bestItems(q);
  let bestFaq = null, fs = 0;
  D.faqs.forEach(f => { const s = faqScore(q, f); if(s > fs){ fs = s; bestFaq = f; } });
  const top = items[0];

  if(top && top.sc >= fs){
    const close = items.filter(x => x.sc === top.sc);
    if(top.sc < 5 && close.length > 1){                 // ambiguous → let them choose
      const u = ui();
      botSay([() => el('p', null, u.didYouMean)]).then(() =>
        setChips(close.slice(0, 5).map(x => ({ label: L(x.it, 'title'), fn: () => answerItem(x.k, x.it) })).concat([menuChip()])));
      return;
    }
    // did they ask about a specific section?
    const wanted = Object.keys(SECTION_KW).find(s => SECTION_KW[s].some(k => kwHit(q, k)));
    answerItem(top.k, top.it, wanted);
    return;
  }
  if(bestFaq) return answerFaq(bestFaq.id);
  noMatch();
}

/* ---------- boot ---------- */
function boot(){ build(); }
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
