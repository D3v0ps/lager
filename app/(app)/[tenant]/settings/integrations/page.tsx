"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  buttonClasses,
  Card,
  CardHeader,
  DataTable,
  EmptyState,
  ErrorBanner,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
  TBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "@/app/_components/ui";
import {
  AVAILABLE_SCOPES,
  createApiKey,
  deleteApiKey,
  listApiKeys,
  revokeApiKey,
  type ApiKey,
  type CreatedKey,
} from "@/lib/api-keys";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";
import { formatDate } from "@/lib/format";
import { useTenantState } from "@/lib/tenant-context";
import {
  createWebhook,
  deleteWebhook,
  listWebhookDeliveries,
  listWebhooks,
  setWebhookActive,
  SUPPORTED_EVENT_TYPES,
  type Webhook,
  type WebhookDelivery,
} from "@/lib/webhooks";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type TtlOption = "never" | "30" | "90" | "365";

const TTL_OPTIONS: { value: TtlOption; label: string; days: number | null }[] =
  [
    { value: "never", label: "Aldrig", days: null },
    { value: "30", label: "30 dagar", days: 30 },
    { value: "90", label: "90 dagar", days: 90 },
    { value: "365", label: "1 år", days: 365 },
  ];

function isValidHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:";
  } catch {
    return false;
  }
}

function deliveryStatusTone(
  status: WebhookDelivery["status"],
): "ok" | "warning" | "error" | "muted" {
  switch (status) {
    case "delivered":
      return "ok";
    case "pending":
      return "warning";
    case "failed":
      return "error";
    case "discarded":
      return "muted";
  }
}

function statusCodeTone(code: number | null): "ok" | "error" | "muted" {
  if (code == null) return "muted";
  if (code >= 200 && code < 300) return "ok";
  return "error";
}

function apiKeyStatus(
  key: ApiKey,
): { tone: "ok" | "warning" | "error" | "muted"; label: string } {
  if (key.revoked_at) return { tone: "error", label: "Återkallad" };
  if (key.expires_at && new Date(key.expires_at).getTime() < Date.now()) {
    return { tone: "warning", label: "Utgången" };
  }
  return { tone: "ok", label: "Aktiv" };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function IntegrationsPage() {
  const tenantState = useTenantState();
  const tenant = tenantState.tenant;

  const [webhooks, setWebhooks] = useState<Webhook[] | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!tenant) return;
    setError(null);
    try {
      const [w, k] = await Promise.all([listWebhooks(), listApiKeys()]);
      setWebhooks(w);
      setApiKeys(k);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [tenant]);

  useEffect(() => {
    void reload();
  }, [reload]);

  if (tenantState.status === "loading") {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Utvecklare"
          title="Integrationer"
          subtitle="Webhooks och API-nycklar för att koppla Saldo till externa system."
        />
        <SkeletonRows rows={4} className="h-10" />
      </div>
    );
  }

  if (tenantState.status !== "ready" || !tenant) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Utvecklare"
          title="Integrationer"
          subtitle="Webhooks och API-nycklar för att koppla Saldo till externa system."
        />
        <ErrorPage
          title="Ingen tenant"
          message="Hittar inte din portal. Kontrollera att du loggat in på rätt portal eller be en admin lägga till dig."
        />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Utvecklare"
        title="Integrationer"
        subtitle="Webhooks och API-nycklar för att koppla Saldo till externa system."
      />

      {error ? <ErrorBanner>{error}</ErrorBanner> : null}

      <WebhooksSection
        tenantId={tenant.id}
        webhooks={webhooks}
        onReload={reload}
        onError={setError}
      />

      <ApiKeysSection
        tenantId={tenant.id}
        apiKeys={apiKeys}
        onReload={reload}
        onError={setError}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

