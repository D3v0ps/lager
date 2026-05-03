-- Admin-only helpers for the /admin/ UI
-- Lets admins (tenant_users.role = 'admin' in any tenant) list every auth
-- user so they can be added to tenants.

-- Function: returns all auth.users when caller is admin, else raises.
create or replace function public.admin_list_users()
returns table (id uuid, email text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden';
  end if;
  return query
    select u.id, u.email::text, u.created_at
    from auth.users u
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

-- Function: counts members of a tenant. Visible to anyone in that tenant
-- and to admins. Used to render "X medlemmar" without selecting full rows.
create or replace function public.tenant_member_count(target_tenant uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.tenant_users tu
  where tu.tenant_id = target_tenant
    and (
      target_tenant in (select public.current_tenant_ids())
      or public.is_admin()
    );
$$;

revoke all on function public.tenant_member_count(uuid) from public;
grant execute on function public.tenant_member_count(uuid) to authenticated;

-- Reserve a few slugs that must never be tenant URLs (would clash with
-- top-level routes).
create or replace function public.tenants_reject_reserved_slugs()
returns trigger
language plpgsql
as $$
begin
  if new.slug in ('admin', 'login', 'api', 'demo-public', '_next', 'public', 'static', 'assets') then
    -- 'demo' is intentionally allowed — it's the seed tenant.
    raise exception 'slug % is reserved', new.slug;
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_reject_reserved on public.tenants;
create trigger tenants_reject_reserved
before insert or update of slug on public.tenants
for each row execute function public.tenants_reject_reserved_slugs();
