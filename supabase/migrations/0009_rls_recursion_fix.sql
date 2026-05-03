-- Fix RLS recursion: several policies queried tenant_users from inside
-- tenant_users (or from tenants/tenant_invitations) which triggers RLS-on-RLS
-- evaluation and silently returns no rows. The symptom: owners/admins lose
-- the ability to read their own role row, so the app's role checks
-- (getMyRoleInTenant, listTeam, branding-form canEdit gate) all return null
-- and the UI falls back to "Kontakta din admin".
--
-- Fix: route every "is the caller an owner/admin of tenant X?" check through
-- a security-definer helper that bypasses RLS, then use that helper in the
-- affected policies.

create or replace function public.current_owner_admin_tenant_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from public.tenant_users
  where user_id = auth.uid() and role in ('owner', 'admin');
$$;

revoke all on function public.current_owner_admin_tenant_ids() from public;
grant execute on function public.current_owner_admin_tenant_ids() to authenticated;

-- Authenticated role cannot read auth.users directly. Wrap the lookup in
-- a security-definer helper so RLS policies can match on the caller's email
-- without granting select on auth.users.
create or replace function public.current_user_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select email::text from auth.users where id = auth.uid()), '');
$$;

revoke all on function public.current_user_email() from public;
grant execute on function public.current_user_email() to authenticated;

-- ---------------------------------------------------------------------------
-- tenant_users — replace the "for all" owner-write policy that recursed
-- ---------------------------------------------------------------------------

drop policy if exists "tenant_users_owner_write" on public.tenant_users;
create policy "tenant_users_owner_write" on public.tenant_users
  for all
  using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  )
  with check (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- tenants — owner_update policy was querying tenant_users via inline subquery
-- ---------------------------------------------------------------------------

drop policy if exists "tenants_owner_update" on public.tenants;
create policy "tenants_owner_update" on public.tenants
  for update
  using (
    id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  )
  with check (
    id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- tenant_invitations — both select + delete policies used the same pattern
-- ---------------------------------------------------------------------------

drop policy if exists "tenant_invitations_select" on public.tenant_invitations;
create policy "tenant_invitations_select" on public.tenant_invitations
  for select using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
    or lower(email) = lower(public.current_user_email())
  );

drop policy if exists "tenant_invitations_delete" on public.tenant_invitations;
create policy "tenant_invitations_delete" on public.tenant_invitations
  for delete using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );
