-- Wave 5: hardening pass following the 20-agent audit.
--
-- Bundled because each piece is small and they ship as one deploy:
--   1. Split platform-admin out of tenant-local 'admin' role. Today
--      `is_admin()` returns true for any tenant_users.role='admin' user,
--      so a tenant A admin gets cross-tenant superpowers via the
--      `tenants_admin_write` / `tenant_users_admin_write` policies.
--   2. Drop the redundant `tenant_users_select` policy that overlaps with
--      `tenant_users_member_select` from 0006.
--   3. Composite indexes on (tenant_id, created_at desc) for the two
--      hottest list queries (stock_movements, sales_orders), plus a
--      partial index on tenant_invitations for the pending-only filter.
--   4. Widen money columns from numeric(12,2) to numeric(14,2) to match
--      the spec in CLAUDE.md.
--
-- Forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. Platform-admin split
-- ---------------------------------------------------------------------------

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Self-read so a user can detect their own platform-admin status. All
-- writes go via service_role / SQL — there's intentionally no INSERT/UPDATE
-- policy for the authenticated role.
drop policy if exists "platform_admins_self_read" on public.platform_admins;
create policy "platform_admins_self_read" on public.platform_admins
  for select using (user_id = auth.uid());

-- Migrate existing tenant-admin users into platform_admins so the deploy
-- doesn't lock anyone out. Going forward, the tenant_users.role='admin'
-- value remains a per-tenant role (treated equivalently to 'owner' inside
-- a tenant) and platform admin is a separate, explicit grant.
insert into public.platform_admins (user_id)
select distinct user_id from public.tenant_users where role = 'admin'
on conflict (user_id) do nothing;

-- Replace is_admin() to read the new table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_admins where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Drop the redundant tenant_users_select policy from 0002
-- ---------------------------------------------------------------------------
-- 0006 added `tenant_users_member_select` (any member of a tenant can see
-- co-members). The narrower 0002 policy (`user_id = auth.uid() OR is_admin`)
-- is now strictly subsumed; PostgreSQL OR-combines policies anyway, so the
-- broader one wins and the 0002 one just adds noise.

drop policy if exists "tenant_users_select" on public.tenant_users;

-- ---------------------------------------------------------------------------
-- 3. Indexes
-- ---------------------------------------------------------------------------

create index if not exists stock_movements_tenant_created_idx
  on public.stock_movements (tenant_id, created_at desc);

create index if not exists sales_orders_tenant_created_idx
  on public.sales_orders (tenant_id, created_at desc);

-- Partial index: pending invitations are the only ones the team page lists,
-- and the WHERE clause already filters `accepted_at IS NULL`.
create index if not exists tenant_invitations_pending_idx
  on public.tenant_invitations (tenant_id)
  where accepted_at is null;

-- ---------------------------------------------------------------------------
-- 4. Widen numeric(12,2) -> numeric(14,2) on money columns
-- ---------------------------------------------------------------------------
-- numeric is variable-width, so widening precision is a metadata-only
-- change in Postgres (no row rewrite, no table lock beyond the catalog
-- update).

alter table public.products
  alter column unit_price type numeric(14, 2);
alter table public.products
  alter column cost_price type numeric(14, 2);
alter table public.purchase_order_items
  alter column unit_cost type numeric(14, 2);
alter table public.sales_order_items
  alter column unit_price type numeric(14, 2);
