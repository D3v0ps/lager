-- Wave 8: B2B portal additions — customer self-onboarding, volume
-- discounts, recurring orders, backorder support, customer favorites.
-- All forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. customer_applications — wholesalers apply to become customers
-- ---------------------------------------------------------------------------
-- Public form on /[tenant]/portal/apply/ writes here. Supplier reviews and
-- approves → creates a customers row + invitation in one shot.

create table if not exists public.customer_applications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  -- Applicant identity
  applicant_name text not null,
  applicant_email text not null,
  applicant_phone text,
  -- Company facts
  company_name text not null,
  org_number text,
  billing_address text,
  shipping_address text,
  -- Free-text + tag-style interests
  message text,
  requested_categories text[],
  -- Review trail
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  rejection_reason text,
  -- Once approved, points to the customer row we created
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists customer_applications_tenant_idx
  on public.customer_applications (tenant_id, status);
create index if not exists customer_applications_email_idx
  on public.customer_applications (lower(applicant_email));
create index if not exists customer_applications_pending_idx
  on public.customer_applications (tenant_id)
  where status = 'pending';

alter table public.customer_applications enable row level security;

-- Anon can submit applications via the submit_customer_application RPC.
-- No direct insert policy — RPC is the only path.

drop policy if exists "customer_applications_tenant_select" on public.customer_applications;
create policy "customer_applications_tenant_select" on public.customer_applications
  for select using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );

drop policy if exists "customer_applications_tenant_update" on public.customer_applications;
create policy "customer_applications_tenant_update" on public.customer_applications
  for update
  using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );

