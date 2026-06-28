-- =====================================================================
-- Adds a dedicated "specification" field to stock items — for technical
-- specs (material, tolerance, compatibility, etc.) separate from the
-- general description field. Run once in Supabase SQL Editor.
-- =====================================================================

alter table stock add column if not exists specification text;
