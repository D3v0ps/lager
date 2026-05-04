-- Fix: create_api_key fails with "function gen_random_bytes(integer) does not
-- exist" on newer Supabase projects where pgcrypto lives in `extensions`
-- schema rather than `public`.
--
-- The original 0016 function relied on `gen_random_bytes` and `digest` being
-- in search_path. Re-create with `set search_path = public, extensions` so
-- the pgcrypto functions resolve regardless of which schema they're in.

create or replace function public.create_api_key(
  target_tenant uuid,
  key_name text,
  key_scopes text[] default array['read:all'],
  ttl_days integer default null
)
returns table (id uuid, token text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  raw_token text := 'sk_' || encode(gen_random_bytes(24), 'hex');
  hash text := encode(digest(raw_token, 'sha256'), 'hex');
  last4 text := right(raw_token, 4);
  new_id uuid;
  expiry timestamptz := case
    when ttl_days is null then null
    else now() + (ttl_days || ' days')::interval
  end;
begin
  if target_tenant not in (select public.current_owner_admin_tenant_ids())
     and not public.is_admin() then
    raise exception 'forbidden';
  end if;
  insert into public.api_keys
    (tenant_id, name, token_sha256, token_last4, scopes, created_by, expires_at)
  values
    (target_tenant, key_name, hash, last4, key_scopes, auth.uid(), expiry)
  returning api_keys.id into new_id;
  return query select new_id, raw_token;
end;
$$;

revoke all on function public.create_api_key(uuid, text, text[], integer)
  from public;
grant execute on function public.create_api_key(uuid, text, text[], integer)
  to authenticated;

-- Same patch for the secret-generator default on webhooks.secret —
-- generated columns can run before the search_path is applied at row
-- insert, depending on PG version. Drop the column default and set it
-- via a BEFORE INSERT trigger that explicitly schema-qualifies.

alter table public.webhooks
  alter column secret drop default;

create or replace function public.webhooks_default_secret()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
begin
  if new.secret is null or new.secret = '' then
    new.secret := encode(gen_random_bytes(32), 'hex');
  end if;
  return new;
end;
$$;

drop trigger if exists webhooks_default_secret on public.webhooks;
create trigger webhooks_default_secret
before insert on public.webhooks
for each row execute function public.webhooks_default_secret();
