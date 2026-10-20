-- ASIC-Skill v9: Google Drive material links
-- Run ONCE in Supabase Dashboard -> SQL Editor if you are upgrading from v6/v7/v8.

alter table public.materials
  add column if not exists drive_url text;

-- v8 required a Supabase Storage path. v9 stores Google Drive links instead,
-- so new rows must be allowed to leave storage_path empty.
alter table public.materials
  alter column storage_path drop not null;

-- Existing Supabase-hosted lessons are not changed by this migration.
-- New Google Drive lessons will have drive_url populated and storage_path = null.
