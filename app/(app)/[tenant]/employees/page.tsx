"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createEmployee,
  listEmployees,
  type Employee,
} from "@/lib/projects";
import { useTenantState } from "@/lib/tenant-context";
import {
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
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

export default function EmployeesPage() {
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trade, setTrade] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setError(null);
    try {
      setEmployees(await listEmployees());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenantData) return;
    setBusy(true);
    setError(null);
    try {
      await createEmployee({
        tenant_id: tenantData.id,
        user_id: null,
        full_name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        trade: trade.trim() || null,
        hourly_rate: hourlyRate ? Number(hourlyRate) : null,
        notes: null,
        active: true,
      });
      setName("");
      setEmail("");
      setPhone("");
      setTrade("");
      setHourlyRate("");
      setShowForm(false);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  if (error && employees === null) {
    return <ErrorPage title="Kunde inte hämta personal" message={error} retry={reload} />;
  }
  if (employees === null) {
    return (
      <div className="space-y-6">
        <PageHeader title="Personal" />
        <SkeletonRows rows={4} className="h-12" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Saldo Bygg"
        title="Personal"
        subtitle="Anställda som tidrapporterar — alla kan stämpla in/ut, även utan inloggning."
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
          >
            {showForm ? "Stäng" : "+ Ny person"}
          </button>
        }
      />

      {error && <ErrorBanner>{error}</ErrorBanner>}

      {showForm && (
        <Card variant="elevated">
          <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
            <h3 className="text-sm font-semibold">Lägg till person</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="name" className={labelClass}>
                  Fullständigt namn
                </label>
                <input
                  id="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="trade" className={labelClass}>
                  Yrke
                </label>
                <input
                  id="trade"
                  value={trade}
                  onChange={(e) => setTrade(e.target.value)}
                  placeholder="Snickare, elektriker, lärling…"
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="email" className={labelClass}>
                  E-post
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  Telefon
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="rate" className={labelClass}>
                  Timpris (kr, valfritt)
                </label>
                <input
                  id="rate"
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className={`${inputClass} tabular-nums`}
                />
                <p className={fieldHintClass}>Används bara för intern lönekostnad.</p>
              </div>
            </div>
            <div>
              <button
                type="submit"
                disabled={busy || !name.trim()}
                className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {busy ? "Sparar…" : "Lägg till"}
              </button>
            </div>
          </form>
        </Card>
      )}

      {employees.length === 0 ? (
        <EmptyState
          title="Ingen personal än"
          description="Lägg upp dina anställda så kan de tidrapportera."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium hover:bg-foreground/90"
            >
              + Ny person
            </button>
          }
        />
      ) : (
        <Card>
          <CardHeader title={`${employees.length} personer`} />
          <DataTable>
            <TableHead>
              <Th>Namn</Th>
              <Th>Yrke</Th>
              <Th>E-post</Th>
              <Th>Telefon</Th>
              <Th align="right">Timpris</Th>
              <Th>Status</Th>
            </TableHead>
            <TBody>
              {employees.map((emp) => (
                <Tr key={emp.id}>
                  <Td>{emp.full_name}</Td>
                  <Td>
                    <span className="text-foreground-muted text-xs uppercase tracking-wider">
                      {emp.trade ?? "—"}
                    </span>
                  </Td>
                  <Td>{emp.email ?? "—"}</Td>
                  <Td>
                    {emp.phone ? (
                      <a
                        href={`tel:${emp.phone}`}
                        className="hover:text-amber-400"
                      >
                        {emp.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                  </Td>
                  <Td align="right">
                    <span className="tabular-nums">
                      {emp.hourly_rate ? `${emp.hourly_rate} kr` : "—"}
                    </span>
                  </Td>
                  <Td>
                    <StatusPill tone={emp.active ? "ok" : "muted"} size="sm">
                      {emp.active ? "Aktiv" : "Inaktiv"}
                    </StatusPill>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </DataTable>
        </Card>
      )}
    </div>
  );
}
