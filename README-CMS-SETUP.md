# CMS setup — one-time steps

This zip adds a browser-editable CMS at **/admin** on drchandranir.info.
Edits publish instantly — no git commit or site rebuild needed to see them live.

## 1. Merge these files into the repo

Copy everything in this zip into the repo (`abboo2010/drchandrannadarajan`),
overwriting the matching paths. Then **delete** these two files from the repo
root (see `DELETE_THESE_FILES.txt`):
- `0001-replace-google-sheets-cms-with-decap-cms.patch`
- `sheets-loader.js`

Commit and push to `main` — Netlify will redeploy automatically.

## 2. Create the Supabase project

1. Go to [supabase.com](https://supabase.com), create a new project (free tier is fine).
2. Open **SQL Editor → New query**, paste the contents of `supabase/schema.sql`, and run it.
   This creates the `content_sections` table and the public `site-images` storage bucket.
3. Go to **Project Settings → API** and copy:
   - **Project URL** → this is `SUPABASE_URL`
   - **service_role key** (not the anon key — keep this secret) → this is `SUPABASE_SERVICE_ROLE_KEY`

## 3. Set environment variables in Netlify

Netlify dashboard → your site → **Site configuration → Environment variables** → add:

| Key | Value |
|---|---|
| `ADMIN_PASSWORD` | whatever password you want to log into `/admin` with |
| `ADMIN_SECRET` | any long random string (used only to sign session tokens) |
| `SUPABASE_URL` | from step 2 |
| `SUPABASE_SERVICE_ROLE_KEY` | from step 2 |

Trigger a redeploy after setting these (or they'll apply on the next deploy).

## 4. Log in

Visit `https://drchandranir.info/admin` and log in with `ADMIN_PASSWORD`.
Nine sections are editable: Conditions, Treatments, Doctor Bio, Education,
Videos, Testimonials, Reviews, Site Text, and Photos & Logo. Every save
(and every photo upload) is live on the site immediately.

## Notes

- Until you complete steps 2–3, the site keeps working exactly as it does now —
  `/api/content` falls back to the bundled `content/*.json` files. The admin
  panel itself needs `ADMIN_PASSWORD`/`ADMIN_SECRET` to log in, and needs
  Supabase configured to actually save anything.
- Verified locally end-to-end (login, unauthorized-write rejection, instant
  publish, image upload, nested repeatable fields, site-text search) against
  a mocked backend — not yet re-verified against the real Netlify/Supabase
  runtime, since this session doesn't have push access to deploy it there.
