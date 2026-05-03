"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import { TenantProvider } from "@/lib/tenant-context";

type Status = "loading" | "anonymous" | "authenticated";

type NavItem = { href: string; label: string };
type NavSection = { title: string; items: NavItem[] };

function buildNav(tenant: string): NavSection[] {
  return [
    {
      title: "Översikt",
      items: [
        { label: "Dashboard", href: `/${tenant}/dashboard/` },
        { label: "Rapporter", href: `/${tenant}/reports/` },
      ],
    },
    {
      title: "Lager",
      items: [
        { label: "Produkter", href: `/${tenant}/` },
        { label: "Kategorier", href: `/${tenant}/categories/` },
        { label: "Rörelser", href: `/${tenant}/movements/` },
        { label: "Scanna", href: `/${tenant}/scan/` },
      ],
    },
    {
      title: "Försäljning",
      items: [
        { label: "Ordrar", href: `/${tenant}/orders/` },
        { label: "Kunder", href: `/${tenant}/customers/` },
      ],
    },
    {
      title: "Inköp",
      items: [
        { label: "Inköpsorder", href: `/${tenant}/purchasing/` },
        { label: "Leverantörer", href: `/${tenant}/suppliers/` },
      ],
    },
    {
      title: "Övrigt",
      items: [{ label: "Import / export", href: `/${tenant}/import/` }],
    },
  ];
}

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
  const [navOpen, setNavOpen] = useState(false);

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

  // Close mobile nav on route change.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

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

  const sections = buildNav(tenant);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Topbar (mobile + desktop) */}
      <header className="lg:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href={`/${tenant}/`} className="font-semibold text-lg">
            Saldo{" "}
            <span className="text-neutral-400 font-normal text-sm">{tenant}</span>
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Öppna meny"
            className="rounded-md border border-neutral-300 dark:border-neutral-700 px-2 py-1.5 text-sm"
          >
            {navOpen ? "Stäng" : "Meny"}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          navOpen ? "block" : "hidden"
        } lg:block lg:w-60 lg:flex-shrink-0 lg:border-r border-b lg:border-b-0 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900`}
      >
        <div className="hidden lg:block px-5 py-5 border-b border-neutral-200 dark:border-neutral-800">
          <Link href={`/${tenant}/`} className="font-semibold text-lg">
            Saldo
          </Link>
          <p className="text-xs text-neutral-500 mt-0.5 font-mono">{tenant}</p>
        </div>
        <nav className="px-3 py-4 space-y-5">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2 text-[11px] font-medium uppercase tracking-wider text-neutral-500 mb-1.5">
                {section.title}
              </p>
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname === item.href.replace(/\/$/, "");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`block rounded-md px-2 py-1.5 text-sm ${
                          active
                            ? "bg-neutral-100 dark:bg-neutral-800 font-medium"
                            : "hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <Link
              href={`/${tenant}/products/new/`}
              className="block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-2 py-1.5 text-sm text-center"
            >
              + Ny produkt
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full text-left rounded-md px-2 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800/60"
            >
              Logga ut
            </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="mx-auto max-w-5xl px-4 py-8">
          <TenantProvider slug={tenant}>{children}</TenantProvider>
        </div>
      </main>
    </div>
  );
}
