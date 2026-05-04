-- Wave 9: deliver claims we made on /bygg/.
--
-- 1. Geofence per byggarbetsplats — projects get site_lat/lng/radius_m.
--    The clockIn helper checks geo against this and warns if outside.
-- 2. BAS-P/U + AFS-mallar för KMA — seed default templates.
-- 3. Project-mallar: project_templates already exists (0015), but cloneProject
--    didn't copy phases-from-template. We add a project_template_phases
--    embedded JSON shape — handled in lib/project-templates.ts.
--
-- Forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. Geofence per project
-- ---------------------------------------------------------------------------

alter table public.projects
  add column if not exists site_lat_e7 integer,
  add column if not exists site_lng_e7 integer,
  add column if not exists site_radius_m integer
    check (site_radius_m is null or site_radius_m between 25 and 5000);

-- ---------------------------------------------------------------------------
-- 2. Helper: distance in metres between two e7-encoded coordinates
-- ---------------------------------------------------------------------------
-- Equirectangular approximation — accurate enough for geofence-checks
-- (we tolerate <1 % error at 1 km).

create or replace function public.geo_distance_m(
  lat1_e7 integer,
  lng1_e7 integer,
  lat2_e7 integer,
  lng2_e7 integer
) returns double precision
language plpgsql immutable
as $$
declare
  lat1 double precision := lat1_e7 / 1e7;
  lng1 double precision := lng1_e7 / 1e7;
  lat2 double precision := lat2_e7 / 1e7;
  lng2 double precision := lng2_e7 / 1e7;
  R constant double precision := 6371000; -- earth radius in metres
  x double precision := radians(lng2 - lng1) * cos(radians((lat1 + lat2) / 2));
  y double precision := radians(lat2 - lat1);
begin
  return R * sqrt(x*x + y*y);
end;
$$;

revoke all on function public.geo_distance_m(integer, integer, integer, integer)
  from public;
grant execute on function public.geo_distance_m(integer, integer, integer, integer)
  to authenticated;

-- ---------------------------------------------------------------------------
-- 3. View: time_entries with geofence verdict — used by the Tid-vy:n
--    so admins can see which clock-ins were inside / outside geofence.
-- ---------------------------------------------------------------------------

create or replace view public.time_entries_with_geofence as
select
  t.*,
  case
    when t.geo_lat_e7 is null or t.geo_lng_e7 is null then 'unknown'
    when p.site_lat_e7 is null or p.site_lng_e7 is null
         or p.site_radius_m is null then 'unknown'
    when public.geo_distance_m(t.geo_lat_e7, t.geo_lng_e7,
                               p.site_lat_e7, p.site_lng_e7)
         <= p.site_radius_m then 'inside'
    else 'outside'
  end as geofence_status
from public.time_entries t
left join public.projects p on p.id = t.project_id;

grant select on public.time_entries_with_geofence to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Seed default BAS-P/U + AFS-mallar (only for new tenants — we won't
--    overwrite anything if a tenant already has templates)
-- ---------------------------------------------------------------------------
-- We provide a single SQL function tenant admins can call to bootstrap
-- their workspace with the standard Swedish construction templates.

