/* ============================================================
   KIOSK MODE (installed-app / touch-screen use)
   - First tap goes fullscreen (hides the title bar and the Windows
     taskbar); if someone bumps out of fullscreen the next tap puts it back.
   - Hidden exit: tap the bottom-left corner once, then enter the exit
     password. Correct password leaves fullscreen and
     closes the app window.
   - Only active when running as an installed app (or with ?kiosk=1), so
     ordinary visitors opening /kiosk in a browser tab are never forced
     into fullscreen.
   The password is stored as a salted SHA-256 hash, not as plain text.
   ============================================================ */
(function(){
  var EXIT_HASH = 'baa618975c1f1e75d61ee792b91f98173c7a2413aadb324c58dd2ba6acb46a8f';
  var SALT = 'irsabah-kiosk-exit:';

  function mq(q){ try{ return window.matchMedia(q).matches; }catch(e){ return false; } }
  /* Inside the Windows kiosk wrapper app (Electron) the app itself handles
     fullscreen and the exit password; the page only keeps the bottom-left
     corner free of menu buttons for the app's hidden exit area. */
  if(/Electron\/|IRSabahKiosk\//.test(navigator.userAgent)){
    document.documentElement.classList.add('kiosk-app');
    var es = document.createElement('style');
    es.textContent = 'html.kiosk-app .bottom-nav{padding-left:90px;}';
    document.head.appendChild(es);
    return;
  }
  var active = mq('(display-mode: standalone)') || mq('(display-mode: fullscreen)') ||
               !!window.navigator.standalone || /[?&]kiosk=1\b/.test(location.search);
  if(!active) return;

  var de = document.documentElement;
  de.classList.add('kiosk-app');   // leaves the bottom-left corner free of menu items
  var adminExited = false;

  function isFs(){ return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function lockKeys(){
    try{ if(navigator.keyboard && navigator.keyboard.lock) navigator.keyboard.lock(['Escape']).catch(function(){}); }catch(e){}
  }
  function goFs(){
    if(adminExited || isFs()) return;
    var req = de.requestFullscreen || de.webkitRequestFullscreen;
    if(!req) return;
    try{
      var p = req.call(de, {navigationUI:'hide'});
      if(p && p.then) p.then(lockKeys, function(){});
    }catch(e){}
  }
  ['click','touchend','keydown'].forEach(function(t){ document.addEventListener(t, goFs, true); });

  /* ---------- hidden hotspot: one tap in the bottom-left corner ---------- */
  var css = document.createElement('style');
  css.textContent =
    'html.kiosk-app .bottom-nav{padding-left:90px;}' +
    '#kioskExitHotspot{position:fixed;bottom:0;left:0;width:calc(90px * var(--ui-zoom,1));height:calc(90px * var(--ui-zoom,1));z-index:100000;background:transparent;-webkit-tap-highlight-color:transparent;}' +
    '#kioskExitOverlay{position:fixed;inset:0;z-index:100001;background:rgba(8,20,40,.78);display:none;align-items:center;justify-content:center;font-family:inherit;}' +
    '#kioskExitOverlay.show{display:flex;}' +
    '#kioskExitBox{zoom:var(--ui-zoom,1);background:#0b1e38;color:#fff;border-radius:18px;padding:26px 28px;width:min(420px,90vw);box-shadow:0 20px 60px rgba(0,0,0,.5);}' +
    '#kioskExitBox h3{margin:0 0 6px;font-size:20px;}' +
    '#kioskExitBox p{margin:0 0 16px;font-size:13px;color:#9fb0c8;}' +
    '#kioskExitPw{width:100%;box-sizing:border-box;padding:13px 14px;font-size:17px;border-radius:10px;border:1.5px solid #2b4268;background:#0a2647;color:#fff;outline:none;}' +
    '#kioskExitPw:focus{border-color:#d4a94a;}' +
    '#kioskExitErr{min-height:20px;margin:8px 0 0;font-size:13px;color:#ff8a8a;}' +
    '#kioskExitBox .row{display:flex;gap:10px;margin-top:10px;}' +
    '#kioskExitBox button{flex:1;padding:13px;font-size:15px;font-weight:700;border-radius:10px;border:none;cursor:pointer;}' +
    '#kioskExitCancel{background:#1b3358;color:#fff;}' +
    '#kioskExitOk{background:#d4a94a;color:#081b36;}';
  document.head.appendChild(css);

  var hot = document.createElement('div');
  hot.id = 'kioskExitHotspot';
  hot.setAttribute('aria-hidden','true');

  var ov = document.createElement('div');
  ov.id = 'kioskExitOverlay';
  ov.innerHTML =
    '<div id="kioskExitBox" role="dialog" aria-modal="true">' +
      '<h3>Exit kiosk</h3><p>Enter the exit password to close the app.</p>' +
      '<input id="kioskExitPw" type="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Password">' +
      '<div id="kioskExitErr"></div>' +
      '<div class="row"><button id="kioskExitCancel" type="button">Cancel</button><button id="kioskExitOk" type="button">Exit</button></div>' +
    '</div>';

  function mount(){ document.body.appendChild(hot); document.body.appendChild(ov); wire(); }
  if(document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  var autoCloseTimer = null, failCount = 0, lockedUntil = 0;

  function sha256hex(str){
    var enc = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', enc).then(function(buf){
      return Array.prototype.map.call(new Uint8Array(buf), function(b){ return ('0'+b.toString(16)).slice(-2); }).join('');
    });
  }
  function openPrompt(){
    var pw = document.getElementById('kioskExitPw');
    pw.value = ''; document.getElementById('kioskExitErr').textContent = '';
    ov.classList.add('show');
    setTimeout(function(){ try{ pw.focus(); }catch(e){} }, 50);
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(closePrompt, 30000);   // never leave the prompt sitting open
  }
  function closePrompt(){ clearTimeout(autoCloseTimer); ov.classList.remove('show'); }

  function doExit(){
    adminExited = true;
    closePrompt();
    try{ if(navigator.keyboard && navigator.keyboard.unlock) navigator.keyboard.unlock(); }catch(e){}
    try{ if(isFs()){ (document.exitFullscreen || document.webkitExitFullscreen).call(document); } }catch(e){}
    setTimeout(function(){ try{ window.close(); }catch(e){} }, 250);
  }
  function submit(){
    var err = document.getElementById('kioskExitErr');
    var now = Date.now();
    if(now < lockedUntil){ err.textContent = 'Too many attempts. Try again in ' + Math.ceil((lockedUntil-now)/1000) + 's.'; return; }
    var val = document.getElementById('kioskExitPw').value;
    if(!(window.crypto && crypto.subtle)){ err.textContent = 'Cannot verify here (page is not secure).'; return; }
    sha256hex(SALT + val).then(function(h){
      if(h === EXIT_HASH){ failCount = 0; doExit(); }
      else {
        failCount++;
        if(failCount >= 5){ lockedUntil = Date.now() + 30000; failCount = 0; err.textContent = 'Too many attempts. Locked for 30s.'; }
        else err.textContent = 'Wrong password.';
        document.getElementById('kioskExitPw').value = '';
      }
    });
  }
  function wire(){
    hot.addEventListener('pointerup', openPrompt);   // single tap, like the old Windows kiosk app
    document.getElementById('kioskExitCancel').addEventListener('click', closePrompt);
    document.getElementById('kioskExitOk').addEventListener('click', submit);
    document.getElementById('kioskExitPw').addEventListener('keydown', function(e){
      e.stopPropagation();
      if(e.key === 'Enter') submit();
      if(e.key === 'Escape') closePrompt();
    });
    ov.addEventListener('pointerdown', function(e){ if(e.target === ov) closePrompt(); });
  }
})();
