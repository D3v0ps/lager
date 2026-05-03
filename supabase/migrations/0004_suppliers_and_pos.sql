-- Suppliers + Purchase Orders
-- Adds supplier records, purchase orders (PO) with line items, and a trigger
-- that auto-creates stock_movements when a PO is marked received. All rows
-- are tenant-scoped via current_tenant_ids() exactly like products.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Suppliers
-- ---------------------------------------------------------------------------

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists suppliers_tenant_idx on public.suppliers (tenant_id);
create index if not exists suppliers_name_idx on public.suppliers (lower(name));

drop trigger if exists suppliers_touch_updated_at on public.suppliers;
create trigger suppliers_touch_updated_at
before update on public.suppliers
for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Purchase orders
-- ---------------------------------------------------------------------------

create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete restrict,
  status text not null
    check (status in ('draft','sent','received','cancelled'))
    default 'draft',
  reference text, -- PO number, e.g. "PO-2026-001"
  notes text,
  created_at timestamptz not null default now(),
  received_at timestamptz
);

create index if not exists purchase_orders_tenant_idx
  on public.purchase_orders (tenant_id);
create index if not exists purchase_orders_supplier_idx
  on public.purchase_orders (supplier_id);
create index if not exists purchase_orders_status_idx
  on public.purchase_orders (status);
create index if not exists purchase_orders_tenant_created_idx
  on public.purchase_orders (tenant_id, created_at desc);

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid not null
    references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0
);

create index if not exists purchase_order_items_po_idx
  on public.purchase_order_items (purchase_order_id);
create index if not exists purchase_order_items_product_idx
  on public.purchase_order_items (product_id);

-- ---------------------------------------------------------------------------
-- RLS: scope every row to the current user's tenants
-- ---------------------------------------------------------------------------

alter table public.suppliers enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;

drop policy if exists "suppliers_tenant_select" on public.suppliers;
create policy "suppliers_tenant_select" on public.suppliers
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "suppliers_tenant_write" on public.suppliers;
create policy "suppliers_tenant_write" on public.suppliers
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "purchase_orders_tenant_select" on public.purchase_orders;
create policy "purchase_orders_tenant_select" on public.purchase_orders
  for select using (tenant_id in (select public.current_tenant_ids()));

drop policy if exists "purchase_orders_tenant_write" on public.purchase_orders;
create policy "purchase_orders_tenant_write" on public.purchase_orders
  for all
  using (tenant_id in (select public.current_tenant_ids()))
  with check (tenant_id in (select public.current_tenant_ids()));

-- Items inherit tenant scoping by joining their parent PO.
drop policy if exists "purchase_order_items_tenant_select" on public.purchase_order_items;
create policy "purchase_order_items_tenant_select" on public.purchase_order_items
  for select using (
    purchase_order_id in (
      select id from public.purchase_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  );

drop policy if exists "purchase_order_items_tenant_write" on public.purchase_order_items;
create policy "purchase_order_items_tenant_write" on public.purchase_order_items
  for all
  using (
    purchase_order_id in (
      select id from public.purchase_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  )
  with check (
    purchase_order_id in (
      select id from public.purchase_orders
      where tenant_id in (select public.current_tenant_ids())
    )
  );

-- ---------------------------------------------------------------------------
-- Receive trigger: when status flips to 'received', insert stock_movements
-- of type 'in' for each line item. Idempotent: only fires when transitioning
-- from a non-received status to 'received', and stamps received_at so a
-- subsequent NOP update won't double-receive.
-- ---------------------------------------------------------------------------

create or replace function public.receive_purchase_order()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  item record;
  prod_tenant uuid;
begin
  -- Only react to a real transition into 'received'.
  if new.status <> 'received' then
    return new;
  end if;
  if old.status = 'received' then
    -- Already received once; ignore further updates.
    return new;
  end if;

  -- Stamp the receive time once.
  if new.received_at is null then
    new.received_at := now();
  end if;

  for item in
    select product_id, quantity
    from public.purchase_order_items
    where purchase_order_id = new.id
  loop
    -- Defensive: each product must belong to the same tenant as the PO.
    select tenant_id into prod_tenant
    from public.products where id = item.product_id;
    if prod_tenant is null then
      raise exception 'product % not found', item.product_id;
    end if;
    if prod_tenant <> new.tenant_id then
      raise exception 'product % tenant (%) does not match PO tenant (%)',
        item.product_id, prod_tenant, new.tenant_id;
    end if;

    insert into public.stock_movements (tenant_id, product_id, type, quantity, note)
    values (
      new.tenant_id,
      item.product_id,
      'in',
      item.quantity,
      coalesce('Inköpsorder ' || new.reference, 'Inköpsorder')
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists purchase_orders_receive on public.purchase_orders;
create trigger purchase_orders_receive
before update of status on public.purchase_orders
for each row
when (new.status = 'received' and old.status is distinct from 'received')
execute function public.receive_purchase_order();
