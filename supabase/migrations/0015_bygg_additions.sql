-- Wave 8: Saldo Bygg additions — ID06, subcontractors (UE), KMA + egenkontroll
-- + skyddsrond, project templates, photo pairs (before/after).
-- Forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. ID06-stöd — branschstandard bygg-ID
-- ---------------------------------------------------------------------------
-- Each employee gets an ID06-card. We track the card number, validity and
-- attestation status. ID06 has a real verification API; we store the local
-- copy of the card data here and call out to verify when configured.

alter table public.employees
  add column if not exists id06_card_number text,
  add column if not exists id06_valid_until date,
  add column if not exists id06_verified_at timestamptz,
  add column if not exists personnummer_last_four text
    check (personnummer_last_four is null or personnummer_last_four ~ '^\d{4}$');

create index if not exists employees_id06_idx
  on public.employees (tenant_id, id06_card_number)
  where id06_card_number is not null;

-- ---------------------------------------------------------------------------
-- 2. Subcontractors (underentreprenörer / UE)
-- ---------------------------------------------------------------------------

create table if not exists public.subcontractors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  company_name text not null,
  org_number text,
  contact_name text,
  email text,
  phone text,
  -- F-skatt / arbetsgivar­avgift / försäkring — krav på huvudentreprenör
  has_fskatt boolean not null default false,
  fskatt_verified_at timestamptz,
  insurance_valid_until date,
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subcontractors_tenant_idx
  on public.subcontractors (tenant_id);

drop trigger if exists subcontractors_touch on public.subcontractors;
create trigger subcontractors_touch
before update on public.subcontractors
for each row execute function public.touch_updated_at();

alter table public.subcontractors enable row level security;

drop policy if exists "subcontractors_tenant_all" on public.subcontractors;
create policy "subcontractors_tenant_all" on public.subcontractors
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- Link subcontractors to projects + log their hours separately
create table if not exists public.project_subcontractors (
  project_id uuid not null references public.projects(id) on delete cascade,
  subcontractor_id uuid not null
    references public.subcontractors(id) on delete cascade,
  agreed_amount_cents bigint,
  notes text,
  created_at timestamptz not null default now(),
  primary key (project_id, subcontractor_id)
);

alter table public.project_subcontractors enable row level security;

drop policy if exists "project_subcontractors_all" on public.project_subcontractors;
create policy "project_subcontractors_all" on public.project_subcontractors
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
-- 3. Inspection / checklist templates + project inspections
-- ---------------------------------------------------------------------------
-- Templates can be tenant-wide (KMA-policy, egenkontroll-mall, skyddsrond).
-- Each project picks one or more and runs through the items.

create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  -- 'kma' = Kvalitet/Miljö/Arbetsmiljö
  -- 'egenkontroll' = installations- / arbets-egenkontroll
  -- 'skyddsrond' = arbetsmiljörond
  -- 'avetableringsbesiktning' / 'slutbesiktning' osv kan komma senare
  kind text not null
    check (kind in ('kma', 'egenkontroll', 'skyddsrond', 'other')),
  name text not null,
  description text,
  -- Items as JSON array: [{ id, label, kind: 'check'|'text'|'photo', required }]
  items jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inspection_templates_tenant_idx
  on public.inspection_templates (tenant_id, kind);

drop trigger if exists inspection_templates_touch on public.inspection_templates;
create trigger inspection_templates_touch
before update on public.inspection_templates
for each row execute function public.touch_updated_at();

alter table public.inspection_templates enable row level security;

drop policy if exists "inspection_templates_tenant_all" on public.inspection_templates;
create policy "inspection_templates_tenant_all" on public.inspection_templates
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

create table if not exists public.project_inspections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  template_id uuid references public.inspection_templates(id) on delete set null,
  kind text not null
    check (kind in ('kma', 'egenkontroll', 'skyddsrond', 'other')),
  title text not null,
  -- Snapshot of items + their answers/checks at completion time
  items jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'completed', 'failed')),
  completed_at timestamptz,
  completed_by uuid references auth.users(id) on delete set null,
  signed_by_email text,
  signed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_inspections_project_idx
  on public.project_inspections (project_id);
create index if not exists project_inspections_status_idx
  on public.project_inspections (project_id, status);

drop trigger if exists project_inspections_touch on public.project_inspections;
create trigger project_inspections_touch
before update on public.project_inspections
for each row execute function public.touch_updated_at();

alter table public.project_inspections enable row level security;

drop policy if exists "project_inspections_tenant_all" on public.project_inspections;
create policy "project_inspections_tenant_all" on public.project_inspections
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
-- 4. Project templates — copy a structure for new projects
-- ---------------------------------------------------------------------------

create table if not exists public.project_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  -- Phases as JSON array: [{ name, ord, days_offset_from_start }]
  phases jsonb not null default '[]'::jsonb,
  -- Default inspection-template ids to attach
  default_inspection_template_ids uuid[],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists project_templates_tenant_idx
  on public.project_templates (tenant_id, active);

alter table public.project_templates enable row level security;

drop policy if exists "project_templates_tenant_all" on public.project_templates;
create policy "project_templates_tenant_all" on public.project_templates
  for all
  using (tenant_id in (select public.current_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_tenant_ids()) or public.is_admin());

-- ---------------------------------------------------------------------------
-- 5. Before/after photo pairing
-- ---------------------------------------------------------------------------
-- Photos can be grouped: pair a "before" photo with its "after" photo so
-- the photos tab can render side-by-side.

alter table public.project_photos
  add column if not exists pair_group uuid,
  add column if not exists position text
    check (position is null or position in ('before', 'after', 'progress'));

create index if not exists project_photos_pair_idx
  on public.project_photos (project_id, pair_group)
  where pair_group is not null;
