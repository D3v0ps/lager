-- Wave 4.5: tenant owners can invite users via email
-- Adds an invitations table + RPCs so owners (not just platform admins)
-- can manage their own team. Magic-link signup happens via Supabase Auth;
-- on first sign-in the new user runs accept_pending_invitations() to be
-- linked to whatever tenants they were invited to.

create table if not exists public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner', 'member')) default 'member',
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

create index if not exists tenant_invitations_email_idx
  on public.tenant_invitations (lower(email));
create index if not exists tenant_invitations_tenant_idx
  on public.tenant_invitations (tenant_id);

alter table public.tenant_invitations enable row level security;

-- Owners + admins can see invitations for their tenant; users can see
-- invitations addressed to their own email.
drop policy if exists "tenant_invitations_select" on public.tenant_invitations;
create policy "tenant_invitations_select" on public.tenant_invitations
  for select using (
    tenant_id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
    or public.is_admin()
    or lower(email) = lower(coalesce((select email::text from auth.users where id = auth.uid()), ''))
  );

-- Owners + admins can delete (revoke) pending invitations for their tenant.
drop policy if exists "tenant_invitations_delete" on public.tenant_invitations;
create policy "tenant_invitations_delete" on public.tenant_invitations
  for delete using (
    tenant_id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
    or public.is_admin()
  );

-- Inserts go through the RPC below (no direct policy needed; we revoke
-- INSERT from the policy and rely on the security-definer function).

-- ---------------------------------------------------------------------------
-- RLS update: let owners (not just admins) manage their own tenant_users
-- ---------------------------------------------------------------------------

drop policy if exists "tenant_users_owner_write" on public.tenant_users;
create policy "tenant_users_owner_write" on public.tenant_users
  for all
  using (
    tenant_id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
  )
  with check (
    tenant_id in (
      select tu.tenant_id from public.tenant_users tu
      where tu.user_id = auth.uid() and tu.role in ('owner', 'admin')
    )
  );

-- Members can see other members of their own tenant.
drop policy if exists "tenant_users_member_select" on public.tenant_users;
create policy "tenant_users_member_select" on public.tenant_users
  for select using (
    tenant_id in (select public.current_tenant_ids()) or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- RPC: invite_member — owners or admins create a pending invitation
-- ---------------------------------------------------------------------------

create or replace function public.invite_member(
  target_slug text,
  invitee_email text,
  invitee_role text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_tenant uuid;
  norm_email text := lower(trim(invitee_email));
  inv_id uuid;
begin
  if norm_email = '' or position('@' in norm_email) = 0 then
    raise exception 'invalid email';
  end if;
  if invitee_role not in ('owner', 'member') then
    raise exception 'invalid role';
  end if;

  select id into target_tenant from public.tenants where slug = target_slug;
  if target_tenant is null then
    raise exception 'tenant not found';
  end if;

  if not exists (
    select 1 from public.tenant_users
    where tenant_id = target_tenant
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  ) and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  -- Drop previous unaccepted invitation for the same email/tenant so the
  -- list stays clean (one pending invite per email).
  delete from public.tenant_invitations
  where tenant_id = target_tenant
    and lower(email) = norm_email
    and accepted_at is null;

  insert into public.tenant_invitations (tenant_id, email, role, invited_by)
  values (target_tenant, norm_email, invitee_role, auth.uid())
  returning id into inv_id;

  return inv_id;
end;
$$;

revoke all on function public.invite_member(text, text, text) from public;
grant execute on function public.invite_member(text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: accept_pending_invitations — runs after user signs in; links them
-- to all tenants they were invited to.
-- ---------------------------------------------------------------------------

create or replace function public.accept_pending_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  user_email text;
  applied integer := 0;
begin
  select lower(email::text) into user_email from auth.users where id = auth.uid();
  if user_email is null then
    return 0;
  end if;

  with accepted as (
    update public.tenant_invitations
    set accepted_at = now()
    where lower(email) = user_email
      and accepted_at is null
    returning tenant_id, role
  ),
  inserted as (
    insert into public.tenant_users (tenant_id, user_id, role)
    select tenant_id, auth.uid(), role from accepted
    on conflict (tenant_id, user_id) do nothing
    returning 1
  )
  select count(*) into applied from inserted;

  return applied;
end;
$$;

revoke all on function public.accept_pending_invitations() from public;
grant execute on function public.accept_pending_invitations() to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: list_tenant_team — owners can see members WITH emails (admin_list_users
-- is admin-only). Returns user_id, email, role, created_at.
-- ---------------------------------------------------------------------------

create or replace function public.list_tenant_team(target_tenant uuid)
returns table (
  user_id uuid,
  email text,
  role text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.tenant_users
    where tenant_id = target_tenant
      and user_id = auth.uid()
  ) and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  return query
    select tu.user_id, u.email::text, tu.role, tu.created_at
    from public.tenant_users tu
    join auth.users u on u.id = tu.user_id
    where tu.tenant_id = target_tenant
    order by tu.created_at asc;
end;
$$;

revoke all on function public.list_tenant_team(uuid) from public;
grant execute on function public.list_tenant_team(uuid) to authenticated;
