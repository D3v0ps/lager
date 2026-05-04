"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, signIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { acceptPendingInvitations } from "@/lib/team";
import {
  getVerifiedTotpFactorId,
  needsMfaChallenge,
  verifyTotp,
} from "@/lib/two-factor";
import { SaldoMark } from "@/app/_brand/Logo";
import { ErrorBanner } from "@/app/_components/ui";
import { inputClass, labelClass } from "@/lib/form-classes";

const supabase = createClient();

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSentTo, setResetSentTo] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // MFA challenge state — set after a successful password sign-in if the
  // user has a verified TOTP factor.
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaBusy, setMfaBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await getCurrentSession();
      if (!session || !active) return;
      // Magic-link / already-signed-in flow: if MFA needed, gate redirect
      // behind the challenge instead of waving them through.
      if (await needsMfaChallenge()) {
        const factorId = await getVerifiedTotpFactorId();
        if (active && factorId) {
          setMfaFactorId(factorId);
          return;
        }
      }
      await acceptPendingInvitations();
      if (active) router.replace(`/${tenant}/`);
    })();
    return () => {
      active = false;
    };
  }, [router, tenant]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await signIn(email.trim(), password);
      if (result.status === "mfa_required") {
        setMfaFactorId(result.factorId);
        setBusy(false);
        return;
      }
      await acceptPendingInvitations();
      router.replace(`/${tenant}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function handleMfaSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mfaFactorId) return;
    setMfaError(null);
    setMfaBusy(true);
    try {
      await verifyTotp(mfaFactorId, mfaCode.trim());
      await acceptPendingInvitations();
      router.replace(`/${tenant}/`);
    } catch (err) {
      setMfaError(
        err instanceof Error
          ? err.message
          : "Verifieringen misslyckades. Kontrollera koden och försök igen.",
      );
      setMfaCode("");
      setMfaBusy(false);
    }
  }

  async function handleSendReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setResetError(null);
    setResetBusy(true);
    const target = resetEmail.trim() || email.trim();
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(target, {
        redirectTo: `${window.location.origin}/${tenant}/login/`,
      });
      if (error) throw new Error(error.message);
      setResetSentTo(target);
    } catch (err) {
      setResetError(err instanceof Error ? err.message : String(err));
    } finally {
      setResetBusy(false);
    }
  }

  function openReset() {
    setResetEmail(email);
    setResetSentTo(null);
    setResetError(null);
    setShowReset(true);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Ambient brand-gradient halos in the corners */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div
          className="absolute -top-40 -left-40 h-[36rem] w-[36rem] rounded-full opacity-20 blur-3xl animate-ambient"
          style={{ background: "var(--brand-gradient)" }}
        />
        <div
          className="absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full opacity-15 blur-3xl"
          style={{ background: "var(--brand-gradient)" }}
        />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 px-4 sm:px-6 py-10 sm:py-16 items-center">
        {/* Brand panel */}
        <div className="order-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 group"
            aria-label="Saldo startsida"
          >
            <SaldoMark className="h-9 w-9 transition-transform duration-300 group-hover:rotate-3" />
            <span className="font-semibold text-2xl tracking-tight">Saldo</span>
          </Link>

          <h1 className="mt-10 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1]">
            Logga in på{" "}
            <span
              className="font-mono"
              style={{
                background: "var(--brand-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              {tenant}
            </span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-foreground-muted max-w-md leading-relaxed">
            Det operativa navet — lager, ordrar, inköp och frakt på ett ställe,
            kopplat till Fortnox.
          </p>

          <ul className="mt-10 space-y-3 text-sm text-foreground/85">
            <TrustBullet>Svensk support — riktiga människor</TrustBullet>
            <TrustBullet>Fortnox-integration ingår</TrustBullet>
            <TrustBullet>Data i EU, krypterade backuper</TrustBullet>
          </ul>
        </div>

        {/* Form panel */}
        <div className="order-2 w-full">
          <div className="mx-auto w-full max-w-md">
            {mfaFactorId ? (
              <form
                onSubmit={handleMfaSubmit}
                className="rounded-2xl border border-white/10 bg-background-elevated/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-5"
              >
                <div>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-amber-400 font-medium">
                    Tvåfaktorsautentisering
                  </p>
                  <h2 className="mt-1 text-lg font-semibold">
                    Ange koden från din authenticator
                  </h2>
                  <p className="text-sm text-foreground-muted mt-1">
                    Öppna Google Authenticator, Authy eller motsvarande och
                    skriv in den 6-siffriga koden.
                  </p>
                </div>
                {mfaError && <ErrorBanner>{mfaError}</ErrorBanner>}
                <div>
                  <label htmlFor="mfa-code" className={labelClass}>
                    6-siffrig kod
                  </label>
                  <input
                    id="mfa-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                    autoFocus
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123 456"
                    className={`${inputClass} font-mono text-center text-2xl tracking-[0.3em] tabular-nums`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={mfaBusy || mfaCode.length !== 6}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {mfaBusy && <Spinner className="h-4 w-4" />}
                  {mfaBusy ? "Verifierar…" : "Verifiera"}
                </button>
                <p className="text-xs text-center text-foreground-muted">
                  Förlorat din authenticator?{" "}
                  <a
                    href="mailto:hej@saldo.se?subject=2FA-återställning"
                    className="hover:text-foreground hover:underline underline-offset-2"
                  >
                    Kontakta supporten
                  </a>
                </p>
              </form>
            ) : (
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-white/10 bg-background-elevated/60 backdrop-blur-md p-6 sm:p-8 shadow-2xl shadow-black/40 space-y-5"
            >
              <div>
                <h2 className="text-lg font-semibold">Välkommen tillbaka</h2>
                <p className="text-sm text-foreground-muted mt-1">
                  Ange dina inloggningsuppgifter för att fortsätta.
                </p>
              </div>

              {error && <ErrorBanner>{error}</ErrorBanner>}

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
                  placeholder="namn@foretag.se"
                  className={inputClass}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-xs font-medium uppercase tracking-[0.12em] text-foreground-muted"
                  >
                    Lösenord
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-[11px] text-foreground-muted hover:text-foreground transition-colors"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Dölj" : "Visa"}
                  </button>
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={openReset}
                    className="text-xs text-foreground-muted hover:text-foreground hover:underline underline-offset-2 transition-colors"
                  >
                    Glömt lösenord?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-foreground text-background px-4 py-2.5 text-sm font-medium hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {busy && <Spinner className="h-4 w-4" />}
                {busy ? "Loggar in…" : "Logga in"}
              </button>

              <p className="text-xs text-center text-foreground-muted">
                Saknar du konto? Kontakta din administratör.
              </p>
            </form>
            )}

            {!mfaFactorId && showReset && (
              <div
                role="dialog"
                aria-label="Återställ lösenord"
                className="mt-4 rounded-2xl border border-white/10 bg-background-elevated/60 backdrop-blur-md p-5 sm:p-6"
              >
                {resetSentTo ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5 shrink-0 text-emerald-400"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div>
                        <h3 className="text-sm font-semibold">Mejl skickat</h3>
                        <p className="text-sm text-foreground-muted mt-1">
                          Vi har skickat en återställningslänk till{" "}
                          <span className="font-medium text-foreground">
                            {resetSentTo}
                          </span>
                          . Kolla inkorgen — och spam-mappen.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="text-xs text-foreground-muted hover:text-foreground hover:underline"
                    >
                      Stäng
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSendReset} className="space-y-3">
                    <div>
                      <h3 className="text-sm font-semibold">
                        Få en återställningslänk via mejl
                      </h3>
                      <p className="text-xs text-foreground-muted mt-1">
                        Vi skickar en länk till din e-post.
                      </p>
                    </div>
                    {resetError && <ErrorBanner>{resetError}</ErrorBanner>}
                    <div>
                      <label htmlFor="reset-email" className={labelClass}>
                        E-post
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="namn@foretag.se"
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={resetBusy}
                        className="inline-flex items-center gap-2 rounded-md bg-foreground text-background px-3 py-2 text-xs font-medium hover:bg-foreground/90 disabled:opacity-60 transition-colors"
                      >
                        {resetBusy && <Spinner className="h-3.5 w-3.5" />}
                        {resetBusy ? "Skickar…" : "Skicka länk"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReset(false)}
                        className="text-xs text-foreground-muted hover:text-foreground"
                      >
                        Avbryt
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <p className="mt-6 text-center text-xs text-foreground-muted">
              <Link
                href="/"
                className="hover:text-foreground hover:underline underline-offset-2 transition-colors"
              >
                ← Saldo.se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`motion-safe:animate-spin ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrustBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3 w-3"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M16.704 5.296a1 1 0 0 1 0 1.408l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L8.5 12.086l6.793-6.79a1 1 0 0 1 1.411 0Z"
            clipRule="evenodd"
          />
        </svg>
      </span>
      <span>{children}</span>
    </li>
  );
}
