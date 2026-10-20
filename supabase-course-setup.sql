-- ASIC-Skill Course Material setup
-- Run this once in Supabase Dashboard -> SQL Editor.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.admin_users where user_id=auth.uid());
$$;
grant execute on function public.is_admin() to anon, authenticated;

create table if not exists public.courses (
 id uuid primary key default gen_random_uuid(), title text not null, slug text not null unique, description text, sort_order int not null default 0, is_active boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.materials (
 id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade, module_name text not null, title text not null, description text, material_type text not null default 'pdf', access_level text not null default 'free' check(access_level in ('free','premium')), storage_path text unique, drive_url text, file_name text, sort_order int not null default 0, is_published boolean not null default true, created_at timestamptz not null default now()
);
create table if not exists public.entitlements (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, course_id uuid not null references public.courses(id) on delete cascade, active boolean not null default true, created_at timestamptz not null default now(), unique(user_id,course_id)
);

alter table public.admin_users enable row level security; alter table public.courses enable row level security; alter table public.materials enable row level security; alter table public.entitlements enable row level security;

drop policy if exists "courses readable" on public.courses; create policy "courses readable" on public.courses for select using (is_active or public.is_admin());
drop policy if exists "admin manages courses" on public.courses; create policy "admin manages courses" on public.courses for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "materials readable" on public.materials; create policy "materials readable" on public.materials for select using (is_published or public.is_admin());
drop policy if exists "admin manages materials" on public.materials; create policy "admin manages materials" on public.materials for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "users see entitlements" on public.entitlements; create policy "users see entitlements" on public.entitlements for select using (user_id=auth.uid() or public.is_admin());
drop policy if exists "admin manages entitlements" on public.entitlements; create policy "admin manages entitlements" on public.entitlements for all using (public.is_admin()) with check (public.is_admin());

insert into public.courses(title,slug,description,sort_order) values
('ASIC Physical Design — Complete Flow','physical-design','From design inputs and floorplan through placement, CTS, routing and chip finishing.',1),
('Static Timing Analysis','static-timing-analysis','Timing paths, setup/hold, slack, libraries, parasitics, OCV, SI and report analysis.',2),
('SDC & Timing Constraints','sdc-timing-constraints','Clocks, I/O delays, clock groups, exceptions and constraint validation.',3),
('MMMC Timing Signoff','mmmc-timing-signoff','Modes, PVT corners, analysis views, parasitic corners and multi-scenario closure.',4),
('DRC, LVS & Physical Verification','physical-verification','Physical verification checks, debug methodology and tapeout evidence.',5),
('UPF & Low-Power Design','upf-low-power','Power domains, isolation, level shifters, retention and power intent.',6),
('Verilog & SystemVerilog','verilog-systemverilog','RTL coding foundations, synthesizable design, testbenches and verification concepts.',7),
('DFT, Scan & ATPG','dft-scan-atpg','Test architecture, scan chains, fault models, ATPG concepts and test coverage.',8)
on conflict(slug) do nothing;

insert into storage.buckets(id,name,public) values('course-materials','course-materials',false) on conflict(id) do update set public=false;

create or replace function public.can_access_material(object_name text) returns boolean language sql stable security definer set search_path=public as $$
 select exists(
  select 1 from public.materials m where m.storage_path=object_name and (m.access_level='free' or public.is_admin() or exists(select 1 from public.entitlements e where e.user_id=auth.uid() and e.course_id=m.course_id and e.active))
 );
$$;
grant execute on function public.can_access_material(text) to anon, authenticated;

drop policy if exists "course material read" on storage.objects; create policy "course material read" on storage.objects for select using (bucket_id='course-materials' and public.can_access_material(name));
drop policy if exists "admin course upload" on storage.objects; create policy "admin course upload" on storage.objects for insert to authenticated with check (bucket_id='course-materials' and public.is_admin());
drop policy if exists "admin course update" on storage.objects; create policy "admin course update" on storage.objects for update to authenticated using (bucket_id='course-materials' and public.is_admin()) with check (bucket_id='course-materials' and public.is_admin());
drop policy if exists "admin course delete" on storage.objects; create policy "admin course delete" on storage.objects for delete to authenticated using (bucket_id='course-materials' and public.is_admin());

-- IMPORTANT: Make your account an admin.
-- Supabase -> Authentication -> Users -> copy YOUR user UUID, then run:
-- insert into public.admin_users(user_id) values ('PASTE-YOUR-USER-UUID-HERE') on conflict do nothing;
