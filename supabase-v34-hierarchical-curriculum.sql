-- ASIC-Skill v34.0: Course -> Module -> Sub-module -> Topic -> Material
-- Safe to run once; ADD COLUMN IF NOT EXISTS makes reruns harmless.

alter table public.materials
  add column if not exists sub_module_name text,
  add column if not exists topic_name text;

-- Give existing content a usable hierarchy without deleting or moving anything.
update public.materials
set sub_module_name = coalesce(nullif(trim(sub_module_name), ''), 'General'),
    topic_name = coalesce(nullif(trim(topic_name), ''), title)
where sub_module_name is null or trim(sub_module_name) = ''
   or topic_name is null or trim(topic_name) = '';

-- Optional defaults for future direct inserts.
alter table public.materials alter column sub_module_name set default 'General';

notify pgrst, 'reload schema';

select course_id, module_name, sub_module_name, topic_name, title, material_type
from public.materials
order by course_id, sort_order, created_at;
