# New website deploy (drchandranir.info)

1. Copy everything in this zip into the repo root (abboo2010/drchandrannadarajan), overwriting:
   index.html (now the public website), sw.js, netlify.toml
   New files: kiosk.html (the old kiosk index.html), kiosk-manifest.json, site.css, site.js, splash.css, images/site/*
2. Commit + push to main. Netlify redeploys.
3. Kiosk PC: set "url" in kiosk-config.json to https://drchandranir.info/kiosk (no rebuild needed).
   Until then the kiosk PC would show the new website instead of the touch app.