function WebhooksSection({
  tenantId,
  webhooks,
  onReload,
  onError,
}: {
  tenantId: string;
  webhooks: Webhook[] | null;
  onReload: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const urlValid = url.length === 0 || isValidHttpsUrl(url);

  function toggleEvent(evt: string) {
    setEvents((cur) =>
      cur.includes(evt) ? cur.filter((e) => e !== evt) : [...cur, evt],
    );
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!isValidHttpsUrl(url)) {
      setFormError("Webhook-URL måste börja med https://");
      return;
    }
    if (events.length === 0) {
      setFormError("Välj minst en händelse.");
      return;
    }
    setBusy(true);
    try {
      await createWebhook({ tenant_id: tenantId, url: url.trim(), events });
      setUrl("");
      setEvents([]);
      setCreating(false);
      await onReload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(w: Webhook) {
    onError(null);
    try {
      await setWebhookActive(w.id, !w.active);
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(w: Webhook) {
    if (!confirm(`Ta bort webhook till ${w.url}?`)) return;
    onError(null);
    try {
      await deleteWebhook(w.id);
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Webhooks</h2>
          <p className="text-sm text-foreground-muted mt-0.5">
            Få realtidsnotiser till externa system när något händer i Saldo.
          </p>
        </div>
        {!creating ? (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setFormError(null);
            }}
            className={buttonClasses("primary", "sm")}
          >
            Skapa webhook
          </button>
        ) : null}
      </div>

      {creating ? (
        <Card variant="elevated">
          <CardHeader title="Ny webhook" />
          <form onSubmit={handleCreate} className="px-5 sm:px-6 py-5 space-y-5">
            {formError ? <ErrorBanner>{formError}</ErrorBanner> : null}
            <div>
              <label htmlFor="webhook-url" className={labelClass}>
                URL
              </label>
              <input
                id="webhook-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://hooks.exempel.se/saldo"
                className={inputClass}
                aria-invalid={!urlValid}
              />
              <p className={fieldHintClass}>
                {url.length > 0 && !urlValid
                  ? "URL måste börja med https://"
                  : "Måste vara en giltig HTTPS-URL."}
              </p>
            </div>
            <div>
              <span className={labelClass}>Händelser</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-white/10 bg-background-elevated/40 p-3">
                {SUPPORTED_EVENT_TYPES.map((evt) => (
                  <label
                    key={evt}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={events.includes(evt)}
                      onChange={() => toggleEvent(evt)}
                      className="h-4 w-4 rounded border-white/20 bg-background-elevated text-amber-500 focus:ring-amber-500/40"
                    />
                    <code className="font-mono text-[12px] text-foreground-muted">
                      {evt}
                    </code>
                  </label>
                ))}
              </div>
              <p className={fieldHintClass}>
                {events.length} valda händelse{events.length === 1 ? "" : "r"}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setFormError(null);
                  setUrl("");
                  setEvents([]);
                }}
                className={buttonClasses("ghost", "sm")}
                disabled={busy}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={busy || !urlValid || events.length === 0}
                className={buttonClasses("primary", "sm")}
              >
                {busy ? "Skapar…" : "Skapa webhook"}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {webhooks === null ? (
        <SkeletonRows rows={3} className="h-24" />
      ) : webhooks.length === 0 ? (
        <EmptyState
          title="Inga webhooks än"
          description="Inga webhooks än — koppla Saldo till Slack, Zapier, eller eget BI."
          action={
            !creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={buttonClasses("primary", "sm")}
              >
                Skapa webhook
              </button>
            ) : null
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {webhooks.map((w) => (
            <WebhookCard
              key={w.id}
              webhook={w}
              onToggleActive={() => handleToggleActive(w)}
              onDelete={() => handleDelete(w)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function WebhookCard({
  webhook,
  onToggleActive,
  onDelete,
}: {
  webhook: Webhook;
  onToggleActive: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
}) {
  const [showSecret, setShowSecret] = useState(false);
  const [showDeliveries, setShowDeliveries] = useState(false);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [deliveriesError, setDeliveriesError] = useState<string | null>(null);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const failing = webhook.failure_streak > 3;

  async function loadDeliveries() {
    setLoadingDeliveries(true);
    setDeliveriesError(null);
    try {
      const list = await listWebhookDeliveries(webhook.id, 50);
      setDeliveries(list);
    } catch (e) {
      setDeliveriesError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoadingDeliveries(false);
    }
  }

  function toggleDeliveries() {
    const next = !showDeliveries;
    setShowDeliveries(next);
    if (next && deliveries === null && !loadingDeliveries) {
      void loadDeliveries();
    }
  }

  return (
    <Card
      className={
        failing
          ? "ring-1 ring-red-400/40 ring-offset-0"
          : ""
      }
    >
      <div className="flex flex-col gap-4 px-5 sm:px-6 py-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            {webhook.active ? (
              <StatusPill tone="ok" size="sm">
                Aktiv
              </StatusPill>
            ) : (
              <StatusPill tone="muted" size="sm">
                Pausad
              </StatusPill>
            )}
            {failing ? (
              <StatusPill tone="error" size="sm">
                {webhook.failure_streak} misslyckanden i rad
              </StatusPill>
            ) : null}
          </div>
          <p
            className="font-mono text-sm text-foreground break-all"
            title={webhook.url}
          >
            {webhook.url}
          </p>
          <div className="flex items-center gap-1.5 flex-wrap">
            {webhook.events.map((e) => (
              <StatusPill key={e} tone="info" size="sm">
                {e}
              </StatusPill>
            ))}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-xs text-foreground-muted tabular-nums">
            <span>
              Senaste leverans:{" "}
              <span className="text-foreground/80">
                {formatDate(webhook.last_delivery_at)}
              </span>
            </span>
            {webhook.last_status != null ? (
              <StatusPill
                tone={statusCodeTone(webhook.last_status)}
                size="sm"
              >
                {webhook.last_status}
              </StatusPill>
            ) : null}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowSecret((s) => !s)}
              className={buttonClasses("ghost", "sm")}
            >
              {showSecret ? "Dölj hemlighet" : "Visa hemlighet"}
            </button>
            {showSecret ? (
              <code className="font-mono text-[12px] bg-white/[0.04] border border-white/10 rounded-md px-2 py-1 break-all">
                {webhook.secret}
              </code>
            ) : null}
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-start gap-2 shrink-0">
          <button
            type="button"
            onClick={toggleDeliveries}
            className={buttonClasses("secondary", "sm")}
            aria-expanded={showDeliveries}
          >
            {showDeliveries ? "Dölj leveranser" : "Visa leveranser"}
          </button>
          <button
            type="button"
            onClick={onToggleActive}
            className={buttonClasses("secondary", "sm")}
          >
            {webhook.active ? "Pausa" : "Aktivera"}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={buttonClasses("danger", "sm")}
          >
            Ta bort
          </button>
        </div>
      </div>

      {showDeliveries ? (
        <div className="border-t border-white/5 bg-white/[0.015]">
          {deliveriesError ? (
            <div className="px-5 sm:px-6 py-4">
              <ErrorBanner>{deliveriesError}</ErrorBanner>
            </div>
          ) : loadingDeliveries || deliveries === null ? (
            <div className="px-5 sm:px-6 py-4">
              <SkeletonRows rows={3} className="h-6" />
            </div>
          ) : deliveries.length === 0 ? (
            <p className="px-5 sm:px-6 py-6 text-sm text-foreground-muted text-center">
              Inga leveranser än för denna webhook.
            </p>
          ) : (
            <DataTable>
              <TableHead>
                <Th>Status</Th>
                <Th>Händelse</Th>
                <Th align="right">Försök</Th>
                <Th align="right">Statuskod</Th>
                <Th>Skapad</Th>
              </TableHead>
              <TBody>
                {deliveries.map((d) => (
                  <Tr key={d.id}>
                    <Td>
                      <StatusPill tone={deliveryStatusTone(d.status)} size="sm">
                        {d.status}
                      </StatusPill>
                    </Td>
                    <Td>
                      <code className="font-mono text-[12px] text-foreground-muted">
                        {d.event_type}
                      </code>
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {d.attempts}
                    </Td>
                    <Td align="right" className="tabular-nums">
                      {d.last_status_code != null ? (
                        <StatusPill
                          tone={statusCodeTone(d.last_status_code)}
                          size="sm"
                        >
                          {d.last_status_code}
                        </StatusPill>
                      ) : (
                        <span className="text-foreground-muted">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-muted tabular-nums">
                      {formatDate(d.created_at)}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </DataTable>
          )}
        </div>
      ) : null}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// API keys
// ---------------------------------------------------------------------------

function ApiKeysSection({
  tenantId,
  apiKeys,
  onReload,
  onError,
}: {
  tenantId: string;
  apiKeys: ApiKey[] | null;
  onReload: () => Promise<void>;
  onError: (msg: string | null) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [scopes, setScopes] = useState<string[]>([]);
  const [ttl, setTtl] = useState<TtlOption>("never");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);

  function toggleScope(scope: string) {
    setScopes((cur) =>
      cur.includes(scope) ? cur.filter((s) => s !== scope) : [...cur, scope],
    );
  }

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Namn krävs.");
      return;
    }
    if (scopes.length === 0) {
      setFormError("Välj minst en scope.");
      return;
    }
    setBusy(true);
    try {
      const ttlOpt = TTL_OPTIONS.find((t) => t.value === ttl);
      const created = await createApiKey({
        tenantId,
        name: name.trim(),
        scopes,
        ttlDays: ttlOpt?.days ?? null,
      });
      setCreatedKey(created);
      setName("");
      setScopes([]);
      setTtl("never");
      setCreating(false);
      await onReload();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRevoke(key: ApiKey) {
    if (!confirm(`Återkalla nyckeln "${key.name}"?`)) return;
    onError(null);
    try {
      await revokeApiKey(key.id);
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(key: ApiKey) {
    if (!confirm(`Ta bort nyckeln "${key.name}" permanent?`)) return;
    onError(null);
    try {
      await deleteApiKey(key.id);
      await onReload();
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">API-nycklar</h2>
          <p className="text-sm text-foreground-muted mt-0.5">
            Skapa nycklar för att komma åt Saldos publika API.
          </p>
        </div>
        {!creating ? (
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setFormError(null);
            }}
            className={buttonClasses("primary", "sm")}
          >
            Skapa API-nyckel
          </button>
        ) : null}
      </div>

      {creating ? (
        <Card variant="elevated">
          <CardHeader title="Ny API-nyckel" />
          <form
            onSubmit={handleCreate}
            className="px-5 sm:px-6 py-5 space-y-5"
          >
            {formError ? <ErrorBanner>{formError}</ErrorBanner> : null}
            <div>
              <label htmlFor="api-key-name" className={labelClass}>
                Namn
              </label>
              <input
                id="api-key-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="t.ex. Zapier produktion"
                className={inputClass}
              />
              <p className={fieldHintClass}>
                Ett beskrivande namn så att du senare vet vad nyckeln används
                till.
              </p>
            </div>
            <div>
              <span className={labelClass}>Scopes</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-md border border-white/10 bg-background-elevated/40 p-3">
                {AVAILABLE_SCOPES.map((s) => (
                  <label
                    key={s.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={scopes.includes(s.id)}
                      onChange={() => toggleScope(s.id)}
                      className="h-4 w-4 rounded border-white/20 bg-background-elevated text-amber-500 focus:ring-amber-500/40"
                    />
                    <span>{s.label}</span>
                    <code className="ml-auto font-mono text-[11px] text-foreground-muted">
                      {s.id}
                    </code>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="api-key-ttl" className={labelClass}>
                Giltighetstid
              </label>
              <select
                id="api-key-ttl"
                value={ttl}
                onChange={(e) => setTtl(e.target.value as TtlOption)}
                className={inputClass}
              >
                {TTL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setFormError(null);
                  setName("");
                  setScopes([]);
                  setTtl("never");
                }}
                className={buttonClasses("ghost", "sm")}
                disabled={busy}
              >
                Avbryt
              </button>
              <button
                type="submit"
                disabled={busy || !name.trim() || scopes.length === 0}
                className={buttonClasses("primary", "sm")}
              >
                {busy ? "Skapar…" : "Skapa nyckel"}
              </button>
            </div>
          </form>
        </Card>
      ) : null}

      {apiKeys === null ? (
        <SkeletonRows rows={3} className="h-12" />
      ) : apiKeys.length === 0 ? (
        <EmptyState
          title="Inga API-nycklar än"
          description="Inga API-nycklar än — skapa en för att komma åt Saldos publika API."
          action={
            !creating ? (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className={buttonClasses("primary", "sm")}
              >
                Skapa API-nyckel
              </button>
            ) : null
          }
        />
      ) : (
        <Card>
          <DataTable>
            <TableHead>
              <Th>Namn</Th>
              <Th>Skapad</Th>
              <Th>Senast använd</Th>
              <Th>Token</Th>
              <Th>Scopes</Th>
              <Th>Status</Th>
              <Th align="right" />
            </TableHead>
            <TBody>
              {apiKeys.map((key) => {
                const status = apiKeyStatus(key);
                return (
                  <Tr key={key.id}>
                    <Td>
                      <div className="font-medium">{key.name}</div>
                      {key.expires_at ? (
                        <div className="text-[11px] text-foreground-muted">
                          Förfaller {formatDate(key.expires_at)}
                        </div>
                      ) : null}
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-muted tabular-nums">
                      {formatDate(key.created_at)}
                    </Td>
                    <Td className="whitespace-nowrap text-foreground-muted tabular-nums">
                      {formatDate(key.last_used_at)}
                    </Td>
                    <Td>
                      <code className="font-mono text-[12px] text-foreground-muted">
                        {"●●●●" + key.token_last4}
                      </code>
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1 flex-wrap">
                        {key.scopes.map((s) => (
                          <StatusPill key={s} tone="info" size="sm">
                            {s}
                          </StatusPill>
                        ))}
                      </div>
                    </Td>
                    <Td>
                      <StatusPill tone={status.tone} size="sm">
                        {status.label}
                      </StatusPill>
                    </Td>
                    <Td align="right">
                      <div className="inline-flex items-center gap-2">
                        {!key.revoked_at ? (
                          <button
                            type="button"
                            onClick={() => handleRevoke(key)}
                            className="text-amber-300 hover:underline text-sm"
                          >
                            Återkalla
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleDelete(key)}
                          className="text-red-400 hover:underline text-sm"
                        >
                          Ta bort
                        </button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </DataTable>
        </Card>
      )}

      {createdKey ? (
        <CreatedKeyModal
          createdKey={createdKey}
          onClose={() => setCreatedKey(null)}
        />
      ) : null}
    </section>
  );
}

function CreatedKeyModal({
  createdKey,
  onClose,
}: {
  createdKey: CreatedKey;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const tokenRef = useRef<HTMLInputElement>(null);

  // Lock body scroll while open and add ESC handler.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(createdKey.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable; fall back to selection.
      tokenRef.current?.select();
    }
  }

  function selectAll() {
    tokenRef.current?.select();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="created-key-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-amber-400/40 bg-background-elevated/95 shadow-2xl"
      >
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300 font-medium">
            Spara nu
          </p>
          <h2
            id="created-key-title"
            className="text-lg font-semibold tracking-tight mt-1"
          >
            Din nya API-nyckel
          </h2>
          <p className="text-sm text-foreground-muted mt-1.5">
            Den här token visas bara här — du kan inte se den igen efter att du
            stänger fönstret.
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label
              htmlFor="created-key-token"
              className={labelClass}
            >
              Token
            </label>
            <input
              ref={tokenRef}
              id="created-key-token"
              type="text"
              readOnly
              value={createdKey.token}
              onClick={selectAll}
              onFocus={selectAll}
              className={`${inputClass} font-mono text-xs`}
            />
            <p className={fieldHintClass}>
              Klicka på fältet för att markera hela token.
            </p>
          </div>
          <div className="rounded-md border border-amber-400/30 bg-amber-500/[0.06] p-3 text-sm text-amber-200">
            Spara nu — du kan inte se den igen.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={buttonClasses("ghost", "sm")}
          >
            Stäng
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className={buttonClasses("primary", "sm")}
          >
            {copied ? "Kopierad!" : "Kopiera token"}
          </button>
        </div>
      </div>
    </div>
  );
}
