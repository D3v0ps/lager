"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, signIn } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { acceptPendingInvitations } from "@/lib/team";

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

  // Magic-link redirects land here already authenticated. Apply any pending
  // invitations and bounce into the app.
  useEffect(() => {
    let active = true;
    getCurrentSession().then(async (session) => {
      if (!session || !active) return;
      await acceptPendingInvitations();
      if (active) router.replace(`/${tenant}/`);
    });
    return () => {
      active = false;
    };
  }, [router, tenant]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      await acceptPendingInvitations();
      router.replace(`/${tenant}/`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
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
    <div className="relative min-h-screen overflow-hidden">
      {/* Soft gradient background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 via-white to-amber-50/40 dark:from-neutral-950 dark:via-neutral-950 dark:to-blue-950/20" />
        <div
          className="absolute -top-32 -left-32 h-[28rem] w-[28rem] rounded-full bg-gradient-to-tr from-amber-200/40 to-blue-300/30 blur-3xl dark:from-amber-500/10 dark:to-blue-600/10"
        />
        <div
          className="absolute -bottom-40 -right-32 h-[32rem] w-[32rem] rounded-full bg-gradient-to-tr from-emerald-200/30 to-amber-200/30 blur-3xl dark:from-emerald-500/10 dark:to-amber-500/10"
        />
      </div>

      <div className="mx-auto grid min-h-screen max-w-6xl grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 px-4 sm:px-6 py-10 sm:py-16 items-center">
        {/* Brand panel */}
        <div className="order-1 lg:order-1">
          <Link
            href="/"
            className="inline-flex items-center gap-2 group"
            aria-label="Saldo startsida"
          >
            <SaldoMark className="h-9 w-9" />
            <span className="font-semibold text-2xl tracking-tight">
              Saldo
            </span>
          </Link>

          <h1 className="mt-8 text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-neutral-950 dark:text-white">
            Logga in på{" "}
            <span className="font-mono text-neutral-500 dark:text-neutral-400">
              {tenant}
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-md">
            Det operativa navet — lager, ordrar, inköp och frakt på ett ställe,
            kopplat till Fortnox.
          </p>

          <ul className="mt-8 space-y-3 text-sm text-neutral-700 dark:text-neutral-300">
            <TrustBullet>Svensk support — riktiga människor</TrustBullet>
            <TrustBullet>Fortnox-integration ingår</TrustBullet>
            <TrustBullet>Bygg datasäkert i Sverige</TrustBullet>
          </ul>
        </div>

        {/* Form panel */}
        <div className="order-2 lg:order-2 w-full">
          <div className="mx-auto w-full max-w-md">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur p-6 sm:p-8 shadow-xl shadow-neutral-900/5 dark:shadow-black/20 space-y-5"
            >
              <div>
                <h2 className="text-lg font-semibold">Välkommen tillbaka</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Ange dina inloggningsuppgifter för att fortsätta.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="flex gap-2 rounded-lg border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-800 dark:text-red-200"
                >
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5 shrink-0 text-red-500 dark:text-red-400"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-8-5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0v-4.5A.75.75 0 0 1 10 5Zm0 10a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300"
                >
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
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-neutral-700 dark:text-neutral-300"
                  >
                    Lösenord
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? "Dölj" : "Visa lösenord"}
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
                  className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                />
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={openReset}
                    className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-2 transition-colors"
                  >
                    Glömt lösenord?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={busy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2.5 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {busy && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4 motion-safe:animate-spin"
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
                )}
                {busy ? "Loggar in…" : "Logga in"}
              </button>

              <p className="text-xs text-center text-neutral-500">
                Saknar du konto? Kontakta din administratör.
              </p>
            </form>

            {/* Reset password drawer */}
            {showReset && (
              <div
                role="dialog"
                aria-label="Återställ lösenord"
                className="mt-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur p-5 sm:p-6"
              >
                {resetSentTo ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-5 w-5 shrink-0 text-emerald-500"
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
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                          Vi har skickat en återställningslänk till{" "}
                          <span className="font-medium text-neutral-900 dark:text-neutral-100">
                            {resetSentTo}
                          </span>
                          . Kolla inkorgen — och spam-mappen.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowReset(false)}
                      className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:underline"
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
                      <p className="text-xs text-neutral-500 mt-1">
                        Vi skickar en länk till din e-post.
                      </p>
                    </div>
                    {resetError && (
                      <div
                        role="alert"
                        className="rounded-md border border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-2.5 text-xs text-red-800 dark:text-red-200"
                      >
                        {resetError}
                      </div>
                    )}
                    <div>
                      <label
                        htmlFor="reset-email"
                        className="block text-xs font-medium mb-1 text-neutral-700 dark:text-neutral-300"
                      >
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
                        className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-950 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/15 dark:focus:ring-white/20 focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={resetBusy}
                        className="inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-3 py-2 text-xs font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-60 transition-colors"
                      >
                        {resetBusy && (
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            className="h-3.5 w-3.5 motion-safe:animate-spin"
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
                        )}
                        {resetBusy ? "Skickar…" : "Skicka länk"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReset(false)}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      >
                        Avbryt
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            <p className="mt-6 text-center text-xs text-neutral-500">
              <Link
                href="/"
                className="hover:text-neutral-900 dark:hover:text-white hover:underline underline-offset-2 transition-colors"
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

function TrustBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
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

function SaldoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        width="32"
        height="32"
        rx="8"
        className="fill-neutral-900 dark:fill-white"
      />
      <path
        d="M8 11.5 16 7l8 4.5v9L16 25l-8-4.5v-9Z"
        className="stroke-white dark:stroke-neutral-900"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M8 11.5 16 16m0 0 8-4.5M16 16v9"
        className="stroke-white dark:stroke-neutral-900"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
