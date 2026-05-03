"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import { isCurrentUserAdmin, listAllTenants } from "@/lib/admin";
import { SaldoMark } from "@/app/_brand/Logo";

type Status = "loading" | "anonymous" | "non-admin" | "admin";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [tenantCount, setTenantCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function check() {
      const session = await getCurrentSession();
      if (!session) {
        if (mounted) setStatus("anonymous");
        return;
      }
      const ok = await isCurrentUserAdmin();
      if (mounted) setStatus(ok ? "admin" : "non-admin");
      if (ok) {
        try {
          const tenants = await listAllTenants();
          if (mounted) setTenantCount(tenants.length);
        } catch {
          /* ignore — header pill is purely informational */
        }
      }
    }
    void check();
    const unsub = onAuthChange(() => void check());
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
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
          Laddar…
        </div>
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <LockGlyph className="mx-auto h-28 w-28" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Admin-läge
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Logga in på en kund-portal som admin för att komma åt admin-vyn.
          </p>
          <Link
            href="/demo/login/"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
          >
            Till login
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  if (status === "non-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <DeniedGlyph className="mx-auto h-28 w-28" />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight">
            Åtkomst nekad
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Ditt konto har inte admin-roll. Be en befintlig admin om åtkomst,
            eller gå tillbaka till sajten.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            ← Till sajten
          </Link>
        </div>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace("/");
  }

  return (
    <>
      {/* Thin red top-border to signal admin mode */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-r from-red-500 via-red-600 to-red-500 dark:from-red-600 dark:via-red-500 dark:to-red-600"
      />
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/90 dark:bg-neutral-900/90 backdrop-blur sticky top-0 z-30">
        <div className="mx-auto max-w-5xl px-4 py-3.5 flex items-center justify-between gap-3">
          <Link
            href="/admin/"
            className="flex items-center gap-2 group"
            aria-label="Saldo admin startsida"
          >
            <SaldoMark className="h-7 w-7" />
            <span className="font-semibold text-base sm:text-lg tracking-tight">
              Saldo
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
              <span
                aria-hidden="true"
                className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 dark:bg-red-400 motion-safe:animate-pulse"
              />
              admin
            </span>
            {tenantCount !== null && (
              <span className="hidden sm:inline-flex items-center rounded-full border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 px-2 py-0.5 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                {tenantCount} {tenantCount === 1 ? "kund" : "kunder"}
              </span>
            )}
          </Link>
          <nav className="flex gap-1 sm:gap-3 text-sm items-center">
            <Link
              href="/admin/"
              className="rounded-md px-2.5 py-1.5 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Kunder
            </Link>
            <Link
              href="/"
              className="rounded-md px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Till sajten
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md px-2.5 py-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Logga ut
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>
    </>
  );
}

// SaldoMark is now imported from @/app/_brand/Logo at the top of the file.

function LockGlyph({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        className="fill-neutral-100 dark:fill-neutral-900"
      />
      <circle
        cx="60"
        cy="60"
        r="54"
        className="stroke-neutral-200 dark:stroke-neutral-800"
        strokeWidth="2"
      />
      <rect
        x="38"
        y="56"
        width="44"
        height="34"
        rx="6"
        className="fill-white dark:fill-neutral-800 stroke-neutral-300 dark:stroke-neutral-700"
        strokeWidth="2"
      />
      <path
        d="M48 56v-8a12 12 0 1 1 24 0v8"
        className="stroke-neutral-400 dark:stroke-neutral-500"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle
        cx="60"
        cy="71"
        r="3.5"
        className="fill-neutral-400 dark:fill-neutral-500"
      />
      <path
        d="M60 74.5v6"
        className="stroke-neutral-400 dark:stroke-neutral-500"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeniedGlyph({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="60"
        cy="60"
        r="54"
        className="fill-red-50 dark:fill-red-950/40"
      />
      <circle
        cx="60"
        cy="60"
        r="54"
        className="stroke-red-200 dark:stroke-red-900"
        strokeWidth="2"
      />
      <circle
        cx="60"
        cy="60"
        r="32"
        className="stroke-red-500 dark:stroke-red-400"
        strokeWidth="4"
      />
      <path
        d="M40 40 80 80"
        className="stroke-red-500 dark:stroke-red-400"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  );
}
