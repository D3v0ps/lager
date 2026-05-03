-- Wave 4.5.1: fix ambiguous user_id in list_tenant_team
--
-- list_tenant_team declares RETURNS TABLE (user_id uuid, ...). In PL/pgSQL
-- the output column names live in scope inside the function body as OUT
-- parameters, so the unqualified `user_id = auth.uid()` inside the
-- membership EXISTS check collided with the OUT parameter named user_id.
-- Postgres raised `column reference "user_id" is ambiguous` before the
-- SELECT ever ran, so the team page rendered the error and the member
-- list stayed empty.
--
-- Fix: alias tenant_users in the EXISTS subquery and qualify both
-- references so user_id resolves to the table column.

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
    select 1 from public.tenant_users tu
    where tu.tenant_id = target_tenant
      and tu.user_id = auth.uid()
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
