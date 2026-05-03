-- Lager: products + stock_movements
create extension if not exists "pgcrypto";

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text,
  unit_price numeric(12, 2) not null default 0 check (unit_price >= 0),
  quantity integer not null default 0 check (quantity >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_name_idx on public.products (lower(name));
create index if not exists products_category_idx on public.products (category);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  type text not null check (type in ('in', 'out', 'adjust')),
  quantity integer not null check (quantity <> 0 or type = 'adjust'),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);

-- Auto-update products.updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_touch_updated_at on public.products;
create trigger products_touch_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

-- Apply stock movement to product quantity
create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
as $$
declare
  delta integer;
begin
  if new.type = 'in' then
    delta := abs(new.quantity);
    update public.products set quantity = quantity + delta where id = new.product_id;
  elsif new.type = 'out' then
    delta := abs(new.quantity);
    update public.products
      set quantity = quantity - delta
      where id = new.product_id;
  elsif new.type = 'adjust' then
    -- 'adjust' sets quantity to the absolute value
    update public.products
      set quantity = abs(new.quantity)
      where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists stock_movements_apply on public.stock_movements;
create trigger stock_movements_apply
after insert on public.stock_movements
for each row execute function public.apply_stock_movement();

-- Open RLS for prototype use (lock down before production!)
alter table public.products enable row level security;
alter table public.stock_movements enable row level security;

drop policy if exists "products_all_access" on public.products;
create policy "products_all_access"
  on public.products for all
  using (true) with check (true);

drop policy if exists "stock_movements_all_access" on public.stock_movements;
create policy "stock_movements_all_access"
  on public.stock_movements for all
  using (true) with check (true);
