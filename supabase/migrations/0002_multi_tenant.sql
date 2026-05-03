-- Multi-tenant foundation
-- Adds tenants + tenant_users (junction with role), tenant_id FK on
-- products and stock_movements, and RLS that scopes everything to
-- the tenants the current auth user belongs to.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tenants + user mapping
-- ---------------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.tenant_users (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'owner', 'member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index if not exists tenant_users_user_idx on public.tenant_users (user_id);

-- Helper: tenant ids the current auth.uid() belongs to.
create or replace function public.current_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_users where user_id = auth.uid();
$$;

-- Helper: is the current user a global admin (member of any tenant with role admin)?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.tenant_users
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Add tenant_id to existing tables
-- ---------------------------------------------------------------------------

-- 1) Create a default 'demo' tenant so existing rows can be backfilled.
insert into public.tenants (slug, name)
values ('demo', 'Demo')
on conflict (slug) do nothing;

-- 2) Add nullable tenant_id, backfill, then make NOT NULL.
alter table public.products
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

update public.products
  set tenant_id = (select id from public.tenants where slug = 'demo')
  where tenant_id is null;

alter table public.products
  alter column tenant_id set not null;

create index if not exists products_tenant_idx on public.products (tenant_id);

-- products.sku was unique globally; make it unique per tenant instead.
alter table public.products drop constraint if exists products_sku_key;
create unique index if not exists products_tenant_sku_idx
  on public.products (tenant_id, sku);

alter table public.stock_movements
  add column if not exists tenant_id uuid references public.tenants(id) on delete cascade;

update public.stock_movements m
  set tenant_id = (select tenant_id from public.products where id = m.product_id)
  where tenant_id is null;

alter table public.stock_movements
  alter column tenant_id set not null;

create index if not exists stock_movements_tenant_idx on public.stock_movements (tenant_id);

-- ---------------------------------------------------------------------------
-- RLS — scope every row to the current user's tenants
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.tenant_users enable row level security;

drop policy if exists "products_all_access" on public.products;
drop policy if exists "stock_movements_all_access" on public.stock_movements;

-- tenants: a user can read tenants they belong to. Admins can read all.
drop policy if exists "tenants_select" on public.tenants;
create policy "tenants_select" on public.tenants
  for select using (
    id in (select public.current_tenant_ids()) or public.is_admin()
  );

-- Admins can insert/update/delete tenants. Used by the admin UI.
drop policy if exists "tenants_admin_write" on public.tenants;
create policy "tenants_admin_write" on public.tenants
  for all using (public.is_admin()) with check (public.is_admin());

-- tenant_users: users can see their own memberships; admins can see/edit all.
drop policy if exists "tenant_users_select" on public.tenant_users;
create policy "tenant_users_select" on public.tenant_users
  for select using (user_id = auth.uid() or public.is_admin());

drop policy if exists "tenant_users_admin_write" on public.tenant_users;
create policy "tenant_users_admin_write" on public.tenant_users
  for all using (public.is_admin()) with check (public.is_admin());

-- products: read/write only within the user's tenants.
drop policy if exists "products_tenant_select" on public.products;
create policy "products_tenant_select" on public.products
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "products_tenant_write" on public.products;
create policy "products_tenant_write" on public.products
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- stock_movements: same scoping.
drop policy if exists "stock_movements_tenant_select" on public.stock_movements;
create policy "stock_movements_tenant_select" on public.stock_movements
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "stock_movements_tenant_write" on public.stock_movements;
create policy "stock_movements_tenant_write" on public.stock_movements
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- ---------------------------------------------------------------------------
-- Make stock_movements trigger tenant-safe
-- ---------------------------------------------------------------------------
-- The existing trigger updates products.quantity. Make sure it doesn't
-- accidentally cross tenant boundaries (defensive — the FK already enforces
-- this, but a check here surfaces logic bugs early).

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  prod_tenant uuid;
begin
  select tenant_id into prod_tenant from public.products where id = new.product_id;
  if prod_tenant is null then
    raise exception 'product % not found', new.product_id;
  end if;
  if new.tenant_id is null then
    new.tenant_id := prod_tenant;
  elsif new.tenant_id <> prod_tenant then
    raise exception 'movement.tenant_id (%) does not match product.tenant_id (%)',
      new.tenant_id, prod_tenant;
  end if;

  if new.type = 'in' then
    update public.products
      set quantity = quantity + abs(new.quantity)
      where id = new.product_id;
  elsif new.type = 'out' then
    update public.products
      set quantity = quantity - abs(new.quantity)
      where id = new.product_id;
  elsif new.type = 'adjust' then
    update public.products
      set quantity = abs(new.quantity)
      where id = new.product_id;
  end if;
  return new;
end;
$$;

-- Recreate trigger as BEFORE insert so we can mutate new.tenant_id.
drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply
before insert on public.stock_movements
for each row execute function public.apply_stock_movement();
