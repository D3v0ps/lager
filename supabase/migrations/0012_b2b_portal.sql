-- Wave 6: B2B customer portal foundation.
--
-- Tenant (the supplier) optionally enables a customer-facing portal where
-- their own customers' contacts log in and place orders. The portal reads
-- the tenant's product catalog (with optional negotiated per-customer
-- pricing) and writes back into the tenant's sales_orders table using the
-- same draft-status flow the supplier already runs.
--
-- Key concepts:
--   * `customers` already exists (per tenant) — represents a B2B account.
--   * `customer_users` is new — links auth.users to a customer account, in
--     the same shape `tenant_users` links auth.users to tenants.
--   * `customer_price_lists` carries negotiated unit_price per
--     (customer, product). Empty list ⇒ portal shows the standard price.
--   * Tenant flips `tenants.b2b_portal_enabled` to switch the portal on.
--
-- Forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. Tenant-level toggle for the portal
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists b2b_portal_enabled boolean not null default false,
  add column if not exists portal_welcome_text text;

-- ---------------------------------------------------------------------------
-- 2. customer_users — auth.users <-> customers junction
-- ---------------------------------------------------------------------------

create table if not exists public.customer_users (
  customer_id uuid not null references public.customers(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  -- 'admin' = can invite other contacts at the same customer.
  -- 'orderer' = can browse + place orders.
  role text not null default 'orderer' check (role in ('admin', 'orderer')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (customer_id, user_id)
);

create index if not exists customer_users_user_idx
  on public.customer_users (user_id);

alter table public.customer_users enable row level security;

create or replace function public.current_customer_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select customer_id from public.customer_users where user_id = auth.uid();
$$;

revoke all on function public.current_customer_ids() from public;
grant execute on function public.current_customer_ids() to authenticated;

drop policy if exists "customer_users_self_select" on public.customer_users;
create policy "customer_users_self_select" on public.customer_users
  for select using (user_id = auth.uid());

drop policy if exists "customer_users_tenant_select" on public.customer_users;
create policy "customer_users_tenant_select" on public.customer_users
  for select using (
    customer_id in (
      select c.id from public.customers c
      where c.tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
  );

drop policy if exists "customer_users_tenant_write" on public.customer_users;
create policy "customer_users_tenant_write" on public.customer_users
  for all
  using (
    customer_id in (
      select c.id from public.customers c
      where c.tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    customer_id in (
      select c.id from public.customers c
      where c.tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 3. customer_invitations
-- ---------------------------------------------------------------------------

create table if not exists public.customer_invitations (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'orderer')) default 'orderer',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists customer_invitations_email_idx
  on public.customer_invitations (lower(email));
create index if not exists customer_invitations_customer_pending_idx
  on public.customer_invitations (customer_id)
  where accepted_at is null;

alter table public.customer_invitations enable row level security;

drop policy if exists "customer_invitations_select" on public.customer_invitations;
create policy "customer_invitations_select" on public.customer_invitations
  for select using (
    customer_id in (
      select c.id from public.customers c
      where c.tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
    or lower(email) = lower(public.current_user_email())
  );

drop policy if exists "customer_invitations_delete" on public.customer_invitations;
create policy "customer_invitations_delete" on public.customer_invitations
  for delete using (
    customer_id in (
      select c.id from public.customers c
      where c.tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 4. customer_price_lists — negotiated pricing
-- ---------------------------------------------------------------------------

create table if not exists public.customer_price_lists (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  valid_from timestamptz,
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id, valid_from)
);

create index if not exists customer_price_lists_customer_idx
  on public.customer_price_lists (customer_id);
create index if not exists customer_price_lists_product_idx
  on public.customer_price_lists (product_id);

alter table public.customer_price_lists enable row level security;

drop policy if exists "customer_price_lists_tenant_write" on public.customer_price_lists;
create policy "customer_price_lists_tenant_write" on public.customer_price_lists
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

drop policy if exists "customer_price_lists_portal_select" on public.customer_price_lists;
create policy "customer_price_lists_portal_select" on public.customer_price_lists
  for select using (customer_id in (select public.current_customer_ids()));

-- ---------------------------------------------------------------------------
-- 5. Open up products + tenants + customers to portal users
-- ---------------------------------------------------------------------------

drop policy if exists "products_portal_select" on public.products;
create policy "products_portal_select" on public.products
  for select using (
    tenant_id in (
      select c.tenant_id from public.customers c
      where c.id in (select public.current_customer_ids())
    )
  );

drop policy if exists "tenants_portal_select" on public.tenants;
create policy "tenants_portal_select" on public.tenants
  for select using (
    id in (
      select c.tenant_id from public.customers c
      where c.id in (select public.current_customer_ids())
    )
  );

drop policy if exists "customers_portal_self_select" on public.customers;
create policy "customers_portal_self_select" on public.customers
  for select using (id in (select public.current_customer_ids()));

-- ---------------------------------------------------------------------------
-- 6. Allow portal users to insert sales_orders for their customer
-- ---------------------------------------------------------------------------

drop policy if exists "sales_orders_portal_insert" on public.sales_orders;
create policy "sales_orders_portal_insert" on public.sales_orders
  for insert
  with check (
    customer_id in (select public.current_customer_ids())
    and tenant_id in (
      select c.tenant_id from public.customers c
      where c.id in (select public.current_customer_ids())
    )
  );

drop policy if exists "sales_orders_portal_select" on public.sales_orders;
create policy "sales_orders_portal_select" on public.sales_orders
  for select using (
    customer_id in (select public.current_customer_ids())
    or tenant_id in (select public.current_tenant_ids())
    or public.is_admin()
  );

drop policy if exists "sales_order_items_portal_insert" on public.sales_order_items;
create policy "sales_order_items_portal_insert" on public.sales_order_items
  for insert
  with check (
    sales_order_id in (
      select id from public.sales_orders
      where customer_id in (select public.current_customer_ids())
    )
  );

drop policy if exists "sales_order_items_portal_select" on public.sales_order_items;
create policy "sales_order_items_portal_select" on public.sales_order_items
  for select using (
    sales_order_id in (
      select id from public.sales_orders
      where customer_id in (select public.current_customer_ids())
    )
    or sales_order_id in (
      select id from public.sales_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- 7. RPCs
-- ---------------------------------------------------------------------------

create or replace function public.invite_customer_contact(
  target_customer uuid,
  invitee_email text,
  invitee_role text default 'orderer'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  norm_email text := lower(trim(invitee_email));
  inv_id uuid;
begin
  if norm_email = '' or position('@' in norm_email) = 0 then
    raise exception 'invalid email';
  end if;
  if invitee_role not in ('admin', 'orderer') then
    raise exception 'invalid role';
  end if;
  if not exists (
    select 1 from public.customers c
    where c.id = target_customer
      and c.tenant_id in (select public.current_owner_admin_tenant_ids())
  ) and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  delete from public.customer_invitations
  where customer_id = target_customer
    and lower(email) = norm_email
    and accepted_at is null;

  insert into public.customer_invitations
    (customer_id, email, role, invited_by)
  values (target_customer, norm_email, invitee_role, auth.uid())
  returning id into inv_id;
  return inv_id;
end;
$$;

revoke all on function public.invite_customer_contact(uuid, text, text)
  from public;
grant execute on function public.invite_customer_contact(uuid, text, text)
  to authenticated;

create or replace function public.accept_pending_customer_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  applied integer := 0;
begin
  select lower(email::text) into user_email
    from auth.users where id = auth.uid();
  if user_email is null then return 0; end if;

  with accepted as (
    update public.customer_invitations
    set accepted_at = now()
    where lower(email) = user_email and accepted_at is null
    returning customer_id, role
  ),
  inserted as (
    insert into public.customer_users (customer_id, user_id, role)
    select customer_id, auth.uid(), role from accepted
    on conflict (customer_id, user_id) do nothing
    returning 1
  )
  select count(*) into applied from inserted;
  return applied;
end;
$$;

revoke all on function public.accept_pending_customer_invitations() from public;
grant execute on function public.accept_pending_customer_invitations()
  to authenticated;

create or replace function public.list_customer_contacts(
  target_customer uuid
)
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.customers c
    where c.id = target_customer
      and c.tenant_id in (select public.current_owner_admin_tenant_ids())
  ) and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select cu.user_id, u.email::text, cu.role, cu.created_at
    from public.customer_users cu
    join auth.users u on u.id = cu.user_id
    where cu.customer_id = target_customer
    order by cu.created_at asc;
end;
$$;

revoke all on function public.list_customer_contacts(uuid) from public;
grant execute on function public.list_customer_contacts(uuid) to authenticated;
