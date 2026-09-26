# IR@SABAH website: multi-page deploy guide

## Pages
| URL | File |
|---|---|
| / | index.html (Home, with splash + slider) |
| /about | about.html |
| /conditions | conditions.html |
| /treatments | treatments.html |
| /videos | videos.html |
| /contact | contact.html |
| /kiosk | kiosk.html (the existing kiosk app, unchanged) |

## Deploy (GitHub -> Netlify)
1. Open the repo abboo2010/drchandrannadarajan on GitHub -> Add file -> Upload files.
2. Unzip irsabah-website.zip and drag ALL the files and folders in (keep the folders `src/` and `images/`). Overwrite when asked.
3. Commit changes. Netlify redeploys automatically (no build step).
4. Check: drchandranir.info, /about, /conditions, /treatments, /videos, /contact, /kiosk.
5. Kiosk PC: edit kiosk-config.json so `url` is https://drchandranir.info/kiosk

## Editing
- Content (conditions, treatments, videos, bio) still comes from /admin.
- Layout/text of pages: edit `build_site.py` and `src/partials/*.html`, run `python3 build_site.py`, then upload the regenerated .html files. (Or edit the .html files directly.)

## Private preview password (Netlify Edge Function: netlify/edge-functions/gate.js)
Website pages need a login while the doctor reviews. /kiosk, /admin and /api are NOT locked.
Netlify -> Site configuration -> Environment variables:
- SITE_PASSWORD = the password (required; without it the site stays locked)
- SITE_USER = username (optional, default `preview`)
- SITE_GATE = `off` to open the site to everyone (then Deploys -> Trigger deploy)
Changing the password signs everyone out.
