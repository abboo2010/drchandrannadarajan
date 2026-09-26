// Private-preview password gate for the public website pages.
// Runs on Netlify's edge BEFORE the page is served, so the pages cannot be read without signing in.
// The kiosk (/kiosk), /admin and /api are NOT covered, so they keep working.
//
// Settings (Netlify -> Site configuration -> Environment variables):
//   SITE_PASSWORD  (required)  the password reviewers must type
//   SITE_USER      (optional)  username, default "preview"
//   SITE_GATE      (optional)  set to "off" to remove the gate (then redeploy)

const COOKIE = 'irs_preview';
const MAX_AGE = 60 * 60 * 24 * 7; // stay signed in for 7 days
const enc = new TextEncoder();

const env = (k) => {
  try { return (typeof Netlify !== 'undefined' && Netlify.env.get(k)) || ''; } catch (e) { return ''; }
};

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

async function hmac(key, msg) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return toHex(await crypto.subtle.sign('HMAC', k, enc.encode(msg)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function makeToken(secret) {
  const exp = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  return exp + '.' + (await hmac(secret, 'irs|' + exp));
}

async function validToken(token, secret) {
  if (!token) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(secret, 'irs|' + exp));
}

function getCookie(req, name) {
  const m = (req.headers.get('cookie') || '').match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : '';
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function safeNext(n) {
  return typeof n === 'string' && n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/__') ? n : '/';
}

function loginPage(next, error, status) {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Sign in | Dr. Chandran Nadarajan</title>
<link rel="icon" href="/icon-192.png">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet">
<style>
:root{--navy:#0a2647;--navy2:#06162e;--gold:#e9b949;--gold2:#c99a2e;--ink:#0b1b33;--mute:#5a6884}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:96px 16px 40px;
 font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:var(--ink);
 background:radial-gradient(1200px 600px at 50% -10%,#dfe9f7 0,#eef3fb 45%,#f6f8fc 100%)}
.card{position:relative;width:100%;max-width:560px;background:#fff;border-radius:32px;padding:88px 44px 36px;
 box-shadow:0 30px 80px -20px rgba(10,38,71,.28),0 4px 14px rgba(10,38,71,.06);text-align:center}
.logo{position:absolute;left:50%;top:-56px;transform:translateX(-50%);width:112px;height:112px;border-radius:50%;
 background:#0a2647;display:grid;place-items:center;box-shadow:0 10px 30px rgba(10,38,71,.3);border:4px solid #fff;overflow:hidden}
.logo img{width:100%;height:100%;object-fit:cover}
.pill{display:inline-block;padding:9px 20px;border-radius:999px;background:#e8f0fb;color:#2b5d9b;font-weight:700;font-size:13px;letter-spacing:.14em}
h1{font-family:'Playfair Display',serif;font-size:30px;line-height:1.15;margin:22px 0 6px;color:var(--navy2)}
.role{color:#2b6fa8;font-weight:700;font-size:16px;margin:0 0 16px}
.msg{color:var(--mute);font-size:16.5px;line-height:1.6;margin:0 auto 26px;max-width:420px}
form{text-align:left}
label{display:block;font-weight:700;font-size:15px;margin:0 0 8px}
.field{position:relative;margin-bottom:20px}
input{width:100%;height:56px;border:1.5px solid #d6deec;border-radius:16px;padding:0 18px;font:inherit;font-size:16px;background:#f7f9fd;color:var(--ink);outline:none;transition:.15s}
input:focus{border-color:#2b6fa8;background:#fff;box-shadow:0 0 0 4px rgba(43,111,168,.15)}
.eye{position:absolute;right:8px;top:8px;width:40px;height:40px;border:0;background:none;cursor:pointer;color:#4a5b78;border-radius:10px}
.eye:hover{background:#eef2f9}
.btn{width:100%;height:56px;border:0;border-radius:999px;background:#2b6fa8;color:#fff;font:inherit;font-size:18px;font-weight:700;cursor:pointer;box-shadow:0 10px 24px -8px rgba(43,111,168,.6);transition:.15s}
.btn:hover{background:#245e91;transform:translateY(-1px)}
.err{background:#fdecec;color:#b42318;border:1px solid #f6c7c3;padding:12px 14px;border-radius:12px;font-weight:600;font-size:14.5px;margin:0 0 18px}
.foot{margin:26px 0 0;padding-top:18px;border-top:1px solid #e6ecf5;text-align:center;color:#7a879f;font-size:13.5px;line-height:1.55}
@media(max-width:520px){.card{padding:84px 22px 28px;border-radius:26px}h1{font-size:25px}}
</style></head><body>
<main class="card">
  <div class="logo"><img src="/images/logo.png" alt="IR@SABAH"></div>
  <span class="pill">PRIVATE PREVIEW</span>
  <h1>Dr. Chandran Nadarajan</h1>
  <p class="role">Consultant Clinical &amp; Interventional Radiologist</p>
  <p class="msg">This website is being prepared and is not yet open to the public. Please sign in to view it.</p>
  <form method="post" action="/__login" autocomplete="on">
    ${error ? '<div class="err" role="alert">' + esc(error) + '</div>' : ''}
    <input type="hidden" name="next" value="${esc(next)}">
    <label for="u">Username</label>
    <div class="field"><input id="u" name="username" type="text" autocomplete="username" autocapitalize="none" required autofocus></div>
    <label for="p">Password</label>
    <div class="field"><input id="p" name="password" type="password" autocomplete="current-password" required>
      <button class="eye" type="button" aria-label="Show password" onclick="var i=document.getElementById('p');i.type=i.type==='password'?'text':'password'">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
      </button></div>
    <button class="btn" type="submit">Sign in</button>
  </form>
  <p class="foot">Access is limited to invited reviewers.<br>If you need access, please contact Click 4 Tech Solutions.</p>
</main></body></html>`;
  return new Response(html, {
    status: status || 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', 'x-robots-tag': 'noindex, nofollow' },
  });
}

const cookieHeader = (value, maxAge) =>
  `${COOKIE}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;

export default async function gate(request, context) {
  if (env('SITE_GATE').toLowerCase() === 'off') return context.next();

  const url = new URL(request.url);
  const password = env('SITE_PASSWORD');
  const user = env('SITE_USER') || 'preview';

  // Fail closed: if no password is configured, nobody gets in until one is set.
  if (!password) {
    return new Response('Site is locked: SITE_PASSWORD is not set in Netlify environment variables.', {
      status: 503, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
    });
  }

  const secret = password + '|' + user;

  if (url.pathname === '/__logout') {
    return new Response(null, { status: 303, headers: { location: '/', 'set-cookie': cookieHeader('', 0) } });
  }

  if (url.pathname === '/__login') {
    if (request.method !== 'POST') return Response.redirect(new URL('/', url), 303);
    const form = await request.formData();
    const next = safeNext(String(form.get('next') || '/'));
    const u = String(form.get('username') || '').trim();
    const p = String(form.get('password') || '');
    const ok = safeEqual(await hmac('cmp', u.toLowerCase()), await hmac('cmp', user.toLowerCase())) &&
               safeEqual(await hmac('cmp', p), await hmac('cmp', password));
    if (!ok) {
      await new Promise((r) => setTimeout(r, 900)); // slow down guessing
      return loginPage(next, 'Incorrect username or password.', 401);
    }
    return new Response(null, {
      status: 303,
      headers: { location: next, 'set-cookie': cookieHeader(await makeToken(secret), MAX_AGE), 'cache-control': 'no-store' },
    });
  }

  if (await validToken(getCookie(request, COOKIE), secret)) {
    const res = await context.next();
    const h = new Headers(res.headers);
    h.set('cache-control', 'private, no-store');
    h.set('x-robots-tag', 'noindex, nofollow');
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h });
  }

  // Not signed in: pages get the login form; assets just get 401.
  const isPage = /^\/($|index\.html$|(about|conditions|treatments|videos|contact)(\.html)?$)/.test(url.pathname);
  if (isPage && request.method === 'GET') return loginPage(url.pathname === '/index.html' ? '/' : url.pathname, '', 200);
  return new Response('Please sign in.', { status: 401, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' } });
}

export const config = {
  path: [
    '/', '/index.html',
    '/about', '/about.html', '/conditions', '/conditions.html', '/treatments', '/treatments.html',
    '/videos', '/videos.html', '/contact', '/contact.html',
    '/site.css', '/site.js', '/splash.css', '/images/site/*',
    '/__login', '/__logout',
  ],
};
