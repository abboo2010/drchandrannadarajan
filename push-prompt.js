/* IR@SABAH — "Get updates" (push notification opt-in) for the INSTALLED app only.
 *
 * Runs only when the website is opened as the installed phone/tablet app
 * (home-screen icon, standalone mode). It is never shown in a normal browser
 * tab, on desktop, or on the /kiosk touch screen.
 *
 * Flow: small bottom sheet -> patient taps "Allow updates" -> browser asks
 * permission -> the phone's push subscription is saved via /api/push-subscribe.
 * If permission was already granted, the subscription is quietly re-synced
 * (at most once a day) so a refreshed token never gets lost.
 */
(function(){
  'use strict';

  // Public key only (safe to publish). Matches VAPID_PUBLIC_KEY in Netlify.
  var VAPID_PUBLIC_KEY = 'BJ0pJEj5YiSFtK6pLE9uTfkhbnZn46OF2Qf2Vo0va6YNHnHHqYk66WnSaQJWRUVc8od7k8yg-LVzUBnen3zSPFw';

  var DISMISS_KEY = 'irs_push_dismissed';   // timestamp (ms) of "Not now"
  var SYNC_KEY = 'irs_push_synced';         // timestamp (ms) of last quiet re-sync
  var SNOOZE_DAYS = 14;
  var DELAY_MS = 2500;

  function lsGet(k){ try{ return localStorage.getItem(k); }catch(e){ return null; } }
  function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }

  var mm = window.matchMedia ? window.matchMedia.bind(window) : function(){ return { matches:false }; };
  var ua = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  var isStandalone = mm('(display-mode: standalone)').matches || mm('(display-mode: fullscreen)').matches ||
                     navigator.standalone === true || /[?&]app=1/.test(location.search);
  var isKiosk = /^\/kiosk/.test(location.pathname) || /kiosk/i.test(location.pathname.split('/').pop());

  /* Installed phone/tablet app only. */
  if(!(isIOS || isAndroid) || !isStandalone || isKiosk) return;
  if(!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return;
  if(Notification.permission === 'denied') return;

  function urlBase64ToUint8Array(b64){
    var pad = '='.repeat((4 - b64.length % 4) % 4);
    var raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
    var out = new Uint8Array(raw.length);
    for(var i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
    return out;
  }

  function currentLang(){ var l = lsGet('irs_lang'); return (l === 'bm' || l === 'zh') ? l : 'en'; }

  function sendToServer(sub){
    return fetch('/api/push-subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'subscribe', subscription: sub.toJSON(), lang: currentLang() })
    }).then(function(r){ if(!r.ok) throw new Error('save failed'); });
  }

  function subscribe(reg){
    var opts = { userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) };
    return reg.pushManager.subscribe(opts).catch(function(){
      // An old subscription made with a different key blocks a new one: clear it and retry once.
      return reg.pushManager.getSubscription().then(function(old){
        return (old ? old.unsubscribe() : Promise.resolve()).then(function(){ return reg.pushManager.subscribe(opts); });
      });
    });
  }

  /* ---- Already allowed earlier: quietly keep the server copy fresh ---- */
  if(Notification.permission === 'granted'){
    var last = parseInt(lsGet(SYNC_KEY) || '0', 10);
    if(!last || Date.now() - last > 864e5){
      navigator.serviceWorker.ready.then(function(reg){
        return reg.pushManager.getSubscription().then(function(s){ return s || subscribe(reg); });
      }).then(function(s){ return sendToServer(s); })
        .then(function(){ lsSet(SYNC_KEY, String(Date.now())); })
        .catch(function(){});
    }
    return;
  }

  /* ---- Permission not asked yet: show our own friendly sheet first ---- */
  var last2 = parseInt(lsGet(DISMISS_KEY) || '0', 10);
  if(last2 && Date.now() - last2 < SNOOZE_DAYS * 864e5) return;

  var TXT = {
    en: { title: 'Get health updates', body: 'Allow notifications to hear about new treatments, health tips and clinic news from Dr. Chandran. You can turn them off any time.',
          allow: 'Allow updates', later: 'Not now', close: 'Close', thanks: 'Thank you! Updates are on.', blocked: 'Notifications were not allowed. You can change this in your phone settings.' },
    bm: { title: 'Dapatkan kemas kini kesihatan', body: 'Benarkan pemberitahuan untuk berita rawatan baharu, petua kesihatan dan maklumat klinik daripada Dr. Chandran. Anda boleh menutupnya bila-bila masa.',
          allow: 'Benarkan kemas kini', later: 'Bukan sekarang', close: 'Tutup', thanks: 'Terima kasih! Kemas kini diaktifkan.', blocked: 'Pemberitahuan tidak dibenarkan. Anda boleh mengubahnya dalam tetapan telefon.' },
    zh: { title: '接收健康资讯', body: '允许通知，及时了解 Chandran 医生的新治疗、健康贴士和诊所消息。您可随时关闭。',
          allow: '允许通知', later: '暂不', close: '关闭', thanks: '谢谢！已开启通知。', blocked: '未允许通知。您可以在手机设置中更改。' }
  };
  function t(){ return TXT[currentLang()]; }
  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  var sheet = null, shown = false;

  function injectCss(){
    var css =
      '.irs-push{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom));z-index:9999;max-width:460px;margin:0 auto;' +
      'background:#0a2647;color:#fff;border:1px solid rgba(233,185,73,.45);border-radius:18px;box-shadow:0 18px 50px rgba(0,0,0,.45);' +
      'padding:18px 18px 16px;font-family:inherit;transform:translateY(130%);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .35s}' +
      '.irs-push.show{transform:none;opacity:1}' +
      '.irs-push h3{margin:0 0 4px;font-size:1.05rem;line-height:1.25;color:#f3d387;padding-right:28px}' +
      '.irs-push p{margin:0;font-size:.9rem;line-height:1.45;color:rgba(255,255,255,.85)}' +
      '.irs-push-actions{display:flex;gap:10px;margin-top:14px}' +
      '.irs-push button{font:inherit;cursor:pointer;border-radius:999px;padding:11px 18px;font-weight:700;font-size:.92rem;border:0}' +
      '.irs-push .irs-go{flex:1;background:linear-gradient(135deg,#f3d387,#e9b949);color:#1a1204}' +
      '.irs-push .irs-no{background:transparent;color:rgba(255,255,255,.8);border:1px solid rgba(255,255,255,.25)}' +
      '.irs-push .irs-x{position:absolute;top:8px;right:10px;width:32px;height:32px;padding:0;background:transparent;color:rgba(255,255,255,.7);font-size:1.3rem;line-height:1}' +
      '@media (prefers-reduced-motion:reduce){.irs-push{transition:none}}';
    var s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
  }

  function render(msg){
    var x = t();
    sheet.innerHTML =
      '<button type="button" class="irs-x" data-act="dismiss" aria-label="' + esc(x.close) + '">&times;</button>' +
      '<h3 id="irsPushTitle">' + esc(x.title) + '</h3><p>' + esc(msg || x.body) + '</p>' +
      (msg ? '' : '<div class="irs-push-actions"><button type="button" class="irs-go" data-act="allow">' + esc(x.allow) + '</button>' +
                  '<button type="button" class="irs-no" data-act="dismiss">' + esc(x.later) + '</button></div>');
  }

  function hide(remember){
    if(remember) lsSet(DISMISS_KEY, String(Date.now()));
    if(!sheet) return;
    sheet.classList.remove('show');
    var s = sheet; sheet = null;
    setTimeout(function(){ if(s.parentNode) s.parentNode.removeChild(s); }, 500);
  }

  function allow(){
    Notification.requestPermission().then(function(perm){
      if(perm !== 'granted'){ if(sheet){ render(t().blocked); setTimeout(function(){ hide(true); }, 3500); } return; }
      return navigator.serviceWorker.ready.then(subscribe).then(sendToServer).then(function(){
        lsSet(SYNC_KEY, String(Date.now()));
        if(sheet){ render(t().thanks); setTimeout(function(){ hide(false); }, 2200); }
      });
    }).catch(function(){ hide(true); });
  }

  function show(){
    if(shown) return;
    shown = true;
    injectCss();
    sheet = document.createElement('div');
    sheet.className = 'irs-push';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-labelledby', 'irsPushTitle');
    render();
    document.body.appendChild(sheet);
    requestAnimationFrame(function(){ requestAnimationFrame(function(){ if(sheet) sheet.classList.add('show'); }); });
    sheet.addEventListener('click', function(e){
      var b = e.target.closest ? e.target.closest('[data-act]') : null;
      if(!b) return;
      if(b.getAttribute('data-act') === 'dismiss') hide(true);
      else if(b.getAttribute('data-act') === 'allow') allow();   // must run from this tap
    });
  }

  function splashGone(){
    var s = document.getElementById('splashScreen');
    return !s || s.classList.contains('hide');
  }

  function start(){
    var tries = 0;
    (function wait(){
      if(!splashGone() && tries++ < 2400){ setTimeout(wait, 250); return; }
      setTimeout(show, DELAY_MS);
    })();
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
