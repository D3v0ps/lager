"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import { TenantProvider, useTenantState } from "@/lib/tenant-context";
import { SaldoMark } from "@/app/_brand/Logo";

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
      title: "Inställningar",
      items: [
        { label: "Inställningar", href: `/${tenant}/settings/` },
        { label: "Team", href: `/${tenant}/team/` },
        { label: "Import / export", href: `/${tenant}/import/` },
      ],
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
    getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        setStatus(session ? "authenticated" : "anonymous");
      })
      .catch((err) => {
        if (!mounted) return;
        console.warn("[tenant-shell] getCurrentSession failed:", err);
        setStatus("anonymous");
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

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (isLoginPath) {
    return (
      <div className="min-h-screen flex flex-col">
        <main id="main" className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-foreground-muted">Laddar…</p>
      </div>
    );
  }

  async function handleSignOut() {
    await signOut();
    router.replace(`/${tenant}/login/`);
  }

  return (
    <TenantProvider slug={tenant}>
      <AuthenticatedShell
        tenant={tenant}
        navOpen={navOpen}
        setNavOpen={setNavOpen}
        pathname={pathname}
        handleSignOut={handleSignOut}
      >
        {children}
      </AuthenticatedShell>
    </TenantProvider>
  );
}

function AuthenticatedShell({
  tenant,
  navOpen,
  setNavOpen,
  pathname,
  handleSignOut,
  children,
}: {
  tenant: string;
  navOpen: boolean;
  setNavOpen: React.Dispatch<React.SetStateAction<boolean>>;
  pathname: string | null;
  handleSignOut: () => void;
  children: React.ReactNode;
}) {
  const tenantState = useTenantState();
  const tenantData = tenantState.tenant;
  const sections = buildNav(tenant);
  const brandColor = tenantData?.primary_color ?? "#F59E0B";
  const logoUrl = tenantData?.logo_url ?? null;
  const tenantName = tenantData?.name ?? tenant;

  if (tenantState.status === "missing") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Ingen åtkomst</h1>
          <p className="text-sm text-foreground-muted">
            Du är inloggad men har inte tillgång till{" "}
            <span className="font-mono">{tenant}</span>. Kontrollera att du
            loggat in på rätt portal eller be en admin lägga till ditt konto
            som medlem.
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05]"
            >
              Logga ut
            </button>
          </div>
        </div>
      </div>
    );
  }
  if (tenantState.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Något gick fel</h1>
          <p className="text-sm text-foreground-muted font-mono">
            {tenantState.error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row bg-background"
      style={{ "--brand": brandColor } as React.CSSProperties}
    >
      {/* Mobile topbar */}
      <header className="lg:hidden border-b border-white/5 bg-background-elevated/70 backdrop-blur sticky top-0 z-40">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link
            href={`/${tenant}/dashboard/`}
            className="font-semibold flex items-center gap-2"
          >
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-7 max-w-[10rem] object-contain"
              />
            ) : (
              <>
                <SaldoMark className="h-6 w-6" />
                <span>{tenantName}</span>
              </>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Öppna meny"
            className="rounded-md border border-white/15 px-3 py-1.5 text-sm hover:bg-white/[0.05]"
          >
            {navOpen ? "Stäng" : "Meny"}
          </button>
        </div>
        <div
          aria-hidden="true"
          className="h-px"
          style={{ background: "var(--brand-gradient)", opacity: 0.3 }}
        />
      </header>

      {/* Sidebar */}
      <aside
        className={`${
          navOpen ? "block" : "hidden"
        } lg:block lg:w-64 lg:flex-shrink-0 lg:border-r border-b lg:border-b-0 border-white/5 bg-background-elevated/30`}
      >
        <div className="hidden lg:block px-5 py-5 border-b border-white/5">
          <Link href={`/${tenant}/dashboard/`} className="block group">
            {logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={logoUrl}
                alt={tenantName}
                className="h-9 max-w-full object-contain"
              />
            ) : (
              <span className="inline-flex items-center gap-2.5 font-semibold tracking-tight">
                <SaldoMark className="h-7 w-7 transition-transform duration-300 group-hover:rotate-3" />
                <span className="text-base">Saldo</span>
              </span>
            )}
          </Link>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono truncate">{tenantName}</span>
          </div>
        </div>
        <nav className="px-3 py-4 space-y-5 lg:overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
          {sections.map((section) => (
            <div key={section.title}>
              <p className="px-2.5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-foreground-muted/80 mb-1.5">
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
                        className={`flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                          active
                            ? "bg-white/[0.06] text-foreground"
                            : "text-foreground/80 hover:text-foreground hover:bg-white/[0.03]"
                        }`}
                      >
                        {active && (
                          <span
                            className="h-1 w-1 rounded-full"
                            style={{
                              background: "var(--brand-gradient)",
                            }}
                          />
                        )}
                        <span className={active ? "" : "ml-[0.875rem]"}>
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
          <div className="pt-4 border-t border-white/5 space-y-1.5">
            <Link
              href={`/${tenant}/products/new/`}
              className="block rounded-md bg-foreground text-background px-2.5 py-1.5 text-sm font-medium text-center hover:bg-foreground/90 transition-colors"
            >
              + Ny produkt
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="block w-full text-left rounded-md px-2.5 py-1.5 text-sm text-foreground-muted hover:text-foreground hover:bg-white/[0.03] transition-colors"
            >
              Logga ut
            </button>
          </div>
        </nav>
      </aside>

      <main id="main" className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
