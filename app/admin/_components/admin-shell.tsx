"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import { isCurrentUserAdmin } from "@/lib/admin";

type Status = "loading" | "anonymous" | "non-admin" | "admin";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");

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
        <p className="text-sm text-neutral-500">Laddar…</p>
      </div>
    );
  }

  if (status === "anonymous") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold mb-2">Admin</h1>
          <p className="text-sm text-neutral-500 mb-4">
            Logga in som admin på en kund-portal för att komma åt admin-vyn.
          </p>
          <Link
            href="/demo/login/"
            className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2 text-sm"
          >
            Till login
          </Link>
        </div>
      </div>
    );
  }

  if (status === "non-admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold mb-2">Åtkomst nekad</h1>
          <p className="text-sm text-neutral-500">
            Ditt konto har inte admin-roll.
          </p>
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
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/admin/" className="font-semibold text-lg">
            Saldo <span className="text-neutral-400 font-normal text-sm">admin</span>
          </Link>
          <nav className="flex gap-4 text-sm items-center">
            <Link href="/admin/" className="hover:underline">
              Kunder
            </Link>
            <Link href="/" className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white">
              Till sajten
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
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
