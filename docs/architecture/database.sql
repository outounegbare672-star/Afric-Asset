-- AFRIC-ASSET AI — schéma Supabase/PostgreSQL de référence
create extension if not exists pgcrypto;
create extension if not exists citext;

create type public.app_role as enum ('admin','manager','storekeeper','driver','viewer');
create type public.asset_kind as enum ('material','consumable','tool','equipment','machine');
create type public.location_kind as enum ('site','store','warehouse');
create type public.stock_movement_type as enum ('receipt','issue','transfer_in','transfer_out','adjustment','production_consumption','return');
create type public.purchase_status as enum ('draft','submitted','approved','partially_received','received','cancelled');

create or replace function public.set_updated_at() returns trigger
language plpgsql security invoker as $$
begin new.updated_at = now(); return new; end $$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug citext not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete restrict,
  full_name text not null,
  email citext not null,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  city text,
  country text not null default 'Togo',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  site_id uuid references public.sites(id) on delete restrict,
  name text not null,
  code text not null,
  kind public.location_kind not null,
  created_at timestamptz not null default now(),
  unique (organization_id, code)
);

create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email citext,
  phone text,
  tax_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sku text not null,
  name text not null,
  description text,
  kind public.asset_kind not null,
  category text,
  unit text not null,
  minimum_quantity numeric(18,3) not null default 0 check (minimum_quantity >= 0),
  unit_cost numeric(18,2) not null default 0 check (unit_cost >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, sku)
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  location_id uuid not null references public.locations(id) on delete restrict,
  destination_location_id uuid references public.locations(id) on delete restrict,
  type public.stock_movement_type not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_cost numeric(18,2) check (unit_cost >= 0),
  reference text,
  notes text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete restrict,
  destination_location_id uuid not null references public.locations(id) on delete restrict,
  number text not null,
  status public.purchase_status not null default 'draft',
  ordered_at date,
  expected_at date,
  total_amount numeric(18,2) not null default 0 check (total_amount >= 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (organization_id, number)
);

create table public.purchase_lines (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases(id) on delete cascade,
  asset_id uuid not null references public.assets(id) on delete restrict,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_cost numeric(18,2) not null check (unit_cost >= 0),
  received_quantity numeric(18,3) not null default 0 check (received_quantity >= 0 and received_quantity <= quantity)
);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index stock_movements_org_asset_idx on public.stock_movements(organization_id, asset_id, created_at desc);
create index audit_logs_org_created_idx on public.audit_logs(organization_id, created_at desc);
create index profiles_org_role_idx on public.profiles(organization_id, role);

create or replace function public.current_organization_id() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from public.profiles where id = auth.uid() and is_active = true
$$;

create or replace function public.has_role(required_roles public.app_role[]) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true and role = any(required_roles)
  )
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.sites enable row level security;
alter table public.locations enable row level security;
alter table public.suppliers enable row level security;
alter table public.assets enable row level security;
alter table public.stock_movements enable row level security;
alter table public.purchases enable row level security;
alter table public.purchase_lines enable row level security;
alter table public.audit_logs enable row level security;

create policy organization_member_read on public.organizations for select using (id = public.current_organization_id());
create policy same_org_read on public.profiles for select using (organization_id = public.current_organization_id());
create policy same_org_write on public.profiles for update using (organization_id = public.current_organization_id() and public.has_role(array['admin']::public.app_role[]));

do $$
declare t text; begin
  foreach t in array array['sites','locations','suppliers','assets','stock_movements','purchases','audit_logs'] loop
    execute format('create policy %I_same_org_select on public.%I for select using (organization_id = public.current_organization_id())', t, t);
  end loop;
end $$;

create policy assets_manager_write on public.assets for all
using (organization_id = public.current_organization_id() and public.has_role(array['admin','manager','storekeeper']::public.app_role[]))
with check (organization_id = public.current_organization_id());

create policy stock_storekeeper_insert on public.stock_movements for insert
with check (organization_id = public.current_organization_id() and public.has_role(array['admin','manager','storekeeper']::public.app_role[]));

create policy purchase_manager_write on public.purchases for all
using (organization_id = public.current_organization_id() and public.has_role(array['admin','manager']::public.app_role[]))
with check (organization_id = public.current_organization_id());

create policy purchase_lines_manager_write on public.purchase_lines for all
using (exists (select 1 from public.purchases p where p.id = purchase_id and p.organization_id = public.current_organization_id() and public.has_role(array['admin','manager']::public.app_role[])))
with check (exists (select 1 from public.purchases p where p.id = purchase_id and p.organization_id = public.current_organization_id()));

-- Les suppressions métier sont interdites. Utiliser des statuts/inactivations et des mouvements correctifs.
