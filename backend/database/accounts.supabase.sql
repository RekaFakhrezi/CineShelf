-- Run in the Supabase SQL Editor for the backend project. Safe to run again.
create table if not exists public.user_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null check (jsonb_typeof(data) = 'object')
);

alter table public.user_libraries enable row level security;
revoke all on public.user_libraries from anon;
grant usage on schema public to authenticated, service_role;
grant select, insert, update, delete on public.user_libraries to authenticated, service_role;

drop policy if exists "user_libraries_owner_select" on public.user_libraries;
create policy "user_libraries_owner_select" on public.user_libraries
  for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "user_libraries_owner_insert" on public.user_libraries;
create policy "user_libraries_owner_insert" on public.user_libraries
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "user_libraries_owner_update" on public.user_libraries;
create policy "user_libraries_owner_update" on public.user_libraries
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
drop policy if exists "user_libraries_owner_delete" on public.user_libraries;
create policy "user_libraries_owner_delete" on public.user_libraries
  for delete to authenticated using ((select auth.uid()) = user_id);
