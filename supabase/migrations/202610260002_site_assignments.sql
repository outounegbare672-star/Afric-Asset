create table if not exists public.site_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role_title text not null default 'Collaborateur',
  starts_at date not null default current_date,
  ends_at date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_assignments_dates_check check (ends_at is null or ends_at >= starts_at),
  constraint site_assignments_unique_assignment unique (site_id, profile_id, starts_at)
);

create index if not exists site_assignments_site_active_idx on public.site_assignments(site_id, is_active);
create index if not exists site_assignments_profile_active_idx on public.site_assignments(profile_id, is_active);

alter table public.site_assignments enable row level security;

drop policy if exists site_assignments_select_same_org on public.site_assignments;
create policy site_assignments_select_same_org on public.site_assignments for select
  using (organization_id = public.current_org_id());

drop policy if exists site_assignments_insert_manager on public.site_assignments;
create policy site_assignments_insert_manager on public.site_assignments for insert
  with check (organization_id = public.current_org_id() and public.has_role(array['admin','manager']::public.app_role[]));

drop policy if exists site_assignments_update_manager on public.site_assignments;
create policy site_assignments_update_manager on public.site_assignments for update
  using (organization_id = public.current_org_id() and public.has_role(array['admin','manager']::public.app_role[]))
  with check (organization_id = public.current_org_id() and public.has_role(array['admin','manager']::public.app_role[]));

drop policy if exists site_assignments_delete_manager on public.site_assignments;
create policy site_assignments_delete_manager on public.site_assignments for delete
  using (organization_id = public.current_org_id() and public.has_role(array['admin','manager']::public.app_role[]));