create or replace function public.seed_default_inspection_templates(
  target_tenant uuid
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted integer := 0;
begin
  if target_tenant not in (select public.current_owner_admin_tenant_ids())
     and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- BAS-P / BAS-U arbetsmiljö-samordning (AFS 2008:16)
  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant
      and name = 'BAS-P/U arbetsmiljö-samordning'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant,
      'kma',
      'BAS-P/U arbetsmiljö-samordning',
      'Checklista enligt AFS 2008:16. Använd vid projekterings-start och under utförande.',
      '[
        {"id":"1","label":"Arbetsmiljöplan upprättad och uppdaterad","kind":"check","required":true},
        {"id":"2","label":"Risker för fall identifierade och åtgärdade","kind":"check","required":true},
        {"id":"3","label":"Ras-risker (schakt, ställningar) hanterade","kind":"check","required":true},
        {"id":"4","label":"Tunga element och lyfthjälpmedel kontrollerade","kind":"check","required":true},
        {"id":"5","label":"Riskbedömning för dammande material","kind":"check"},
        {"id":"6","label":"Förläggning av tunga arbeten samordnad","kind":"check"},
        {"id":"7","label":"Miljöplan / avfallshantering kommunicerad","kind":"check"},
        {"id":"8","label":"Anteckningar / åtgärder","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  -- AFS 2020:1 elsäkerhet på arbetsplats
  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant
      and name = 'Elsäkerhet (AFS 2020:1)'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant,
      'skyddsrond',
      'Elsäkerhet (AFS 2020:1)',
      'Veckorond för elsäkerhet på byggarbetsplats.',
      '[
        {"id":"1","label":"Kabeldragning ej skadad / klämd","kind":"check","required":true},
        {"id":"2","label":"Jordfels­brytare testad","kind":"check","required":true},
        {"id":"3","label":"Centraler stängda / låsta för obehöriga","kind":"check"},
        {"id":"4","label":"Ingen exponerad spänning","kind":"check","required":true},
        {"id":"5","label":"Anteckningar","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  -- KMA-rond (klassisk Kvalitet/Miljö/Arbetsmiljö)
  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'KMA-rond'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant,
      'kma',
      'KMA-rond',
      'Övergripande kvalitet, miljö, arbetsmiljö-rond. Genomförs varje vecka.',
      '[
        {"id":"1","label":"Personlig skyddsutrustning bärs av alla","kind":"check","required":true},
        {"id":"2","label":"Avfall sorteras enligt miljöplan","kind":"check","required":true},
        {"id":"3","label":"Buller- och dammhantering enligt plan","kind":"check"},
        {"id":"4","label":"Tillbud / olyckor rapporterade","kind":"check"},
        {"id":"5","label":"Energi- och vatten­förbrukning loggas","kind":"check"},
        {"id":"6","label":"Foto på arbetsplatsen","kind":"photo"},
        {"id":"7","label":"Kommentarer","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  -- Egenkontroll snickeri / installation
  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'Egenkontroll utfört arbete'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant,
      'egenkontroll',
      'Egenkontroll utfört arbete',
      'Egenkontroll efter färdigt arbetsmoment.',
      '[
        {"id":"1","label":"Underlag rent och plant inför nästa moment","kind":"check","required":true},
        {"id":"2","label":"Material kontrollerat mot beställning","kind":"check","required":true},
        {"id":"3","label":"Måttsättning verifierad","kind":"measure"},
        {"id":"4","label":"Foto på utfört arbete","kind":"photo"},
        {"id":"5","label":"Avvikelser / kommentar","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  -- Veckorond / skyddsrond
  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'Veckorond / skyddsrond'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant,
      'skyddsrond',
      'Veckorond / skyddsrond',
      'Generell skyddsrond för byggarbetsplats. Genomförs varje vecka.',
      '[
        {"id":"1","label":"Fallskydd över 2 m säkrade","kind":"check","required":true},
        {"id":"2","label":"Stege / ställning besiktigad","kind":"check","required":true},
        {"id":"3","label":"Brandskydd: släckare + utrymning ok","kind":"check","required":true},
        {"id":"4","label":"Heta arbeten — tillstånd + bevakning","kind":"check"},
        {"id":"5","label":"Första hjälpen-station fylld","kind":"check"},
        {"id":"6","label":"Personlig skyddsutrustning bärs av alla","kind":"check","required":true},
        {"id":"7","label":"Foto / bevis","kind":"photo"},
        {"id":"8","label":"Kommentarer / åtgärder","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  return inserted;
end;
$$;

revoke all on function public.seed_default_inspection_templates(uuid) from public;
grant execute on function public.seed_default_inspection_templates(uuid) to authenticated;
