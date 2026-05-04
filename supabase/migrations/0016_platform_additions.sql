-- Wave 8: cross-cutting platform additions — audit log, webhooks,
-- API keys, white-label flag, multi-currency baseline.
-- Forward-only and idempotent.

-- ---------------------------------------------------------------------------
-- 1. Audit log
-- ---------------------------------------------------------------------------
-- Generic event log. Triggers + app code both insert here; the audit-log
-- viewer reads with strict tenant scoping.

create table if not exists public.audit_log (
  id bigserial primary key,
  tenant_id uuid references public.tenants(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  -- "products.update", "quotes.send", "team.invite", "portal.order_placed"…
  event_type text not null,
  -- Free-form payload (old/new diffs, ids, names) — keep small.
  payload jsonb not null default '{}'::jsonb,
  ip text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_tenant_created_idx
  on public.audit_log (tenant_id, created_at desc);
create index if not exists audit_log_event_idx
  on public.audit_log (event_type);
create index if not exists audit_log_actor_idx
  on public.audit_log (actor_user_id);

alter table public.audit_log enable row level security;

drop policy if exists "audit_log_tenant_select" on public.audit_log;
create policy "audit_log_tenant_select" on public.audit_log
  for select using (
    tenant_id in (select public.current_owner_admin_tenant_ids())
    or public.is_admin()
  );

-- Inserts go via security-definer RPC (no direct insert policy)
-- so the app code can't fake actor / payload from a client.
create or replace function public.log_audit(
  target_tenant uuid,
  event_type text,
  payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  out_id bigint;
begin
  if target_tenant is not null
     and target_tenant not in (select public.current_tenant_ids())
     and not public.is_admin() then
    raise exception 'forbidden';
  end if;

  insert into public.audit_log (tenant_id, actor_user_id, event_type, payload)
  values (target_tenant, auth.uid(), event_type, coalesce(payload, '{}'::jsonb))
  returning id into out_id;
  return out_id;
end;
$$;

revoke all on function public.log_audit(uuid, text, jsonb) from public;
grant execute on function public.log_audit(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Webhooks
-- ---------------------------------------------------------------------------

create table if not exists public.webhooks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  -- HTTPS endpoint to POST events to
  url text not null check (url ~* '^https?://'),
  -- Subscribed event types — null/empty = all
  events text[] not null default '{}',
  -- HMAC-SHA256 secret used to sign deliveries
  secret text not null default encode(gen_random_bytes(32), 'hex'),
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  -- Health snapshot
  last_delivery_at timestamptz,
  last_status integer,
  failure_streak integer not null default 0
);

create index if not exists webhooks_tenant_active_idx
  on public.webhooks (tenant_id, active);

alter table public.webhooks enable row level security;

drop policy if exists "webhooks_tenant_all" on public.webhooks;
create policy "webhooks_tenant_all" on public.webhooks
  for all
  using (tenant_id in (select public.current_owner_admin_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_owner_admin_tenant_ids()) or public.is_admin());

-- Delivery queue / log
create table if not exists public.webhook_deliveries (
  id bigserial primary key,
  webhook_id uuid not null references public.webhooks(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  -- Delivery state
  status text not null default 'pending'
    check (status in ('pending', 'delivered', 'failed', 'discarded')),
  attempts integer not null default 0,
  last_status_code integer,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  delivered_at timestamptz
);

create index if not exists webhook_deliveries_webhook_idx
  on public.webhook_deliveries (webhook_id, created_at desc);
create index if not exists webhook_deliveries_pending_idx
  on public.webhook_deliveries (next_attempt_at)
  where status = 'pending';

alter table public.webhook_deliveries enable row level security;

drop policy if exists "webhook_deliveries_select" on public.webhook_deliveries;
create policy "webhook_deliveries_select" on public.webhook_deliveries
  for select using (
    webhook_id in (
      select id from public.webhooks
      where tenant_id in (select public.current_owner_admin_tenant_ids())
    )
    or public.is_admin()
  );

-- ---------------------------------------------------------------------------
-- 3. API keys — public-API authentication
-- ---------------------------------------------------------------------------

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  -- We store SHA256(token) only, never the plaintext token.
  token_sha256 text not null unique,
  -- Show last 4 chars for the owner to recognize the key.
  token_last4 text not null,
  -- Coarse-grained scopes: "read:products", "write:orders"…
  scopes text[] not null default '{"read:all"}',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz
);

create index if not exists api_keys_tenant_idx on public.api_keys (tenant_id);

alter table public.api_keys enable row level security;

drop policy if exists "api_keys_tenant_all" on public.api_keys;
create policy "api_keys_tenant_all" on public.api_keys
  for all
  using (tenant_id in (select public.current_owner_admin_tenant_ids()) or public.is_admin())
  with check (tenant_id in (select public.current_owner_admin_tenant_ids()) or public.is_admin());

create or replace function public.create_api_key(
  target_tenant uuid,
  key_name text,
  key_scopes text[] default array['read:all'],
  ttl_days integer default null
)
returns table (id uuid, token text)
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text := 'sk_' || encode(gen_random_bytes(24), 'hex');
  hash text := encode(digest(raw_token, 'sha256'), 'hex');
  last4 text := right(raw_token, 4);
  new_id uuid;
  expiry timestamptz := case when ttl_days is null then null
                              else now() + (ttl_days || ' days')::interval end;
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

-- ---------------------------------------------------------------------------
-- 4. White-label + currency on tenants
-- ---------------------------------------------------------------------------

alter table public.tenants
  add column if not exists white_label boolean not null default false,
  add column if not exists custom_domain text,
  add column if not exists default_currency text not null default 'SEK',
  add column if not exists default_locale text not null default 'sv-SE',
  add column if not exists support_email text,
  add column if not exists support_phone text;

create unique index if not exists tenants_custom_domain_idx
  on public.tenants (lower(custom_domain))
  where custom_domain is not null;
