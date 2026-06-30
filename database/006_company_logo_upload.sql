-- =====================================================================
-- Adds an uploadable logo per company. Run once in Supabase SQL Editor.
-- =====================================================================

alter table companies add column if not exists logo_url text;

-- Public storage bucket for company logos. "Public" here only means the
-- uploaded image files themselves are viewable by URL (needed so the PDF
-- generator and the browser can both load them) — it does NOT expose any
-- database data. Uploads still only ever happen through the backend.
insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;