create or replace function public.submit_customer_application(
  target_slug text,
  applicant_name text,
  applicant_email text,
  applicant_phone text,
  company_name text,
  org_number text,
  billing_address text,
  shipping_address text,
  message text,
  requested_categories text[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tenant uuid;
  app_id uuid;
  norm_email text := lower(trim(applicant_email));
begin
  if norm_email = '' or position('@' in norm_email) = 0 then
    raise exception 'invalid email';
  end if;
  if coalesce(trim(company_name), '') = '' then
    raise exception 'company name required';
  end if;

  select id into target_tenant
  from public.tenants
  where slug = target_slug and b2b_portal_enabled = true;
  if target_tenant is null then
    raise exception 'tenant not found or portal not enabled';
  end if;

  -- One pending application per (tenant, email) — replace older.
  delete from public.customer_applications
  where tenant_id = target_tenant
    and lower(applicant_email) = norm_email
    and status = 'pending';

  insert into public.customer_applications (
    tenant_id, applicant_name, applicant_email, applicant_phone,
    company_name, org_number, billing_address, shipping_address,
    message, requested_categories
  ) values (
    target_tenant, applicant_name, norm_email, applicant_phone,
    company_name, org_number, billing_address, shipping_address,
    message, requested_categories
  ) returning id into app_id;
  return app_id;
end;
$$;

revoke all on function public.submit_customer_application(
  text, text, text, text, text, text, text, text, text, text[]
) from public;
grant execute on function public.submit_customer_application(
  text, text, text, text, text, text, text, text, text, text[]
) to anon, authenticated;

create or replace function public.approve_customer_application(
  app_id uuid,
  send_invite boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  app record;
  new_customer_id uuid;
begin
  select * into app from public.customer_applications where id = app_id;
  if not found then raise exception 'application not found'; end if;
  if app.status <> 'pending' then
    raise exception 'application already %', app.status;
  end if;
  if app.tenant_id not in (select public.current_owner_admin_tenant_ids())
     and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- Create the customer row
  insert into public.customers (
    tenant_id, name, email, phone, org_number,
    billing_address, shipping_address, notes
  ) values (
    app.tenant_id, app.company_name, app.applicant_email, app.applicant_phone,
    app.org_number, app.billing_address, app.shipping_address, app.message
  ) returning id into new_customer_id;

  -- Mark the application approved
  update public.customer_applications
  set status = 'approved',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      customer_id = new_customer_id
  where id = app_id;

  -- Optionally drop a pending portal invitation so they get a magic link
  if send_invite then
    delete from public.customer_invitations
    where customer_id = new_customer_id
      and lower(email) = lower(app.applicant_email)
      and accepted_at is null;
    insert into public.customer_invitations
      (customer_id, email, role, invited_by)
    values (new_customer_id, lower(app.applicant_email), 'admin', auth.uid());
  end if;

  return new_customer_id;
end;
$$;

revoke all on function public.approve_customer_application(uuid, boolean)
  from public;
grant execute on function public.approve_customer_application(uuid, boolean)
  to authenticated;

create or replace function public.reject_customer_application(
  app_id uuid,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  app record;
begin
  select * into app from public.customer_applications where id = app_id;
  if not found then raise exception 'application not found'; end if;
  if app.tenant_id not in (select public.current_owner_admin_tenant_ids())
     and not public.is_admin() then
    raise exception 'forbidden';
  end if;
  update public.customer_applications
  set status = 'rejected',
      reviewed_at = now(),
      reviewed_by = auth.uid(),
      rejection_reason = reason
  where id = app_id;
end;
$$;

revoke all on function public.reject_customer_application(uuid, text)
  from public;
grant execute on function public.reject_customer_application(uuid, text)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 2. volume_discounts — auto-tiered pricing per (customer, product)
-- ---------------------------------------------------------------------------
-- Stored as discount tiers; supplier can configure "buy 10+ get -5 %".
-- Either percentage discount OR an explicit unit price.

create table if not exists public.volume_discounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  -- Either tied to a single product OR all products in a category
  product_id uuid references public.products(id) on delete cascade,
  category text,
  -- Either tied to a specific customer OR applies to all portal customers
  customer_id uuid references public.customers(id) on delete cascade,
  min_quantity integer not null check (min_quantity > 0),
  -- Exactly one of these must be set
  discount_pct numeric(5, 2) check (discount_pct is null or (discount_pct >= 0 and discount_pct <= 100)),
  unit_price_cents bigint check (unit_price_cents is null or unit_price_cents >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (
    (product_id is not null) or (category is not null)
  ),
  check (
    (discount_pct is not null) or (unit_price_cents is not null)
  )
);

create index if not exists volume_discounts_tenant_idx
  on public.volume_discounts (tenant_id);
create index if not exists volume_discounts_product_idx
  on public.volume_discounts (product_id);
create index if not exists volume_discounts_customer_idx
  on public.volume_discounts (customer_id);

alter table public.volume_discounts enable row level security;

drop policy if exists "volume_discounts_tenant_all" on public.volume_discounts;
create policy "volume_discounts_tenant_all" on public.volume_discounts
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

drop policy if exists "volume_discounts_portal_select" on public.volume_discounts;
create policy "volume_discounts_portal_select" on public.volume_discounts
  for select using (
    tenant_id in (
      select c.tenant_id from public.customers c
      where c.id in (select public.current_customer_ids())
    )
    and (
      customer_id is null
      or customer_id in (select public.current_customer_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- 3. recurring_orders — customer-scheduled repeat orders
-- ---------------------------------------------------------------------------

create table if not exists public.recurring_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  name text not null, -- "Måndagsleverans till lager A"
  -- Cadence: daily / weekly / biweekly / monthly
  cadence text not null
    check (cadence in ('daily', 'weekly', 'biweekly', 'monthly')),
  -- For weekly/biweekly: 0=Sunday, 1=Monday … (ISO 8601)
  weekday integer check (weekday is null or (weekday between 0 and 6)),
  -- For monthly: day of month (1..28)
  day_of_month integer check (day_of_month is null or (day_of_month between 1 and 28)),
  next_run date not null,
  active boolean not null default true,
  shipping_address text,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists recurring_orders_customer_idx
  on public.recurring_orders (customer_id, active);

alter table public.recurring_orders enable row level security;

drop policy if exists "recurring_orders_tenant_select" on public.recurring_orders;
create policy "recurring_orders_tenant_select" on public.recurring_orders
  for select using (
    tenant_id in (select public.current_tenant_ids())
    or customer_id in (select public.current_customer_ids())
    or public.is_admin()
  );

drop policy if exists "recurring_orders_portal_write" on public.recurring_orders;
create policy "recurring_orders_portal_write" on public.recurring_orders
  for all
  using (
    customer_id in (select public.current_customer_ids())
    or tenant_id in (select public.current_tenant_ids())
    or public.is_admin()
  )
  with check (
    customer_id in (select public.current_customer_ids())
    or tenant_id in (select public.current_tenant_ids())
    or public.is_admin()
  );

create table if not exists public.recurring_order_items (
  id uuid primary key default gen_random_uuid(),
  recurring_order_id uuid not null
    references public.recurring_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents bigint, -- Optional pin; null means "live price at run-time"
  ord integer not null default 0
);

create index if not exists recurring_order_items_idx
  on public.recurring_order_items (recurring_order_id, ord);

alter table public.recurring_order_items enable row level security;

drop policy if exists "recurring_order_items_all" on public.recurring_order_items;
create policy "recurring_order_items_all" on public.recurring_order_items
  for all
  using (
    recurring_order_id in (
      select id from public.recurring_orders
      where customer_id in (select public.current_customer_ids())
         or tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    recurring_order_id in (
      select id from public.recurring_orders
      where customer_id in (select public.current_customer_ids())
         or tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 4. Backorder support on sales_order_items
-- ---------------------------------------------------------------------------

alter table public.sales_order_items
  add column if not exists is_backorder boolean not null default false;

-- ---------------------------------------------------------------------------
-- 5. portal_favorites — customer's favorite products (the "Favorites" tab)
-- ---------------------------------------------------------------------------

create table if not exists public.portal_favorites (
  customer_id uuid not null references public.customers(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, product_id)
);

alter table public.portal_favorites enable row level security;

drop policy if exists "portal_favorites_self_all" on public.portal_favorites;
create policy "portal_favorites_self_all" on public.portal_favorites
  for all
  using (customer_id in (select public.current_customer_ids()))
  with check (customer_id in (select public.current_customer_ids()));
