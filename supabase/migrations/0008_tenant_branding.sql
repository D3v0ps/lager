-- Per-tenant branding: each tenant can set its own logo URL and primary color.
-- Owners + admins of a tenant may update these via the settings UI.

alter table public.tenants
  add column if not exists logo_url text,
  add column if not exists primary_color text
  check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$');

-- ---------------------------------------------------------------------------
-- RLS: existing policies only allow global admins to update tenants. Branding
-- needs to be writable by the tenant's own owners as well.
-- ---------------------------------------------------------------------------

drop policy if exists "tenants_owner_update" on public.tenants;
create policy "tenants_owner_update" on public.tenants
  for update
  using (
    id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
  )
  with check (
    id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
  );
