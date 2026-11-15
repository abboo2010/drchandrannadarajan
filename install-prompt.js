/* IR@SABAH — "Install the app" popup for the public website.
 *
 * Shows a small bottom sheet on phones/tablets inviting the visitor to install
 * the app (PWA). Android/Chrome gets a one-tap Install button; iPhone/iPad
 * gets the "Share > Add to Home Screen" steps.
 *
 * Never shown: inside the installed app, on the /kiosk touch screen, on
 * desktop, or within 14 days of the visitor closing it.
 */
(function(){
  'use strict';

  var DISMISS_KEY = 'irs_install_dismissed';   // timestamp (ms) of last dismissal
  var INSTALLED_KEY = 'irs_install_done';      // set once the app is installed
  var SNOOZE_DAYS = 14;
  var DELAY_MS = 4000;                         // wait after page/splash is ready

  /* ---- 1. Should we ever show it? ---- */
  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var mm = window.matchMedia ? window.matchMedia.bind(window) : function(){ return { matches:false }; };
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isMobileOrTablet = isIOS || isAndroid;

  var isStandalone = mm('(display-mode: standalone)').matches || mm('(display-mode: fullscreen)').matches ||
                     navigator.standalone === true || /[?&]app=1/.test(location.search);
  var isKiosk = /^\/kiosk/.test(location.pathname) || /kiosk/i.test(location.pathname.split('/').pop());

  if(!isMobileOrTablet || isStandalone || isKiosk) return;
  if(lsGet(INSTALLED_KEY) === '1') return;
  var last = parseInt(lsGet(DISMISS_KEY) || '0', 10);
  if(last && Date.now() - last < SNOOZE_DAYS * 864e5) return;

  /* In-app browsers (Facebook, Instagram, etc.) can't install anything. */
  if(/FBAN|FBAV|Instagram|Line\/|MicroMessenger|TikTok/i.test(ua)) return;
  /* On iOS only Safari can "Add to Home Screen"; skip Chrome/Firefox/Edge on iOS. */
  if(isIOS && /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) return;

  /* ---- 2. Text (follows the site's language switch) ---- */
  var TXT = {
    en: {
      title: 'Get the IR@SABAH app',
      body: 'Install it on your phone for quick access to treatments, videos and booking. It is free and takes a few seconds.',
      install: 'Install app', later: 'Not now',
      iosTitle: 'Add IR@SABAH to your Home Screen',
      ios1: 'Tap the Share button', ios2: 'Choose "Add to Home Screen"', ios3: 'Tap "Add"',
      got: 'Got it', close: 'Close'
    },
    bm: {
      title: 'Dapatkan aplikasi IR@SABAH',
      body: 'Pasang pada telefon anda untuk akses pantas kepada rawatan, video dan tempahan. Percuma dan hanya mengambil beberapa saat.',
      install: 'Pasang aplikasi', later: 'Bukan sekarang',
      iosTitle: 'Tambah IR@SABAH ke Skrin Utama',
      ios1: 'Ketik butang Kongsi (Share)', ios2: 'Pilih "Add to Home Screen"', ios3: 'Ketik "Add"',
      got: 'Faham', close: 'Tutup'
    },
    zh: {
      title: '下载 IR@SABAH 应用',
      body: '安装到手机，随时查看治疗资讯、视频和预约。免费，只需几秒钟。',
      install: '安装应用', later: '暂不',
      iosTitle: '将 IR@SABAH 添加到主屏幕',
      ios1: '点按“分享”按钮', ios2: '选择“添加到主屏幕”', ios3: '点按“添加”',
      got: '知道了', close: '关闭'
    }
  };
  function t(){
    var l = lsGet('irs_lang');
    return TXT[l] || TXT.en;
  }

  /* ---- 3. Build the sheet (styles are injected so no CSS file is needed) ---- */
  var deferredPrompt = null;
  var sheet = null, shown = false;

  function injectCss(){
    var css =
      '.irs-install{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9999;' +
      'max-width:460px;margin:0 auto;background:#0a2647;color:#fff;border:1px solid rgba(233,185,73,.45);border-radius:18px;' +
      'box-shadow:0 18px 50px rgba(0,0,0,.45);padding:18px 18px 16px;font-family:inherit;transform:translateY(130%);' +
      'opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}' +
      '.irs-install.show{transform:none;opacity:1}' +
      '.irs-install-row{display:flex;gap:14px;align-items:flex-start}' +
      '.irs-install-icon{width:52px;height:52px;border-radius:12px;flex:none;background:#06162e;object-fit:cover}' +
      '.irs-install h3{margin:0 0 4px;font-size:1.05rem;line-height:1.25;color:#f3d387}' +
      '.irs-install p{margin:0;font-size:.9rem;line-height:1.45;color:rgba(255,255,255,.85)}' +
      '.irs-install ol{margin:10px 0 0;padding-left:20px;font-size:.92rem;line-height:1.6;color:rgba(255,255,255,.9)}' +
      '.irs-install-actions{display:flex;gap:10px;margin-top:14px}' +
      '.irs-install button{font:inherit;cursor:pointer;border-radius:999px;padding:11px 18px;font-weight:700;font-size:.92rem;border:0}' +
      '.irs-install .irs-go{flex:1;background:linear-gradient(135deg,#f3d387,#e9b949);color:#1a1204}' +
      '.irs-install .irs-no{background:transparent;color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.25)}' +
      '.irs-install .irs-x{position:absolute;top:8px;right:10px;width:32px;height:32px;padding:0;background:transparent;' +
      'color:rgba(255,255,255,.7);font-size:1.3rem;line-height:1}' +
      '@media (prefers-reduced-motion:reduce){.irs-install{transition:none}}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function render(mode){           // mode: 'main' | 'ios'
    var x = t();
    var head, body, actions;
    if(mode === 'ios'){
      head = x.iosTitle;
      body = '<ol><li>' + esc(x.ios1) + '</li><li>' + esc(x.ios2) + '</li><li>' + esc(x.ios3) + '</li></ol>';
      actions = '<button type="button" class="irs-go" data-act="dismiss">' + esc(x.got) + '</button>';
    } else {
      head = x.title;
      body = '<p>' + esc(x.body) + '</p>';
      actions = '<button type="button" class="irs-go" data-act="install">' + esc(x.install) + '</button>' +
                '<button type="button" class="irs-no" data-act="dismiss">' + esc(x.later) + '</button>';
    }
    sheet.setAttribute('data-mode', mode);
    sheet.innerHTML =
      '<button type="button" class="irs-x" data-act="dismiss" aria-label="' + esc(x.close) + '">&times;</button>' +
      '<div class="irs-install-row"><img class="irs-install-icon" src="/icon-192.png" alt="" width="52" height="52">' +
      '<div><h3 id="irsInstallTitle">' + esc(head) + '</h3>' + body + '</div></div>' +
      '<div class="irs-install-actions">' + actions + '</div>';
  }

  function hide(remember){
    if(remember) lsSet(DISMISS_KEY, String(Date.now()));
    if(!sheet) return;
    sheet.classList.remove('show');
    var s = sheet; sheet = null;
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 500);
  }

  function show(){
    if(shown) return;
    shown = true;
    injectCss();
    sheet = document.createElement('div');
    sheet.className = 'irs-install';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-labelledby', 'irsInstallTitle');
    render('main');
    document.body.appendChild(sheet);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(sheet) sheet.classList.add('show'); }); });

    sheet.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if(!b) return;
      var act = b.getAttribute('data-act');
      if(act === 'dismiss'){ hide(true); return; }
      if(act === 'install'){
        if(deferredPrompt){
          var p = deferredPrompt; deferredPrompt = null;
          p.prompt();
          (p.userChoice || Promise.resolve()).then(function(r){
            if(r && r.outcome === 'accepted'){ lsSet(INSTALLED_KEY, '1'); hide(false); }
            else hide(true);
          });
        } else if(isIOS){
          render('ios');                 // show the Add to Home Screen steps
        } else {
          hide(true);
        }
      }
    });

    /* keep the text in step if the visitor switches language while it's open */
    document.addEventListener('click', function(e){
      if(sheet && e.target.closest && e.target.closest('.lang-btn')){
        setTimeout(function(){ if(sheet) render(sheet.getAttribute('data-mode') || 'main'); }, 50);
      }
    });
  }

  /* ---- 4. When to show ---- */
  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();          // we show our own button instead of Chrome's mini-bar
    deferredPrompt = e;
  });
  window.addEventListener('appinstalled', function(){
    lsSet(INSTALLED_KEY, '1');
    deferredPrompt = null;
    hide(false);
  });

  function splashGone(){
    var s = document.getElementById('splashScreen');
    return !s || s.classList.contains('hide') || document.body.className.indexOf('splash-open') === -1;
  }

  function schedule(){
    (function wait(){
      if(!splashGone()){ setTimeout(wait, 500); return; }
      setTimeout(function(){
        /* iOS never fires beforeinstallprompt; Android needs it (otherwise it is
           already installed or the browser can't install, so say nothing). */
        if(isIOS || deferredPrompt) show();
      }, DELAY_MS);
    })();
  }

  if(document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
