-- Run this once in the Supabase project's SQL Editor (Dashboard -> SQL
-- Editor -> New query -> paste -> Run) before the CMS goes live.

-- One row per content section (conditions, treatments, doctor-bio,
-- education, videos, testimonials, reviews, site-text, site-images).
-- The whole section is stored as one JSON blob, matching the shape the
-- site already expects (same shape as the bundled content/*.json files
-- and the admin panel's generic form renderer) — no per-item relational
-- tables needed, since nothing here needs row-level locking or foreign
-- keys, just editable content.
create table if not exists content_sections (
  section text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Lock the table down completely: RLS on, zero policies. That means
-- Supabase's anon/authenticated roles (what a browser could ever use)
-- can't read or write this table at all. The Netlify Functions are the
-- only thing that can touch it, using the service_role key (server-side
-- only, never sent to the browser), which bypasses RLS entirely.
alter table content_sections enable row level security;

-- Public storage bucket for admin-uploaded photos (doctor photo, logo,
-- splash backgrounds, and anything uploaded later). Public read so the
-- site can display them directly by URL; uploads still go only through
-- the authenticated image.js function using the service_role key.
insert into storage.buckets (id, name, public)
values ('site-images', 'site-images', true)
on conflict (id) do nothing;
