"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, signIn } from "@/lib/auth";
import { acceptPendingCustomerInvitations } from "@/lib/portal";
import { createClient } from "@/lib/supabase/client";
import { SaldoMark } from "@/app/_brand/Logo";
import { ErrorBanner } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

const supabase = createClient();

export default function PortalLoginPage() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;

  const [mode, setMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentSession().then(async (session) => {
      if (!session || !active) return;
      await acceptPendingCustomerInvitations();
      if (active) router.replace(`/${tenant}/portal/`);
    });
    return () => {
      active = false;
    };
  }, [router, tenant]);

  async function handleMagicLink(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      const redirectTo = `${window.location.origin}/${tenant}/portal/login/`;
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false, emailRedirectTo: redirectTo },
      });
      if (otpError) throw new Error(otpError.message);
      setInfo(
        `Vi har skickat en inloggningslänk till ${email}. Kolla inkorgen — och spam-mappen.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handlePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      await acceptPendingCustomerInvitations();
      router.replace(`/${tenant}/portal/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background flex flex-col">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full opacity-20 blur-3xl animate-ambient"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[24rem] w-[24rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
      </div>

      <div className="relative flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group mb-10"
            aria-label="Saldo startsida"
          >
            <SaldoMark className="h-8 w-8 transition-transform duration-300 group-hover:rotate-3" />
            <span className="font-semibold text-xl tracking-tight">Saldo</span>
          </Link>

          <div className="rounded-2xl border border-white/10 bg-background-elevated/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-foreground-muted">
                Kundportal · {tenant}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                Logga in
              </h1>
              <p className="mt-1.5 text-sm text-foreground-muted">
                Beställ direkt från din leverantör.
              </p>
            </div>

            <div className="flex gap-1 rounded-md bg-background/60 p-1">
              <button
                type="button"
                onClick={() => setMode("magic")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "magic"
                    ? "bg-foreground text-background"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Magisk länk
              </button>
              <button
                type="button"
                onClick={() => setMode("password")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  mode === "password"
                    ? "bg-foreground text-background"
                    : "text-foreground-muted hover:text-foreground"
                }`}
              >
                Lösenord
              </button>
            </div>

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

            {mode === "magic" ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className={labelClass}>
                    E-post
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="namn@dittforetag.se"
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy ? "Skickar…" : "Skicka inloggningslänk"}
                </button>
                <p className="text-[11px] text-center text-foreground-muted">
                  Vi mejlar dig en länk — inget lösenord behövs.
                </p>
              </form>
            ) : (
              <form onSubmit={handlePassword} className="space-y-4">
                <div>
                  <label htmlFor="email-pwd" className={labelClass}>
                    E-post
                  </label>
                  <input
                    id="email-pwd"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="pwd" className={labelClass}>
                    Lösenord
                  </label>
                  <input
                    id="pwd"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60"
                >
                  {busy ? "Loggar in…" : "Logga in"}
                </button>
              </form>
            )}

            <p className="text-[11px] text-center text-foreground-muted">
              Saknar du konto? Be din inköpsansvarige skicka en inbjudan.
            </p>
          </div>

          <p className="mt-6 text-center text-xs text-foreground-muted">
            <Link
              href="/"
              className="hover:text-foreground hover:underline underline-offset-2"
            >
              ← Saldo.se
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
