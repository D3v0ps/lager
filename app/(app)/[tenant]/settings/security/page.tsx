"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTenantState } from "@/lib/tenant-context";

import {
  enrollTotp,
  listTotpFactors,
  unenrollTotp,
  verifyTotp,
  type TotpEnrollment,
} from "@/lib/two-factor";
import {
  Card,
  CardHeader,
  ErrorBanner,
  ErrorPage,
  PageHeader,
  SkeletonRows,
  StatusPill,
  buttonClasses,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";

type Factor = { id: string; status: string; friendlyName: string | null };

type EnrollState =
  | { phase: "idle" }
  | { phase: "enrolling"; data: TotpEnrollment }
  | { phase: "verifying"; data: TotpEnrollment }
  | { phase: "verified"; factorId: string };

function shortFactorId(id: string): string {
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}

function statusTone(status: string): "ok" | "warning" | "muted" {
  if (status === "verified") return "ok";
  if (status === "unverified") return "warning";
  return "muted";
}

function statusLabel(status: string): string {
  if (status === "verified") return "Aktiv";
  if (status === "unverified") return "Ej verifierad";
  return status;
}

export default function SecurityPage() {
  const tenantState = useTenantState();
  const tenantName = tenantState.tenant?.name ?? null;
  const [factors, setFactors] = useState<Factor[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [enroll, setEnroll] = useState<EnrollState>({ phase: "idle" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const codeInputRef = useRef<HTMLInputElement | null>(null);

  const reload = useCallback(async () => {
    setLoadError(null);
    try {
      const list = await listTotpFactors();
      setFactors(list);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // Auto-focus the code input when we transition into the verifying phase.
  useEffect(() => {
    if (enroll.phase === "verifying") {
      codeInputRef.current?.focus();
    }
  }, [enroll.phase]);

  async function handleStartEnroll() {
    setEnrollError(null);
    setBusy(true);
    try {
      // Issuer = "Saldo · Bygghandel AB" so the authenticator app shows
      // a meaningful brand+tenant heading instead of the project URL.
      const data = await enrollTotp({
        issuer: tenantName ? `Saldo · ${tenantName}` : "Saldo",
        friendlyName: tenantName ? `Saldo · ${tenantName}` : "Saldo",
      });
      setEnroll({ phase: "enrolling", data });
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function handleProceedToVerify() {
    if (enroll.phase !== "enrolling") return;
    setEnroll({ phase: "verifying", data: enroll.data });
  }

  async function handleVerify(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (enroll.phase !== "verifying") return;
    const trimmed = code.trim();
    if (trimmed.length !== 6) {
      setEnrollError("Ange en 6-siffrig kod.");
      return;
    }
    setEnrollError(null);
    setBusy(true);
    try {
      await verifyTotp(enroll.data.factorId, trimmed);
      setEnroll({ phase: "verified", factorId: enroll.data.factorId });
      setCode("");
      await reload();
    } catch (err) {
      setEnrollError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleCancelEnroll() {
    if (enroll.phase === "idle" || enroll.phase === "verified") {
      setEnroll({ phase: "idle" });
      setCode("");
      setEnrollError(null);
      return;
    }
    setBusy(true);
    try {
      await unenrollTotp(enroll.data.factorId);
    } catch {
      // ignore — best-effort cleanup
    } finally {
      setBusy(false);
      setEnroll({ phase: "idle" });
      setCode("");
      setEnrollError(null);
      void reload();
    }
  }

  async function handleCopySecret(secret: string) {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard might be denied; silently ignore
    }
  }

  async function handleUnenroll(factor: Factor) {
    const label = factor.friendlyName || shortFactorId(factor.id);
    if (
      !confirm(
        `Ta bort tvåfaktorsfaktorn "${label}"? Du kommer behöva registrera en ny innan du loggar in nästa gång.`,
      )
    ) {
      return;
    }
    try {
      await unenrollTotp(factor.id);
      await reload();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : String(e));
    }
  }

  if (loadError && !factors) {
    return (
      <div className="space-y-8">
        <PageHeader
          eyebrow="Säkerhet"
          title="Tvåfaktorsautentisering"
          subtitle="Lägg till en extra säkerhetsnivå med en 6-siffrig kod från en authenticator-app."
        />
        <ErrorPage
          title="Kunde inte ladda dina faktorer"
          message={loadError}
          retry={() => void reload()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Säkerhet"
        title="Tvåfaktorsautentisering"
        subtitle="Lägg till en extra säkerhetsnivå med en 6-siffrig kod från en authenticator-app."
      />

      {/* ------------------------------------------------------------------ */}
      {/* Existing factors                                                    */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Aktiva faktorer"
          subtitle="TOTP-koder från Google Authenticator, 1Password, Authy m.fl."
          actions={
            enroll.phase === "idle" ? (
              <button
                type="button"
                onClick={handleStartEnroll}
                disabled={busy}
                className={buttonClasses("primary", "sm")}
              >
                {busy ? "Förbereder…" : "Aktivera ny faktor"}
              </button>
            ) : null
          }
        />
        <div className="px-5 sm:px-6 py-4">
          {factors === null ? (
            <SkeletonRows rows={2} />
          ) : factors.length === 0 ? (
            <p className="text-sm text-foreground-muted">
              Du har inga registrerade faktorer än. Klicka på{" "}
              <span className="font-medium text-foreground">
                Aktivera ny faktor
              </span>{" "}
              för att komma igång.
            </p>
          ) : (
            <ul className="divide-y divide-white/5 -mx-5 sm:-mx-6">
              {factors.map((f) => {
                const isVerified = f.status === "verified";
                return (
                  <li
                    key={f.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 sm:px-6 py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium truncate">
                          {f.friendlyName || "TOTP-faktor"}
                        </span>
                        {isVerified ? (
                          <span
                            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white shadow-sm"
                            style={{ background: "var(--brand-gradient)" }}
                          >
                            Aktiverat ✓
                          </span>
                        ) : (
                          <StatusPill tone={statusTone(f.status)} size="sm">
                            {statusLabel(f.status)}
                          </StatusPill>
                        )}
                      </div>
                      <p className="mt-1 font-mono text-[11px] text-foreground-muted">
                        {shortFactorId(f.id)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleUnenroll(f)}
                      className={buttonClasses("danger", "sm")}
                    >
                      Ta bort
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {loadError && factors !== null ? (
            <div className="mt-4">
              <ErrorBanner>{loadError}</ErrorBanner>
            </div>
          ) : null}
        </div>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Enrollment flow                                                     */}
      {/* ------------------------------------------------------------------ */}
      {enroll.phase !== "idle" ? (
        <Card variant="elevated">
          <CardHeader
            title={
              enroll.phase === "verified"
                ? "Faktor aktiverad"
                : "Konfigurera ny faktor"
            }
            subtitle={
              enroll.phase === "enrolling"
                ? "Skanna QR-koden i din authenticator-app eller ange koden manuellt."
                : enroll.phase === "verifying"
                  ? "Ange den 6-siffriga koden som visas i din app för att slutföra."
                  : "Tvåfaktorsautentisering är nu aktiv på ditt konto."
            }
            actions={
              enroll.phase !== "verified" ? (
                <button
                  type="button"
                  onClick={() => void handleCancelEnroll()}
                  disabled={busy}
                  className={buttonClasses("ghost", "sm")}
                >
                  Avbryt
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setEnroll({ phase: "idle" })}
                  className={buttonClasses("secondary", "sm")}
                >
                  Stäng
                </button>
              )
            }
          />

          <div className="px-5 sm:px-6 py-6">
            {enroll.phase === "enrolling" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* QR with brand-gradient halo */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div
                      aria-hidden="true"
                      className="absolute -inset-4 rounded-3xl blur-2xl opacity-40"
                      style={{ background: "var(--brand-gradient)" }}
                    />
                    <div className="relative rounded-2xl bg-white p-4 shadow-lg">
                      {/* Supabase returns an SVG data URI; render via <img>. */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={enroll.data.qrCode}
                        alt="QR-kod för tvåfaktorsautentisering"
                        width={200}
                        height={200}
                        className="block h-[200px] w-[200px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <h3 className="text-sm font-medium">
                      1. Skanna QR-koden
                    </h3>
                    <p className={fieldHintClass}>
                      Öppna din authenticator-app (Google Authenticator,
                      1Password, Authy m.fl.) och välj <em>Lägg till konto</em>{" "}
                      → <em>Skanna QR-kod</em>.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium">
                      2. Eller ange koden manuellt
                    </h3>
                    <p className={fieldHintClass}>
                      Om du inte kan skanna QR-koden, skriv in följande kod i
                      din app:
                    </p>
                    <div className="mt-2 flex items-stretch gap-2">
                      <code className="flex-1 select-all overflow-x-auto rounded-md border border-white/10 bg-background-elevated/60 px-3 py-2 font-mono text-xs tracking-wider">
                        {enroll.data.secret}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          void handleCopySecret(enroll.data.secret)
                        }
                        className={buttonClasses("secondary", "sm")}
                      >
                        {copied ? "Kopierad!" : "Kopiera"}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleProceedToVerify}
                      className={buttonClasses("primary")}
                    >
                      Jag är klar — fortsätt
                    </button>
                  </div>

                  {enrollError ? (
                    <ErrorBanner>{enrollError}</ErrorBanner>
                  ) : null}
                </div>
              </div>
            ) : null}

            {enroll.phase === "verifying" ? (
              <form
                onSubmit={handleVerify}
                className="max-w-md mx-auto space-y-5"
              >
                <div>
                  <label htmlFor="totp-code" className={labelClass}>
                    6-siffrig kod
                  </label>
                  <input
                    ref={codeInputRef}
                    id="totp-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                    autoFocus
                    maxLength={6}
                    value={code}
                    onChange={(e) =>
                      setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="••••••"
                    className={`${inputClass} text-center text-2xl tracking-[0.5em] font-mono py-4`}
                  />
                  <p className={fieldHintClass}>
                    Hämta koden från din authenticator-app. Den uppdateras var
                    30:e sekund.
                  </p>
                </div>

                {enrollError ? (
                  <ErrorBanner>{enrollError}</ErrorBanner>
                ) : null}

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setEnroll({ phase: "enrolling", data: enroll.data })
                    }
                    disabled={busy}
                    className={buttonClasses("ghost", "sm")}
                  >
                    Tillbaka
                  </button>
                  <button
                    type="submit"
                    disabled={busy || code.length !== 6}
                    className={buttonClasses("primary")}
                  >
                    {busy ? "Verifierar…" : "Verifiera & aktivera"}
                  </button>
                </div>
              </form>
            ) : null}

            {enroll.phase === "verified" ? (
              <div className="text-center py-6">
                <div
                  aria-hidden="true"
                  className="mx-auto mb-4 h-14 w-14 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ background: "var(--brand-gradient)" }}
                >
                  ✓
                </div>
                <h3 className="text-lg font-medium">
                  Tvåfaktorsautentisering aktiv
                </h3>
                <p className="mt-1.5 text-sm text-foreground-muted max-w-md mx-auto">
                  Nästa gång du loggar in får du ange en kod från din
                  authenticator-app.
                </p>
                <p className="mt-1.5 text-[11px] font-mono text-foreground-muted">
                  Faktor-id: {shortFactorId(enroll.factorId)}
                </p>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      {/* ------------------------------------------------------------------ */}
      {/* Recovery codes (placeholder)                                        */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader
          title="Säkerhetskoder"
          subtitle="Engångskoder att använda om du tappar bort din authenticator-app."
        />
        <div className="px-5 sm:px-6 py-6">
          <p className="text-sm text-foreground-muted">
            Säkerhetskoder kommer i nästa release.
          </p>
        </div>
      </Card>
    </div>
  );
}
