-- ASIC-Skill v26: Interactive Poll / Quiz Builder
-- Run once in Supabase Dashboard -> SQL Editor.
-- Correct answers are NOT exposed by the student poll-loading RPC.
-- v27 fix: polls use storage_provider='none' (existing site uses 'drive' and 'r2').

alter table public.materials
  drop constraint if exists materials_storage_provider_check;

alter table public.materials
  add constraint materials_storage_provider_check
  check (storage_provider in ('drive','r2','none'));


create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null unique references public.materials(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_option_index integer not null,
  explanation text,
  points integer not null default 1 check (points > 0),
  created_at timestamptz not null default now(),
  constraint poll_options_array check (jsonb_typeof(options) = 'array'),
  constraint poll_correct_nonnegative check (correct_option_index >= 0)
);

create table if not exists public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  selected_option_index integer not null,
  is_correct boolean not null,
  awarded_points integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.polls enable row level security;
alter table public.poll_responses enable row level security;

-- No direct browser reads are needed. Access goes through the RPCs below.
revoke all on public.polls from anon, authenticated;
revoke all on public.poll_responses from anon, authenticated;

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
language plpgsql security definer set search_path = public
as $$
declare
  new_material_id uuid;
  option_count integer;
begin
  if not public.is_admin() then raise exception 'Administrator access required'; end if;
  if target_access_level not in ('free','premium') then raise exception 'Invalid access level'; end if;
  if coalesce(trim(target_module_name),'')='' or coalesce(trim(target_title),'')='' or coalesce(trim(poll_question),'')='' then raise exception 'Module, title and question are required'; end if;
  if jsonb_typeof(poll_options) <> 'array' then raise exception 'Poll options must be an array'; end if;
  option_count := jsonb_array_length(poll_options);
  if option_count < 2 then raise exception 'At least 2 poll options are required'; end if;
  if correct_option_index < 0 or correct_option_index >= option_count then raise exception 'Correct answer is outside the option range'; end if;

  insert into public.materials(course_id,module_name,title,description,material_type,access_level,drive_url,storage_provider,file_name,storage_path,is_published)
  values(target_course_id,trim(target_module_name),trim(target_title),nullif(trim(target_description),''),'poll',target_access_level,null,'none',null,null,true)
  returning id into new_material_id;

  insert into public.polls(material_id,question,options,correct_option_index,explanation,points)
  values(new_material_id,trim(poll_question),poll_options,correct_option_index,nullif(trim(poll_explanation),''),greatest(1,poll_points));
  return new_material_id;
end;
$$;

create or replace function public.get_poll_for_student(target_material_id uuid)
returns table(question text, options jsonb, points integer)
language plpgsql security definer set search_path = public
as $$
declare m public.materials%rowtype;
begin
  select * into m from public.materials where id=target_material_id and is_published=true and material_type='poll';
  if not found then raise exception 'Poll not found'; end if;
  if m.access_level='premium' and not public.is_admin() and not exists(
    select 1 from public.entitlements e where e.user_id=auth.uid() and e.course_id=m.course_id and e.active=true
  ) then raise exception 'Premium access required'; end if;
  return query select p.question,p.options,p.points from public.polls p where p.material_id=target_material_id;
end;
$$;

create or replace function public.submit_poll_answer(target_material_id uuid, selected_option_index integer)
returns table(is_correct boolean, explanation text, awarded_points integer, max_points integer)
language plpgsql security definer set search_path = public
as $$
declare m public.materials%rowtype; p public.polls%rowtype; ok boolean; award integer;
begin
  select * into m from public.materials where id=target_material_id and is_published=true and material_type='poll';
  if not found then raise exception 'Poll not found'; end if;
  if m.access_level='premium' and not public.is_admin() and not exists(
    select 1 from public.entitlements e where e.user_id=auth.uid() and e.course_id=m.course_id and e.active=true
  ) then raise exception 'Premium access required'; end if;
  select * into p from public.polls where material_id=target_material_id;
  if selected_option_index < 0 or selected_option_index >= jsonb_array_length(p.options) then raise exception 'Invalid answer'; end if;
  ok := selected_option_index=p.correct_option_index; award := case when ok then p.points else 0 end;
  insert into public.poll_responses(poll_id,user_id,selected_option_index,is_correct,awarded_points) values(p.id,auth.uid(),selected_option_index,ok,award);
  return query select ok,p.explanation,award,p.points;
end;
$$;

revoke all on function public.admin_create_poll(uuid,text,text,text,text,text,jsonb,integer,text,integer) from public;
grant execute on function public.admin_create_poll(uuid,text,text,text,text,text,jsonb,integer,text,integer) to authenticated;
grant execute on function public.get_poll_for_student(uuid) to anon, authenticated;
grant execute on function public.submit_poll_answer(uuid,integer) to anon, authenticated;
notify pgrst, 'reload schema';
