-- ASIC-Skill v13: Admin Grant / Revoke Premium Access
-- Run once in Supabase Dashboard -> SQL Editor.
-- This does NOT expose auth.users to the browser. Only an ASIC-Skill admin can execute these functions.

create or replace function public.admin_grant_premium_access(student_email text, target_course_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
  entitlement_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(student_email))
  limit 1;

  if target_user_id is null then
    raise exception 'No ASIC-Skill user found with that email';
  end if;

  if not exists (select 1 from public.courses where id = target_course_id) then
    raise exception 'Course not found';
  end if;

  insert into public.entitlements(user_id, course_id, active)
  values(target_user_id, target_course_id, true)
  on conflict(user_id, course_id)
  do update set active = true
  returning id into entitlement_id;

  return entitlement_id;
end;
$$;

create or replace function public.admin_revoke_premium_access(student_email text, target_course_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = lower(trim(student_email))
  limit 1;

  if target_user_id is null then return false; end if;

  update public.entitlements
  set active = false
  where user_id = target_user_id and course_id = target_course_id;

  return found;
end;
$$;

create or replace function public.admin_list_premium_access()
returns table(entitlement_id uuid, student_email text, course_id uuid, course_title text, active boolean, granted_at timestamptz)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access required';
  end if;

  return query
  select e.id, u.email::text, e.course_id, c.title, e.active, e.created_at
  from public.entitlements e
  join auth.users u on u.id = e.user_id
  join public.courses c on c.id = e.course_id
  order by e.created_at desc;
end;
$$;

revoke all on function public.admin_grant_premium_access(text,uuid) from public;
revoke all on function public.admin_revoke_premium_access(text,uuid) from public;
revoke all on function public.admin_list_premium_access() from public;
grant execute on function public.admin_grant_premium_access(text,uuid) to authenticated;
grant execute on function public.admin_revoke_premium_access(text,uuid) to authenticated;
grant execute on function public.admin_list_premium_access() to authenticated;

notify pgrst, 'reload schema';
