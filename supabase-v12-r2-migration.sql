-- ASIC-Skill v12: Google Drive FREE + private Cloudflare R2 PREMIUM
-- Run once in Supabase Dashboard -> SQL Editor.

alter table public.materials
  add column if not exists storage_provider text not null default 'drive';

update public.materials
set storage_provider = case when storage_path is not null and drive_url is null then 'r2' else 'drive' end
where storage_provider is null or storage_provider not in ('drive','r2');

do $$ begin
  alter table public.materials add constraint materials_storage_provider_check check (storage_provider in ('drive','r2'));
exception when duplicate_object then null; end $$;

notify pgrst, 'reload schema';
