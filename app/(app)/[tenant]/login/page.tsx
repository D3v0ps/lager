"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, signIn } from "@/lib/auth";
import { acceptPendingInvitations } from "@/lib/team";

export default function LoginPage() {
  const router = useRouter();
  const params = useParams<{ tenant: string }>();
  const tenant = params.tenant;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="font-semibold text-2xl">
            Saldo
          </Link>
          <p className="mt-2 text-sm text-neutral-500">Logga in på {tenant}</p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6"
        >
          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800 p-3 text-sm">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              E-post
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-1"
            >
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {busy ? "Loggar in…" : "Logga in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-center text-neutral-500">
          Saknar du konto? Kontakta din administratör.
        </p>
      </div>
    </div>
  );
}
