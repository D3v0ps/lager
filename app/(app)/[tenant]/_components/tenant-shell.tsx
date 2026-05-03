"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import { TenantProvider } from "@/lib/tenant-context";

type Status = "loading" | "anonymous" | "authenticated";

export default function TenantShell({
  tenant,
  children,
}: {
  tenant: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("loading");

  const isLoginPath =
    pathname === `/${tenant}/login` || pathname === `/${tenant}/login/`;

  useEffect(() => {
    let mounted = true;
    getCurrentSession().then((session) => {
      if (!mounted) return;
      setStatus(session ? "authenticated" : "anonymous");
    });
    const unsub = onAuthChange((signedIn) => {
      setStatus(signedIn ? "authenticated" : "anonymous");
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (status === "anonymous" && !isLoginPath) {
      router.replace(`/${tenant}/login/`);
    }
  }, [status, isLoginPath, router, tenant]);

  if (isLoginPath) {
    return (
      <div className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm text-neutral-500">Laddar…</p>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace(`/${tenant}/login/`);
  }

  return (
    <>
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between gap-4">
          <Link href={`/${tenant}/`} className="font-semibold text-lg">
            Saldo
            <span className="text-neutral-400 font-normal text-sm ml-2">
              {tenant}
            </span>
          </Link>
          <nav className="flex gap-4 text-sm items-center flex-wrap">
            <Link href={`/${tenant}/dashboard/`} className="hover:underline">
              Dashboard
            </Link>
            <Link href={`/${tenant}/`} className="hover:underline">
              Produkter
            </Link>
            <Link href={`/${tenant}/categories/`} className="hover:underline">
              Kategorier
            </Link>
            <Link href={`/${tenant}/movements/`} className="hover:underline">
              Rörelser
            </Link>
            <Link href={`/${tenant}/import/`} className="hover:underline">
              Import
            </Link>
            <Link
              href={`/${tenant}/products/new/`}
              className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5"
            >
              + Ny produkt
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
        <div className="mx-auto max-w-5xl px-4 py-8">
          <TenantProvider slug={tenant}>{children}</TenantProvider>
        </div>
      </main>
    </>
  );
}
