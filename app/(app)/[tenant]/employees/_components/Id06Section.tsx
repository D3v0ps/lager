"use client";

import { useMemo, useState } from "react";

import {
  setEmployeeId06,
  verifyId06Card,
  type EmployeeWithId06,
} from "@/lib/id06";
import {
  Card,
  CardHeader,
  ErrorBanner,
  StatusPill,
  buttonClasses,
} from "@/app/_components/ui";
import { fieldHintClass, inputClass, labelClass } from "@/lib/form-classes";
import { formatDateOnly } from "@/lib/format";

type Props = {
  employee: EmployeeWithId06;
  onSaved?: () => void | Promise<void>;
};

type Tone = "ok" | "warning" | "error" | "muted";

function expiryTone(validUntil: string | null): Tone {
  if (!validUntil) return "muted";
  const now = new Date();
  const exp = new Date(validUntil);
  const diffDays = Math.floor(
    (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays < 0) return "error";
  if (diffDays < 30) return "warning";
  return "ok";
}

function statusTone(
  validUntil: string | null,
  verifiedAt: string | null,
): Tone {
  const exp = expiryTone(validUntil);
  if (exp === "error") return "error";
  if (!verifiedAt) return "warning";
  return exp;
}

function statusLabel(
  validUntil: string | null,
  verifiedAt: string | null,
): string {
  const tone = statusTone(validUntil, verifiedAt);
  if (tone === "error") return "Kortet har gått ut";
  if (tone === "muted") return "Inget kort registrerat";
  if (tone === "warning") {
    if (!verifiedAt) return "Ej verifierat";
    return "Snart utgånget";
  }
  return "Giltigt & verifierat";
}

export default function Id06Section({ employee, onSaved }: Props) {
  const [cardNumber, setCardNumber] = useState(
    employee.id06_card_number ?? "",
  );
  const [validUntil, setValidUntil] = useState(
    employee.id06_valid_until ?? "",
  );
  const [lastFour, setLastFour] = useState(
    employee.personnummer_last_four ?? "",
  );
  const [verifiedAt, setVerifiedAt] = useState(employee.id06_verified_at);
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<
    | { tone: "ok" | "error"; message: string }
    | null
  >(null);

  const tone = useMemo(
    () => statusTone(validUntil || null, verifiedAt),
    [validUntil, verifiedAt],
  );
  const label = useMemo(
    () => statusLabel(validUntil || null, verifiedAt),
    [validUntil, verifiedAt],
  );

  const lastFourValid = lastFour === "" || /^\d{4}$/.test(lastFour);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!lastFourValid) {
      setError("Personnummer måste vara exakt 4 siffror.");
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await setEmployeeId06(employee.id, {
        id06_card_number: cardNumber.trim() || null,
        id06_valid_until: validUntil || null,
        personnummer_last_four: lastFour.trim() || null,
      });
      setInfo("Sparat.");
      if (onSaved) await onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!cardNumber.trim()) {
      setVerifyResult({
        tone: "error",
        message: "Ange ett kortnummer först.",
      });
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await verifyId06Card(cardNumber.trim());
      if (result.valid) {
        const now = new Date().toISOString();
        await setEmployeeId06(employee.id, { id06_verified_at: now });
        setVerifiedAt(now);
        setVerifyResult({
          tone: "ok",
          message: "Kortet är giltigt.",
        });
        if (onSaved) await onSaved();
      } else {
        setVerifyResult({
          tone: "error",
          message: result.reason ?? "Kortet kunde inte verifieras.",
        });
      }
    } catch (e) {
      setVerifyResult({
        tone: "error",
        message: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card>
      <CardHeader
        title="ID06-kort"
        subtitle={`${employee.full_name} — kortuppgifter och verifiering.`}
        actions={<StatusPill tone={tone}>{label}</StatusPill>}
      />
      <form onSubmit={handleSave} className="px-5 sm:px-6 py-5 space-y-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`card-${employee.id}`} className={labelClass}>
              Kortnummer
            </label>
            <input
              id={`card-${employee.id}`}
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value.toUpperCase())}
              placeholder="ID06ABC12345"
              className={`${inputClass} font-mono uppercase tracking-wider`}
              autoComplete="off"
            />
            <p className={fieldHintClass}>
              8–16 tecken, bokstäver A–Z eller siffror 0–9.
            </p>
          </div>
          <div>
            <label htmlFor={`valid-${employee.id}`} className={labelClass}>
              Giltigt till
            </label>
            <input
              id={`valid-${employee.id}`}
              type="date"
              value={validUntil ?? ""}
              onChange={(e) => setValidUntil(e.target.value)}
              className={inputClass}
            />
            {validUntil ? (
              <p className={fieldHintClass}>
                {expiryTone(validUntil) === "error"
                  ? `Utgånget sedan ${formatDateOnly(validUntil)}.`
                  : expiryTone(validUntil) === "warning"
                    ? `Går ut ${formatDateOnly(validUntil)} — förnya snart.`
                    : `Giltigt till ${formatDateOnly(validUntil)}.`}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={`last4-${employee.id}`}
              className={labelClass}
            >
              Personnummer (sista 4 siffror)
            </label>
            <input
              id={`last4-${employee.id}`}
              value={lastFour}
              onChange={(e) =>
                setLastFour(e.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="0000"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              className={`${inputClass} font-mono tabular-nums`}
              aria-invalid={!lastFourValid}
            />
            {!lastFourValid && (
              <p className="mt-1.5 text-xs text-red-400">
                Måste vara exakt 4 siffror.
              </p>
            )}
          </div>
          <div className="flex items-end">
            <p className={fieldHintClass + " mt-0"}>
              {verifiedAt
                ? `Senast verifierat ${formatDateOnly(verifiedAt)}.`
                : "Kortet är inte verifierat ännu."}
            </p>
          </div>
        </div>

        {verifyResult && (
          <div
            role="status"
            aria-live="polite"
            className={
              verifyResult.tone === "ok"
                ? "rounded-md border border-emerald-400/30 bg-emerald-500/10 text-emerald-200 p-3 text-sm"
                : "rounded-md border border-red-400/30 bg-red-500/10 text-red-200 p-3 text-sm"
            }
          >
            {verifyResult.message}
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-2">
          <button
            type="submit"
            disabled={busy || !lastFourValid}
            className={buttonClasses("primary", "md")}
          >
            {busy ? "Sparar…" : "Spara"}
          </button>
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying || !cardNumber.trim()}
            className={buttonClasses("secondary", "md")}
          >
            {verifying ? "Verifierar…" : "Verifiera kort"}
          </button>
        </div>
      </form>
    </Card>
  );
}
