-- Wave 7: Saldo Bygg — construction project management module.
--
-- Built to outpace Bygglet on the specific complaints we found:
--   * Bygglet bills 1 445 kr per extra user → we go flat per-tenant
--   * Bygglet's quote module is buggy → we build a clean live quote
--     builder with native ROT/RUT split + magic-link customer accept
--   * Bygglet locks into yearly contracts → we go month-to-month
--   * Bygglet mobile is weak → we build PWA + GPS clock-in
--
-- All 10 tables go in a single migration to keep the module self-contained.
-- Forward-only and idempotent; reuses the multi-tenant helpers from 0002 +
-- the security-definer pattern from 0009.

-- ---------------------------------------------------------------------------
-- 1. Tenant-level toggle for the Bygg module
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists bygg_enabled boolean not null default false;

-- ---------------------------------------------------------------------------
-- 2. Employees — Bygg-specific staff register, separate from tenant_users
-- ---------------------------------------------------------------------------
-- tenant_users covers app login; employees covers people who clock in but
-- may not have logins (carpenters who don't touch the system, contracted
-- crew, etc.). One employee may or may not have a linked auth.users row.

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  full_name text not null,
  email text,
  phone text,
  hourly_rate numeric(10, 2),
  -- Trade / skill / role on the project (snickare, elektriker, etc.)
  trade text,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists employees_tenant_idx on public.employees (tenant_id);
create index if not exists employees_user_idx on public.employees (user_id);
create index if not exists employees_name_idx on public.employees (lower(full_name));

drop trigger if exists employees_touch_updated_at on public.employees;
create trigger employees_touch_updated_at
before update on public.employees
for each row execute function public.touch_updated_at();

alter table public.employees enable row level security;

drop policy if exists "employees_tenant_select" on public.employees;
create policy "employees_tenant_select" on public.employees
  for select using (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

drop policy if exists "employees_tenant_write" on public.employees;
create policy "employees_tenant_write" on public.employees
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Projects
-- ---------------------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  reference text, -- e.g. "P-2026-014"
  name text not null,
  description text,
  address text,
  -- Loose status — keep flexible early; we'll formalize via DB enum later.
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'paused', 'done', 'invoiced', 'cancelled')),
  -- Optional ROT/RUT classification — affects default ROT-split on quotes.
  deduction_type text check (deduction_type in (NULL, 'rot', 'rut')) default NULL,
  start_date date,
  end_date date,
  budget_cents bigint, -- Pengar i ören; numeric not necessary at project level
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_tenant_idx on public.projects (tenant_id);
create index if not exists projects_customer_idx on public.projects (customer_id);
create index if not exists projects_status_idx on public.projects (tenant_id, status);
create index if not exists projects_tenant_created_idx
  on public.projects (tenant_id, created_at desc);

