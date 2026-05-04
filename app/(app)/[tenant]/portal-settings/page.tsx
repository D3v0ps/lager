"use client";

import { useCallback, useEffect, useState } from "react";

import { listCustomers, type Customer } from "@/lib/orders";
import {
  inviteCustomerContact,
  listCustomerContacts,
  listPendingCustomerInvitations,
  removeCustomerContact,
  revokeCustomerInvitation,
  sendCustomerMagicLink,
  setPortalEnabled,
  type CustomerContact,
  type PendingCustomerInvitation,
} from "@/lib/customer-portal";
import { useTenantState, useTenantRefresh } from "@/lib/tenant-context";
import { formatDate } from "@/lib/format";
import {
  Card,
  CardHeader,
  DataTable,
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
import { inputClass, labelClass } from "@/lib/form-classes";
import { roleLabel } from "@/lib/roles";

const ROLES: ("admin" | "orderer")[] = ["admin", "orderer"];

export default function PortalSettingsPage() {
  const tenantState = useTenantState();
  const refreshTenant = useTenantRefresh();
  // The new b2b_portal_enabled / portal_welcome_text columns aren't in the
  // generated tenant types yet; cast through a structural type.
  const tenant = tenantState.tenant as
    | (typeof tenantState.tenant & {
        b2b_portal_enabled?: boolean;
        portal_welcome_text?: string | null;
      })
    | null;

  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingToggle, setSavingToggle] = useState(false);
  const [welcomeText, setWelcomeText] = useState("");
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    setWelcomeText(tenant?.portal_welcome_text ?? "");
  }, [tenant]);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const list = await listCustomers();
      setCustomers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleToggle(enabled: boolean) {
    if (!tenant) return;
    setSavingToggle(true);
    setInfo(null);
    setError(null);
    try {
      await setPortalEnabled(tenant.id, enabled, welcomeText.trim() || null);
      await refreshTenant();
      setInfo(enabled ? "Portalen är PÅ." : "Portalen är AV.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingToggle(false);
    }
  }

  async function saveWelcomeText() {
    if (!tenant) return;
    setSavingToggle(true);
    setInfo(null);
    setError(null);
    try {
      await setPortalEnabled(
        tenant.id,
        !!tenant.b2b_portal_enabled,
        welcomeText.trim() || null,
      );
      await refreshTenant();
      setInfo("Välkomsttexten sparad.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingToggle(false);
    }
  }

  if (error) {
    return (
      <ErrorPage
        title="Kunde inte ladda portal-inställningar"
        message={error}
        retry={reload}
      />
    );
  }

  const enabled = !!tenant?.b2b_portal_enabled;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Saldo Portal"
        title="Kundportal"
        subtitle="Låt dina kunder logga in och beställa direkt — utan mejlpingis."
      />

      {info && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
        >
          {info}
        </div>
      )}

      <Card variant="elevated">
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Aktivera portalen</h3>
              <StatusPill tone={enabled ? "ok" : "muted"} size="sm">
                {enabled ? "På" : "Av"}
              </StatusPill>
            </div>
            <p className="mt-1.5 text-sm text-foreground-muted max-w-xl">
              När portalen är på kan inbjudna kontakter på dina kunder logga
              in på{" "}
              <code className="font-mono text-xs">
                /{tenant?.slug}/portal/
              </code>{" "}
              och beställa från din katalog. Order skapas som utkast i din
              vanliga ordervy.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(!enabled)}
            disabled={savingToggle}
            className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
              enabled
                ? "border border-white/15 hover:bg-white/[0.05]"
                : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {enabled ? "Stäng av portalen" : "Slå på portalen"}
          </button>
        </div>
        <div className="border-t border-white/5 px-6 py-5 space-y-3">
          <label htmlFor="welcome" className={labelClass}>
            Välkomsttext (visas högst upp i kundens katalog)
          </label>
          <textarea
            id="welcome"
            value={welcomeText}
            onChange={(e) => setWelcomeText(e.target.value)}
            rows={3}
            placeholder="Hej! Här hittar ni hela vårt sortiment med era avtalspriser. Hör av er om ni saknar något."
            className={inputClass}
          />
          <button
            type="button"
            onClick={saveWelcomeText}
            disabled={savingToggle}
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/[0.05] disabled:opacity-50"
          >
            Spara välkomsttext
          </button>
        </div>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Kundkontakter</h2>
        <p className="text-sm text-foreground-muted">
          Bjud in en kontakt per kund. De får en magisk länk och hamnar
          automatiskt i deras kund-konto.
        </p>
        {customers === null ? (
          <SkeletonRows rows={3} className="h-32" />
        ) : customers.length === 0 ? (
          <Card>
            <p className="px-5 py-8 text-sm text-foreground-muted text-center">
              Du har inga kunder än. Lägg till kunder under{" "}
              <code className="font-mono">/kunder/</code>.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {customers.map((c) => (
              <CustomerContactsCard
                key={c.id}
                customer={c}
                tenantSlug={tenant?.slug}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CustomerContactsCard({
  customer,
  tenantSlug,
}: {
  customer: Customer;
  tenantSlug: string | undefined;
}) {
  const [contacts, setContacts] = useState<CustomerContact[] | null>(null);
  const [pending, setPending] = useState<PendingCustomerInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "orderer">("orderer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [c, p] = await Promise.all([
        listCustomerContacts(customer.id),
        listPendingCustomerInvitations(customer.id),
      ]);
      setContacts(c);
      setPending(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [customer.id]);

  useEffect(() => {
    if (open) void reload();
  }, [open, reload]);

  async function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantSlug) return;
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await inviteCustomerContact(customer.id, email.trim(), role);
      await sendCustomerMagicLink(
        email.trim(),
        `${window.location.origin}/${tenantSlug}/portal/login/`,
      );
      setEmail("");
      setInfo(`Inbjudan skickad till ${email}.`);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-white/[0.02] transition-colors text-left"
      >
        <div className="min-w-0">
          <p className="font-medium truncate">{customer.name}</p>
          <p className="text-xs text-foreground-muted truncate">
            {customer.email ?? "Ingen e-post på kunden"}
          </p>
        </div>
        <span className="text-foreground-muted text-sm">
          {open ? "Stäng" : "Hantera kontakter"}
        </span>
      </button>
      {open && (
        <div className="border-t border-white/5 px-5 py-5 space-y-4">
          {error && <ErrorBanner>{error}</ErrorBanner>}
          {info && (
            <div
              role="status"
              aria-live="polite"
              className="rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
            >
              {info}
            </div>
          )}

          <form
            onSubmit={handleInvite}
            className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-2 items-end"
          >
            <div>
              <label
                htmlFor={`email-${customer.id}`}
                className={labelClass}
              >
                Bjud in kontakt
              </label>
              <input
                id={`email-${customer.id}`}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kontakt@kund.se"
                className={inputClass}
              />
            </div>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "admin" | "orderer")
              }
              aria-label="Roll"
              className={inputClass}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabel(r === "admin" ? "admin" : "member")}
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {busy ? "Skickar…" : "Bjud in"}
            </button>
          </form>

          {contacts !== null && (
            <>
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground-muted">
                Aktiva kontakter ({contacts.length})
              </h4>
              {contacts.length === 0 ? (
                <p className="text-sm text-foreground-muted">
                  Inga aktiva kontakter än.
                </p>
              ) : (
                <DataTable>
                  <TableHead>
                    <Th>E-post</Th>
                    <Th>Roll</Th>
                    <Th>Kopplad</Th>
                    <Th />
                  </TableHead>
                  <TBody>
                    {contacts.map((c) => (
                      <Tr key={c.user_id}>
                        <Td>{c.email}</Td>
                        <Td>
                          {roleLabel(c.role === "admin" ? "admin" : "member")}
                        </Td>
                        <Td>
                          <span className="text-foreground-muted">
                            {formatDate(c.created_at)}
                          </span>
                        </Td>
                        <Td align="right">
                          <button
                            type="button"
                            onClick={async () => {
                              if (!confirm(`Ta bort ${c.email}?`)) return;
                              try {
                                await removeCustomerContact(
                                  customer.id,
                                  c.user_id,
                                );
                                await reload();
                              } catch (e) {
                                setError(
                                  e instanceof Error ? e.message : String(e),
                                );
                              }
                            }}
                            className="text-rose-400 hover:underline text-xs"
                          >
                            Ta bort
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </DataTable>
              )}
            </>
          )}

          {pending.length > 0 && (
            <>
              <h4 className="text-xs uppercase tracking-[0.15em] text-foreground-muted mt-4">
                Pågående inbjudningar ({pending.length})
              </h4>
              <DataTable>
                <TableHead>
                  <Th>E-post</Th>
                  <Th>Roll</Th>
                  <Th>Skickad</Th>
                  <Th />
                </TableHead>
                <TBody>
                  {pending.map((p) => (
                    <Tr key={p.id}>
                      <Td>{p.email}</Td>
                      <Td>
                        {roleLabel(p.role === "admin" ? "admin" : "member")}
                      </Td>
                      <Td>
                        <span className="text-foreground-muted">
                          {formatDate(p.created_at)}
                        </span>
                      </Td>
                      <Td align="right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm("Återkalla inbjudan?")) return;
                            try {
                              await revokeCustomerInvitation(p.id);
                              await reload();
                            } catch (e) {
                              setError(
                                e instanceof Error ? e.message : String(e),
                              );
                            }
                          }}
                          className="text-rose-400 hover:underline text-xs"
                        >
                          Återkalla
                        </button>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </DataTable>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
