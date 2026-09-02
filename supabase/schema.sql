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

-- CMS login accounts (replaces the old single shared ADMIN_PASSWORD).
-- password_hash is "<salt-hex>:<hash-hex>" from Node's scrypt — never a
-- plain password. `sections` is which CMS sections this login may view
-- and edit (e.g. ["conditions","treatments"]) — 'users' in that list means
-- this login can also manage other logins from the "Manage Users" panel.
-- See netlify/functions/_sections.js for the canonical list of valid
-- values. Same lockdown as content_sections: RLS on, zero policies, so
-- only the Netlify Functions (service_role key) can touch it. The very
-- first account is created automatically (with every section granted)
-- the first time anyone logs in with the old shared password while this
-- table is empty — no manual insert needed here.
create table if not exists admin_users (
  username text primary key,
  password_hash text not null,
  sections jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table admin_users enable row level security;
