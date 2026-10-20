-- ASIC-Skill v31: secure quiz-attempt storage
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  material_id uuid not null references public.materials(id) on delete cascade,
  score numeric not null,
  max_score numeric not null check (max_score > 0),
  percentage numeric generated always as (round((score * 100.0 / max_score)::numeric, 2)) stored,
  source text not null default 'google_forms',
  submitted_at timestamptz not null default now()
);
create index if not exists quiz_attempts_user_material_idx on public.quiz_attempts(user_id, material_id, submitted_at desc);
alter table public.quiz_attempts enable row level security;
drop policy if exists "Students read own quiz attempts" on public.quiz_attempts;
create policy "Students read own quiz attempts" on public.quiz_attempts for select to authenticated using (auth.uid() = user_id);
-- Browser clients cannot insert/update/delete attempts.
revoke insert, update, delete on public.quiz_attempts from anon, authenticated;
grant select on public.quiz_attempts to authenticated;

-- Called only by the server-side Worker using the service-role key.
create or replace function public.record_quiz_attempt_by_email(
  p_email text, p_quiz_title text, p_score numeric, p_max_score numeric
) returns uuid
language plpgsql security definer set search_path = public, auth
as $$
declare v_user uuid; v_material uuid; v_id uuid;
begin
  select id into v_user from auth.users where lower(email)=lower(trim(p_email)) limit 1;
  if v_user is null then raise exception 'ASIC-Skill user not found for email'; end if;
  select id into v_material from public.materials
    where material_type='poll' and is_published=true and title=p_quiz_title
    order by created_at desc nulls last limit 1;
  if v_material is null then raise exception 'Quiz material not found for title'; end if;
  insert into public.quiz_attempts(user_id,material_id,score,max_score)
  values(v_user,v_material,p_score,p_max_score) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.record_quiz_attempt_by_email(text,text,numeric,numeric) from public, anon, authenticated;
