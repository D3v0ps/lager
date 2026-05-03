-- Customers + sales orders + sales order items
-- Mirrors the multi-tenant scoping established in 0002 and uses the
-- existing touch_updated_at() / apply_stock_movement() helpers.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  org_number text,
  billing_address text,
  shipping_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_tenant_idx on public.customers (tenant_id);
create index if not exists customers_name_idx on public.customers (lower(name));

create table if not exists public.sales_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete restrict,
  reference text,
  status text not null check (status in ('draft','confirmed','picking','shipped','cancelled')) default 'draft',
  shipping_address text,
  notes text,
  created_at timestamptz not null default now(),
  shipped_at timestamptz
);

create index if not exists sales_orders_tenant_idx on public.sales_orders (tenant_id);
create index if not exists sales_orders_customer_idx on public.sales_orders (customer_id);
create index if not exists sales_orders_status_idx on public.sales_orders (tenant_id, status);

create table if not exists public.sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid not null references public.sales_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null default 0
);

create index if not exists sales_order_items_order_idx
  on public.sales_order_items (sales_order_id);
create index if not exists sales_order_items_product_idx
  on public.sales_order_items (product_id);

-- ---------------------------------------------------------------------------
-- updated_at trigger on customers
-- ---------------------------------------------------------------------------

drop trigger if exists customers_touch_updated_at on public.customers;
create trigger customers_touch_updated_at
before update on public.customers
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.customers enable row level security;
alter table public.sales_orders enable row level security;
alter table public.sales_order_items enable row level security;

-- customers: scope to current tenants (mirrors products' policies).
drop policy if exists "customers_tenant_select" on public.customers;
create policy "customers_tenant_select" on public.customers
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "customers_tenant_write" on public.customers;
create policy "customers_tenant_write" on public.customers
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- sales_orders: same pattern.
drop policy if exists "sales_orders_tenant_select" on public.sales_orders;
create policy "sales_orders_tenant_select" on public.sales_orders
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "sales_orders_tenant_write" on public.sales_orders;
create policy "sales_orders_tenant_write" on public.sales_orders
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- sales_order_items: scope via parent order's tenant_id.
drop policy if exists "sales_order_items_tenant_select" on public.sales_order_items;
create policy "sales_order_items_tenant_select" on public.sales_order_items
  for select using (
    sales_order_id in (
      select id from public.sales_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  );

drop policy if exists "sales_order_items_tenant_write" on public.sales_order_items;
create policy "sales_order_items_tenant_write" on public.sales_order_items
  for all
  using (
    sales_order_id in (
      select id from public.sales_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  )
  with check (
    sales_order_id in (
      select id from public.sales_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- Ship trigger: when sales_orders.status transitions to 'shipped',
-- insert one stock_movements row of type 'out' per line item. The
-- existing apply_stock_movement() trigger then decrements products.quantity.
--
-- Idempotent: only fires when the previous status was != 'shipped' AND
-- shipped_at was previously null. We also stamp shipped_at = now() if
-- the caller didn't set it. A second update setting status='shipped'
-- on an already-shipped order is a no-op.
-- ---------------------------------------------------------------------------

create or replace function public.sales_orders_apply_shipment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
begin
  if new.status = 'shipped' and (old.status is distinct from 'shipped') then
    if new.shipped_at is null then
      new.shipped_at := now();
    end if;

    -- Guard against double-ship: if shipped_at was already set we bail out.
    if old.shipped_at is not null then
      return new;
    end if;

    for item in
      select product_id, quantity
      from public.sales_order_items
      where sales_order_id = new.id
    loop
      insert into public.stock_movements (tenant_id, product_id, type, quantity, note)
      values (
        new.tenant_id,
        item.product_id,
        'out',
        item.quantity,
        coalesce('Order ' || nullif(new.reference, ''), 'Sales order ' || new.id::text)
      );
    end loop;
  end if;

  return new;
end;
$$;

drop trigger if exists sales_orders_ship on public.sales_orders;
create trigger sales_orders_ship
before update of status on public.sales_orders
for each row execute function public.sales_orders_apply_shipment();
