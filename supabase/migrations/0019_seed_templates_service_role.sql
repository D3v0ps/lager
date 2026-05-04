-- Fix: seed_default_inspection_templates rejects calls from the SQL Editor
-- because auth.uid() is null when running as the postgres / service_role.
-- The previous version raised "forbidden" in that case.
--
-- New behaviour: when auth.uid() is null we ASSUME service-role context
-- (the only way to reach a SECURITY DEFINER function from a null uid is
-- via service_role / postgres) and skip the per-tenant authorization
-- check. Authenticated users still get the original guard.

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
  caller uuid := auth.uid();
begin
  -- Authenticated callers must be owner/admin of the target tenant or a
  -- platform admin. Service-role callers (auth.uid() is null) bypass.
  if caller is not null then
    if target_tenant not in (select public.current_owner_admin_tenant_ids())
       and not public.is_admin() then
      raise exception 'forbidden';
    end if;
  end if;

  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant
      and name = 'BAS-P/U arbetsmiljö-samordning'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant, 'kma',
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

  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant
      and name = 'Elsäkerhet (AFS 2020:1)'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant, 'skyddsrond',
      'Elsäkerhet (AFS 2020:1)',
      'Veckorond för elsäkerhet på byggarbetsplats.',
      '[
        {"id":"1","label":"Kabeldragning ej skadad / klämd","kind":"check","required":true},
        {"id":"2","label":"Jordfelsbrytare testad","kind":"check","required":true},
        {"id":"3","label":"Centraler stängda / låsta för obehöriga","kind":"check"},
        {"id":"4","label":"Ingen exponerad spänning","kind":"check","required":true},
        {"id":"5","label":"Anteckningar","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'KMA-rond'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant, 'kma',
      'KMA-rond',
      'Övergripande kvalitet, miljö, arbetsmiljö-rond. Genomförs varje vecka.',
      '[
        {"id":"1","label":"Personlig skyddsutrustning bärs av alla","kind":"check","required":true},
        {"id":"2","label":"Avfall sorteras enligt miljöplan","kind":"check","required":true},
        {"id":"3","label":"Buller- och dammhantering enligt plan","kind":"check"},
        {"id":"4","label":"Tillbud / olyckor rapporterade","kind":"check"},
        {"id":"5","label":"Energi- och vattenförbrukning loggas","kind":"check"},
        {"id":"6","label":"Foto på arbetsplatsen","kind":"photo"},
        {"id":"7","label":"Kommentarer","kind":"text"}
      ]'::jsonb
    );
    inserted := inserted + 1;
  end if;

  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'Egenkontroll utfört arbete'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant, 'egenkontroll',
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

  if not exists (
    select 1 from public.inspection_templates
    where tenant_id = target_tenant and name = 'Veckorond / skyddsrond'
  ) then
    insert into public.inspection_templates (tenant_id, kind, name, description, items)
    values (
      target_tenant, 'skyddsrond',
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
