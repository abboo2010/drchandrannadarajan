diff --git a/admin/index.html b/admin/index.html
index a5a15db..8530b58 100644
--- a/admin/index.html
+++ b/admin/index.html
@@ -71,6 +71,13 @@
   .field-group{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:14px 16px;margin-bottom:12px;}
   .field-group > label.group-label{display:block;font-weight:700;font-size:.82rem;color:var(--ink);margin-bottom:8px;}
   .field-hint{color:var(--sub);font-size:.76rem;font-weight:400;margin-left:6px;}
+  .rel-picker{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;}
+  .rel-opt{display:flex;align-items:center;gap:8px;border:1px solid var(--line);border-radius:8px;padding:9px 10px;font-size:.86rem;cursor:pointer;background:#fff;}
+  .rel-opt input{width:18px;height:18px;flex:none;}
+  .rel-opt.on{border-color:#2f6fed;background:#eef4ff;}
+  .rel-opt.auto{opacity:.75;cursor:default;background:#f3f5f9;}
+  .rel-opt.missing{border-color:#e0a0a0;background:#fdeeee;color:#a12626;}
+  .rel-note{font-size:.76rem;color:var(--sub);margin-top:8px;}
   .lang-row{display:grid;grid-template-columns:36px 1fr;gap:8px;align-items:start;margin-bottom:6px;}
   .lang-row:last-child{margin-bottom:0;}
   .lang-tag{font-size:.72rem;font-weight:700;color:#fff;background:#9098ad;border-radius:5px;text-align:center;padding:3px 0;margin-top:4px;}
@@ -580,8 +587,10 @@
   }
 
   function fieldHintFor(key){
-    if(key === 'id') return '(technical — must stay unique, no spaces; used to link related items)';
-    if(key === 'related') return '(comma-separated IDs of related conditions/treatments)';
+    if(key === 'id') return '(technical — filled in automatically from the English title when left blank; must stay unique, no spaces)';
+    if(key === 'related') return (state.section === 'conditions' || state.section === 'treatments')
+      ? '(tick the ' + (state.section === 'conditions' ? 'treatments' : 'conditions') + ' that go with this one — the link shows on both pages automatically)'
+      : '(comma-separated IDs of related items)';
     if(key === 'icon') return '(controls which icon shows on the card)';
     if(key === 'file') return '(video filename, as uploaded to the site)';
     if(key === 'enabled') return '(turns the popup on/off on the live site)';
@@ -698,6 +707,8 @@
         sub.className = 'nested-group';
         renderObjectFields(value, sub);
         box.appendChild(sub);
+      } else if(key === 'related' && (state.section === 'conditions' || state.section === 'treatments') && ('id' in obj)){
+        box.appendChild(makeRelatedPicker(obj));
       } else {
         box.appendChild(makeSimpleInput(value, function(v){ obj[key] = v; markDirty(); }, key));
       }
@@ -705,6 +716,91 @@
     });
   }
 
+  /* ---- Related picker (conditions <-> treatments) ---- */
+  var otherCache = {};
+  function getOtherItems(sec){
+    if(!otherCache[sec]) otherCache[sec] = apiGet(sec).then(function(d){ return (d && d.items) || []; });
+    return otherCache[sec];
+  }
+  function relList(s){ return String(s || '').split(',').map(function(x){ return x.trim(); }).filter(Boolean); }
+  function slugify(s){
+    return String(s || '').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
+  }
+
+  function makeRelatedPicker(item){
+    var wrap = document.createElement('div');
+    wrap.innerHTML = '<p class="rel-note">Loading list…</p>';
+    var otherSec = state.section === 'conditions' ? 'treatments' : 'conditions';
+    getOtherItems(otherSec).then(function(others){
+      wrap.innerHTML = '';
+      var grid = document.createElement('div'); grid.className = 'rel-picker';
+      var chosen = relList(item.related);
+      var known = {};
+      var choosable = others.filter(function(o){ return o.id && (o.title_en || '').trim(); });
+      choosable.forEach(function(o){ known[o.id] = true; });
+
+      function commit(){ item.related = chosen.join(', '); markDirty(); }
+
+      choosable.forEach(function(o){
+        var lab = document.createElement('label');
+        var cb = document.createElement('input'); cb.type = 'checkbox';
+        var linkedFromOther = relList(o.related).indexOf(item.id) !== -1 && item.id;
+        cb.checked = chosen.indexOf(o.id) !== -1;
+        lab.className = 'rel-opt' + (cb.checked ? ' on' : '');
+        lab.appendChild(cb);
+        var dec = document.createElement('textarea'); dec.innerHTML = o.title_en.trim();  // titles may be stored as "&amp;"
+        lab.appendChild(document.createTextNode(dec.value));
+        if(linkedFromOther && !cb.checked){
+          lab.className = 'rel-opt auto';
+          lab.title = 'Already linked from the other side — shows on both pages automatically.';
+          cb.checked = true; cb.disabled = true;
+          lab.appendChild(document.createTextNode(' (linked from its page)'));
+        }
+        cb.addEventListener('change', function(){
+          var i = chosen.indexOf(o.id);
+          if(cb.checked && i === -1) chosen.push(o.id);
+          if(!cb.checked && i !== -1) chosen.splice(i, 1);
+          lab.className = 'rel-opt' + (cb.checked ? ' on' : '');
+          commit();
+        });
+        grid.appendChild(lab);
+      });
+
+      // IDs that point at something that no longer exists — show them so they can be cleared.
+      chosen.filter(function(id){ return !known[id]; }).forEach(function(id){
+        var lab = document.createElement('label'); lab.className = 'rel-opt missing';
+        var cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true;
+        lab.appendChild(cb);
+        lab.appendChild(document.createTextNode('Missing: ' + id + ' (untick to remove)'));
+        cb.addEventListener('change', function(){
+          if(!cb.checked){ chosen.splice(chosen.indexOf(id), 1); lab.style.display = 'none'; commit(); }
+        });
+        grid.appendChild(lab);
+      });
+
+      wrap.appendChild(grid);
+      var note = document.createElement('div'); note.className = 'rel-note';
+      note.textContent = choosable.length ? 'Only finished items with an ID and an English title appear here.' : 'Nothing to choose from yet.';
+      wrap.appendChild(note);
+    }).catch(function(){
+      wrap.innerHTML = '<p class="rel-note">Could not load the list. Refresh and try again.</p>';
+    });
+    return wrap;
+  }
+
+  // Fills a blank ID from the English title (unique), so a new item can be linked.
+  function fillMissingIds(items){
+    var used = {}, changed = 0;
+    items.forEach(function(it){ if(it.id) used[it.id] = true; });
+    items.forEach(function(it){
+      if(it.id || !(it.title_en || '').trim()) return;
+      var base = slugify(it.title_en) || 'item', id = base, n = 2;
+      while(used[id]){ id = base + '-' + n++; }
+      it.id = id; used[id] = true; changed++;
+    });
+    return changed;
+  }
+
   function renderListSection(container, data, sectionCfg){
     if(!Array.isArray(data.items)) data.items = [];
 
@@ -848,6 +944,7 @@
   function selectSection(key){
     state.section = key;
     state.dirty = false;
+    otherCache = {};
     renderNav();
     loadSection(key);
   }
@@ -931,10 +1028,16 @@
 
   document.getElementById('saveBtn').addEventListener('click', function(){
     var btn = document.getElementById('saveBtn');
+    var idsAdded = 0;
+    if((state.section === 'conditions' || state.section === 'treatments') && state.data && Array.isArray(state.data.items)){
+      idsAdded = fillMissingIds(state.data.items);
+    }
     btn.disabled = true; var original = btn.textContent; btn.textContent = 'Saving…';
     apiSave(state.section, state.data).then(function(){
       state.dirty = false;
-      showBanner('Saved — changes are live now.', 'ok');
+      delete otherCache.conditions; delete otherCache.treatments;
+      showBanner('Saved — changes are live now.' + (idsAdded ? ' (' + idsAdded + ' new item ID' + (idsAdded > 1 ? 's' : '') + ' created automatically.)' : ''), 'ok');
+      if(idsAdded){ loadSection(state.section); }
     }).catch(function(err){
       showBanner('Could not save: ' + err.message, 'err');
     }).finally(function(){
diff --git a/script.js b/script.js
index 698ad66..94a968e 100644
--- a/script.js
+++ b/script.js
@@ -88,11 +88,32 @@ function renderBottomNav(){
 }
 renderBottomNav();
 
+/* ---------------- PUBLISHED FILTER + TWO-WAY LINKS ----------------
+   An item only shows on the site once it has an ID, an English title and
+   some description text. Half-finished drafts saved in the CMS stay hidden
+   until they are filled in.
+
+   Links between conditions and treatments are two-way automatically: a
+   condition lists a treatment if EITHER side names the other in "related".
+   So the CMS only needs to be ticked on one side and both pages agree. */
+function isPublished(it){
+  return !!(it && it.id && (it.title_en||'').trim() && ((it.desc_en||'').trim() || (it.overview_en||'').trim()));
+}
+function relIds(it){
+  return (it.related||'').split(',').map(x=>x.trim()).filter(Boolean);
+}
+function relatedTreatmentsOf(c){
+  return TREATMENTS.filter(t => isPublished(t) && (relIds(c).includes(t.id) || relIds(t).includes(c.id)));
+}
+function relatedConditionsOf(t){
+  return CONDITIONS.filter(c => isPublished(c) && (relIds(t).includes(c.id) || relIds(c).includes(t.id)));
+}
+
 /* ---------------- CONDITIONS ---------------- */
 const conditionsGrid = document.getElementById('conditionsGrid');
 function renderConditions(){
   conditionsGrid.innerHTML = '';
-  CONDITIONS.forEach(c=>{
+  CONDITIONS.filter(isPublished).forEach(c=>{
     conditionsGrid.innerHTML += `
       <div class="info-card" tabindex="0" role="button" onclick="showConditionDetail('${c.id}')">
         <div class="info-ico" style="background:${c.color};color:#fff;">${svgIcon(c.icon,24)}</div>
@@ -108,7 +129,7 @@ renderConditions();
 const treatmentsGrid = document.getElementById('treatmentsGrid');
 function renderTreatments(){
   treatmentsGrid.innerHTML = '';
-  TREATMENTS.forEach(t=>{
+  TREATMENTS.filter(isPublished).forEach(t=>{
     treatmentsGrid.innerHTML += `
       <div class="info-card" tabindex="0" role="button" onclick="showTreatmentDetail('${t.id}')">
         <div class="info-ico" style="background:${t.color};color:#fff;">${svgIcon(t.icon,24)}</div>
@@ -143,9 +164,8 @@ function showConditionDetail(id){
   const c = conditionsById[id];
   if(!c) return;
   lastDetail = {type:'condition', id};
-  const relatedHtml = (c.related||'').split(',').map(x=>x.trim()).filter(Boolean).map(tid=>{
-    const t = treatmentsById[tid];
-    if(!t) return '';
+  const relTreatments = relatedTreatmentsOf(c);
+  const relatedHtml = relTreatments.map(t=>{
     return `<div class="related-card" tabindex="0" role="button" onclick="showTreatmentDetail('${t.id}')">
       <div class="related-ico" style="background:${t.color};">${svgIcon(t.icon,20)}</div>
       <div><h4>${tf(t,'title')}</h4><span>${L(UI.treatmentOption)}</span></div>
@@ -165,7 +185,7 @@ function showConditionDetail(id){
         <div class="detail-card"><h3>${L(UI.howDiagnosed)}</h3><p>${tf(c,'diagnosis')}</p></div>
       </div>
       <div>
-        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L((c.related||'').split(',').filter(Boolean).length>1?UI.relatedTreatments:UI.relatedTreatment)}</h3>
+        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L(relTreatments.length>1?UI.relatedTreatments:UI.relatedTreatment)}</h3>
         ${relatedHtml}
         <div class="cta-card" style="margin-top:16px;">
           <p>${L(UI.questionsAboutCondition)}</p>
@@ -180,9 +200,8 @@ function showTreatmentDetail(id){
   const t = treatmentsById[id];
   if(!t) return;
   lastDetail = {type:'treatment', id};
-  const relatedHtml = (t.related||'').split(',').map(x=>x.trim()).filter(Boolean).map(cid=>{
-    const c = conditionsById[cid];
-    if(!c) return '';
+  const relConditions = relatedConditionsOf(t);
+  const relatedHtml = relConditions.map(c=>{
     return `<div class="related-card" tabindex="0" role="button" onclick="showConditionDetail('${c.id}')">
       <div class="related-ico" style="background:${c.color};">${svgIcon(c.icon,20)}</div>
       <div><h4>${tf(c,'title')}</h4><span>${L(UI.conditionTreated)}</span></div>
@@ -202,7 +221,7 @@ function showTreatmentDetail(id){
         <div class="detail-card"><h3>${L(UI.recovery)}</h3><p>${tf(t,'recovery')||''}</p></div>
       </div>
       <div>
-        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L((t.related||'').split(',').filter(Boolean).length>1?UI.conditionsThisTreatsPlural:UI.conditionsThisTreats)}</h3>
+        <h3 style="color:var(--navy-900);font-size:15px;margin:0 0 10px;">${L(relConditions.length>1?UI.conditionsThisTreatsPlural:UI.conditionsThisTreats)}</h3>
         ${relatedHtml}
         <div class="cta-card" style="margin-top:16px;">
           <p>${L(UI.curiousAboutTreatment)}</p>
diff --git a/sw.js b/sw.js
index 397ed13..51afd5f 100644
--- a/sw.js
+++ b/sw.js
@@ -1,7 +1,7 @@
 // Minimal service worker — exists mainly so Chrome/Android recognizes this
 // page as an installable app (a real "Install app" prompt instead of a
 // plain bookmark). It caches only the small app-shell files, not the video.
-const CACHE_NAME = 'meditouch-shell-v46';
+const CACHE_NAME = 'meditouch-shell-v47';
 const SHELL_FILES = [
   './index.html',
   './style.css',