drop trigger if exists projects_touch_updated_at on public.projects;
create trigger projects_touch_updated_at
before update on public.projects
for each row execute function public.touch_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_tenant_select" on public.projects;
create policy "projects_tenant_select" on public.projects
  for select using (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

drop policy if exists "projects_tenant_write" on public.projects;
create policy "projects_tenant_write" on public.projects
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Project phases (etapper)
-- ---------------------------------------------------------------------------

create table if not exists public.project_phases (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  ord integer not null default 0,
  start_date date,
  end_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists project_phases_project_idx
  on public.project_phases (project_id, ord);

alter table public.project_phases enable row level security;

drop policy if exists "project_phases_tenant_all" on public.project_phases;
create policy "project_phases_tenant_all" on public.project_phases
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 5. Project team — which employees are on which project
-- ---------------------------------------------------------------------------

create table if not exists public.project_team (
  project_id uuid not null references public.projects(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  role text, -- "arbetsledare", "snickare", "lärling"…
  created_at timestamptz not null default now(),
  primary key (project_id, employee_id)
);

alter table public.project_team enable row level security;

drop policy if exists "project_team_tenant_all" on public.project_team;
create policy "project_team_tenant_all" on public.project_team
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 6. Time entries — clock-in / time tracking
-- ---------------------------------------------------------------------------

create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  entry_date date not null default current_date,
  -- Either pair (started_at, ended_at) or duration_minutes — we store both
  -- so PWA clock-in writes started_at first, then ended_at on clock-out
  -- and a trigger fills duration_minutes.
  started_at timestamptz,
  ended_at timestamptz,
  duration_minutes integer,
  -- Klassificering — "arbete" (default), "rast", "restid", "övertid", "frånvaro"
  category text not null default 'arbete'
    check (category in ('arbete', 'rast', 'restid', 'övertid', 'sjuk', 'semester')),
  note text,
  -- Optional GPS for PWA clock-in (decimal-degrees * 1e7 to keep int math)
  geo_lat_e7 integer,
  geo_lng_e7 integer,
  approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists time_entries_tenant_idx on public.time_entries (tenant_id);
create index if not exists time_entries_project_idx on public.time_entries (project_id);
create index if not exists time_entries_employee_idx on public.time_entries (employee_id);
create index if not exists time_entries_date_idx on public.time_entries (tenant_id, entry_date desc);

create or replace function public.time_entries_compute_duration()
returns trigger
language plpgsql
as $$
begin
  if new.started_at is not null and new.ended_at is not null
     and new.ended_at > new.started_at
     and (new.duration_minutes is null or new.duration_minutes = 0) then
    new.duration_minutes := greatest(0, ceil(extract(epoch from (new.ended_at - new.started_at)) / 60))::integer;
  end if;
  return new;
end;
$$;

drop trigger if exists time_entries_compute_duration on public.time_entries;
create trigger time_entries_compute_duration
before insert or update on public.time_entries
for each row execute function public.time_entries_compute_duration();

alter table public.time_entries enable row level security;

drop policy if exists "time_entries_tenant_all" on public.time_entries;
create policy "time_entries_tenant_all" on public.time_entries
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 7. Quotes (anbud)
-- ---------------------------------------------------------------------------

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  reference text, -- "Q-2026-001"
  title text not null,
  description text,
  -- Status flow: draft -> sent -> accepted | declined | expired
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  deduction_type text check (deduction_type in (NULL, 'rot', 'rut')) default NULL,
  -- Snapshot of money totals at send-time (so editing later doesn't change
  -- what the customer accepted).
  subtotal_cents bigint not null default 0,        -- before VAT
  vat_cents bigint not null default 0,
  total_cents bigint not null default 0,            -- inkl moms
  -- Customer's deductible portion (ROT/RUT) of the total
  deduction_cents bigint not null default 0,
  -- What the customer pays out of pocket after deduction
  customer_pays_cents bigint not null default 0,
  -- Public-accept flow: random token, customer hits /q/?token=<...>
  accept_token uuid not null default gen_random_uuid(),
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_by_email text,
  declined_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists quotes_accept_token_idx
  on public.quotes (accept_token);
create index if not exists quotes_tenant_idx on public.quotes (tenant_id);
create index if not exists quotes_customer_idx on public.quotes (customer_id);
create index if not exists quotes_project_idx on public.quotes (project_id);
create index if not exists quotes_status_idx on public.quotes (tenant_id, status);
create index if not exists quotes_tenant_created_idx
  on public.quotes (tenant_id, created_at desc);

drop trigger if exists quotes_touch_updated_at on public.quotes;
create trigger quotes_touch_updated_at
before update on public.quotes
for each row execute function public.touch_updated_at();

alter table public.quotes enable row level security;

drop policy if exists "quotes_tenant_all" on public.quotes;
create policy "quotes_tenant_all" on public.quotes
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. Quote items
-- ---------------------------------------------------------------------------

create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes(id) on delete cascade,
  -- Item kind: 'work' (timmar), 'material', 'fixed' (klumpsumma)
  kind text not null default 'work'
    check (kind in ('work', 'material', 'fixed')),
  description text not null,
  quantity numeric(14, 3) not null default 1 check (quantity > 0),
  unit text, -- "tim", "st", "m", "m²"…
  unit_price_cents bigint not null default 0 check (unit_price_cents >= 0),
  vat_rate numeric(5, 2) not null default 25.00, -- 25 % default
  -- Whether this item line is eligible for ROT/RUT (work usually is,
  -- material isn't). Drives the per-quote deduction_cents calculation.
  deductible boolean not null default false,
  ord integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists quote_items_quote_idx
  on public.quote_items (quote_id, ord);

alter table public.quote_items enable row level security;

drop policy if exists "quote_items_tenant_all" on public.quote_items;
create policy "quote_items_tenant_all" on public.quote_items
  for all
  using (
    quote_id in (
      select id from public.quotes
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    quote_id in (
      select id from public.quotes
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 9. Change orders (ÄTA — Ändrings- och Tilläggsarbeten)
-- ---------------------------------------------------------------------------

create table if not exists public.change_orders (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  reference text, -- "ÄTA-014-01"
  title text not null,
  description text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'invoiced')),
  hours_estimated numeric(10, 2),
  material_cents bigint not null default 0,
  hourly_rate_cents bigint not null default 0,
  total_cents bigint not null default 0,
  approved_by_email text,
  approved_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists change_orders_project_idx
  on public.change_orders (project_id);
create index if not exists change_orders_status_idx
  on public.change_orders (project_id, status);

drop trigger if exists change_orders_touch_updated_at on public.change_orders;
create trigger change_orders_touch_updated_at
before update on public.change_orders
for each row execute function public.touch_updated_at();

alter table public.change_orders enable row level security;

drop policy if exists "change_orders_tenant_all" on public.change_orders;
create policy "change_orders_tenant_all" on public.change_orders
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 10. Project documents — file metadata only; the actual files live in
--      Supabase Storage (bucket "project-files")
-- ---------------------------------------------------------------------------

create table if not exists public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  -- Storage key (bucket-relative path)
  storage_key text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  -- Soft category — "anbud", "ritning", "intyg", "leverantörsfaktura"…
  category text,
  created_at timestamptz not null default now()
);

create index if not exists project_documents_project_idx
  on public.project_documents (project_id, created_at desc);

alter table public.project_documents enable row level security;

drop policy if exists "project_documents_tenant_all" on public.project_documents;
create policy "project_documents_tenant_all" on public.project_documents
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 11. Project photos — separate from documents because they're displayed
--      differently and carry GPS / EXIF metadata.
-- ---------------------------------------------------------------------------

create table if not exists public.project_photos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  storage_key text not null,
  caption text,
  taken_at timestamptz,
  geo_lat_e7 integer,
  geo_lng_e7 integer,
  width integer,
  height integer,
  created_at timestamptz not null default now()
);

create index if not exists project_photos_project_idx
  on public.project_photos (project_id, created_at desc);

alter table public.project_photos enable row level security;

drop policy if exists "project_photos_tenant_all" on public.project_photos;
create policy "project_photos_tenant_all" on public.project_photos
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 12. Project materials — link products from the inventory module to a
--      project. Bridges Saldo Operations + Saldo Bygg.
-- ---------------------------------------------------------------------------

create table if not exists public.project_materials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  -- For materials NOT in the product catalog: free-text fallback
  custom_name text,
  quantity numeric(14, 3) not null default 1 check (quantity > 0),
  unit text,
  unit_price_cents bigint not null default 0,
  used_at timestamptz,
  -- If we already booked the stock movement, we record that link so
  -- canceling the project material can reverse it.
  stock_movement_id uuid references public.stock_movements(id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists project_materials_project_idx
  on public.project_materials (project_id);
create index if not exists project_materials_product_idx
  on public.project_materials (product_id);

alter table public.project_materials enable row level security;

drop policy if exists "project_materials_tenant_all" on public.project_materials;
create policy "project_materials_tenant_all" on public.project_materials
  for all
  using (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  )
  with check (
    project_id in (
      select id from public.projects
      where tenant_id in (select public.current_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 13. RPC: accept_quote — public, token-protected accept endpoint
-- ---------------------------------------------------------------------------
-- Customer hits /q/?token=<accept_token>. This RPC is the only mutation
-- they can do; it's reachable from the anon role.

create or replace function public.accept_quote(
  token uuid,
  signer_email text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  q_id uuid;
  q_status text;
  q_valid_until date;
begin
  if signer_email is null or position('@' in signer_email) = 0 then
    raise exception 'invalid email';
  end if;

  select id, status, valid_until into q_id, q_status, q_valid_until
  from public.quotes
  where accept_token = token
  for update;

  if q_id is null then
    raise exception 'quote not found';
  end if;
  if q_status not in ('draft', 'sent') then
    raise exception 'quote already %', q_status;
  end if;
  if q_valid_until is not null and q_valid_until < current_date then
    update public.quotes set status = 'expired'
      where id = q_id and status in ('draft', 'sent');
    raise exception 'quote expired';
  end if;

  update public.quotes
  set status = 'accepted',
      accepted_at = now(),
      accepted_by_email = lower(signer_email)
  where id = q_id;

  return q_id;
end;
$$;

revoke all on function public.accept_quote(uuid, text) from public;
-- Public/anon access — the token IS the auth.
grant execute on function public.accept_quote(uuid, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 14. RPC: get_quote_by_token — public read for the accept page
-- ---------------------------------------------------------------------------

create or replace function public.get_quote_by_token(token uuid)
returns table (
  id uuid,
  reference text,
  title text,
  description text,
  status text,
  deduction_type text,
  subtotal_cents bigint,
  vat_cents bigint,
  total_cents bigint,
  deduction_cents bigint,
  customer_pays_cents bigint,
  valid_until date,
  sent_at timestamptz,
  accepted_at timestamptz,
  accepted_by_email text,
  tenant_name text,
  tenant_logo_url text,
  customer_name text,
  items jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
    select
      q.id, q.reference, q.title, q.description, q.status, q.deduction_type,
      q.subtotal_cents, q.vat_cents, q.total_cents,
      q.deduction_cents, q.customer_pays_cents,
      q.valid_until, q.sent_at, q.accepted_at, q.accepted_by_email,
      t.name, t.logo_url,
      c.name,
      coalesce(
        (
          select jsonb_agg(jsonb_build_object(
            'kind', qi.kind,
            'description', qi.description,
            'quantity', qi.quantity,
            'unit', qi.unit,
            'unit_price_cents', qi.unit_price_cents,
            'vat_rate', qi.vat_rate,
            'deductible', qi.deductible
          ) order by qi.ord)
          from public.quote_items qi
          where qi.quote_id = q.id
        ),
        '[]'::jsonb
      )
    from public.quotes q
    join public.tenants t on t.id = q.tenant_id
    left join public.customers c on c.id = q.customer_id
    where q.accept_token = token;
end;
$$;

revoke all on function public.get_quote_by_token(uuid) from public;
grant execute on function public.get_quote_by_token(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 15. View: project_summary — aggregates time, materials, ÄTA for a project
-- ---------------------------------------------------------------------------

create or replace view public.project_summary as
select
  p.id as project_id,
  p.tenant_id,
  coalesce(t.total_minutes, 0)::integer as total_minutes,
  coalesce(t.entry_count, 0)::integer as time_entry_count,
  coalesce(m.material_total_cents, 0)::bigint as material_total_cents,
  coalesce(c.change_total_cents, 0)::bigint as change_total_cents,
  coalesce(d.doc_count, 0)::integer as doc_count,
  coalesce(ph.photo_count, 0)::integer as photo_count
from public.projects p
left join (
  select project_id,
         sum(coalesce(duration_minutes, 0))::integer as total_minutes,
         count(*) as entry_count
  from public.time_entries where project_id is not null
  group by project_id
) t on t.project_id = p.id
left join (
  select project_id,
         sum(quantity * unit_price_cents)::bigint as material_total_cents
  from public.project_materials group by project_id
) m on m.project_id = p.id
left join (
  select project_id,
         sum(total_cents) filter (where status = 'approved')::bigint as change_total_cents
  from public.change_orders group by project_id
) c on c.project_id = p.id
left join (
  select project_id, count(*) as doc_count
  from public.project_documents group by project_id
) d on d.project_id = p.id
left join (
  select project_id, count(*) as photo_count
  from public.project_photos group by project_id
) ph on ph.project_id = p.id;

grant select on public.project_summary to authenticated;
