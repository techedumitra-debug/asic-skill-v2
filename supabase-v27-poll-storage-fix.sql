-- ASIC-Skill v27: Poll storage-provider repair
-- Safe for existing drive/R2 materials.

alter table public.materials
  drop constraint if exists materials_storage_provider_check;

alter table public.materials
  add constraint materials_storage_provider_check
  check (storage_provider in ('drive','r2','none'));

-- Recreate only the poll creation function so new polls store 'none'.
create or replace function public.admin_create_poll(
  target_course_id uuid,
  target_module_name text,
  target_title text,
  target_description text,
  target_access_level text,
  poll_question text,
  poll_options jsonb,
  correct_option_index integer,
  poll_explanation text default null,
  poll_points integer default 1
) returns uuid
language plpgsql security definer set search_path=public
as $$
declare new_material_id uuid; option_count integer;
begin
  if auth.uid() is null or not exists(select 1 from public.admin_users where user_id=auth.uid()) then raise exception 'Admin access required'; end if;
  if target_access_level not in ('free','premium') then raise exception 'Invalid access level'; end if;
  if coalesce(trim(target_module_name),'')='' or coalesce(trim(target_title),'')='' or coalesce(trim(poll_question),'')='' then raise exception 'Module, title and question are required'; end if;
  if jsonb_typeof(poll_options) <> 'array' then raise exception 'Poll options must be an array'; end if;
  option_count := jsonb_array_length(poll_options);
  if option_count < 2 then raise exception 'At least 2 poll options are required'; end if;
  if correct_option_index < 0 or correct_option_index >= option_count then raise exception 'Choose a valid correct answer'; end if;

  insert into public.materials(course_id,module_name,title,description,material_type,access_level,drive_url,storage_provider,file_name,storage_path,is_published)
  values(target_course_id,trim(target_module_name),trim(target_title),nullif(trim(target_description),''),'poll',target_access_level,null,'none',null,null,true)
  returning id into new_material_id;

  insert into public.polls(material_id,question,options,correct_option_index,explanation,points)
  values(new_material_id,trim(poll_question),poll_options,correct_option_index,nullif(trim(poll_explanation),''),greatest(1,poll_points));

  return new_material_id;
end; $$;

revoke all on function public.admin_create_poll(uuid,text,text,text,text,text,jsonb,integer,text,integer) from public;
grant execute on function public.admin_create_poll(uuid,text,text,text,text,text,jsonb,integer,text,integer) to authenticated;

notify pgrst, 'reload schema';
