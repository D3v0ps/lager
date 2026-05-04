"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getCurrentSession, onAuthChange, signOut } from "@/lib/auth";
import {
  acceptPendingCustomerInvitations,
  listMyMemberships,
  type PortalMembership,
} from "@/lib/portal";
import { SaldoMark } from "@/app/_brand/Logo";

type Status = "loading" | "anonymous" | "authenticated";

/**
 * Portal shell — chrome for /[tenant]/portal/*. Mirrors the supplier-side
 * TenantShell but checks customer_users membership instead of tenant_users.
 */
export default function PortalShell({
  tenant,
  children,
}: {
  tenant: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [status, setStatus] = useState<Status>("loading");
  const [memberships, setMemberships] = useState<PortalMembership[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const isLoginPath =
    pathname === `/${tenant}/portal/login` ||
    pathname === `/${tenant}/portal/login/`;

  useEffect(() => {
    let mounted = true;
    getCurrentSession()
      .then((session) => {
        if (!mounted) return;
        setStatus(session ? "authenticated" : "anonymous");
      })
      .catch(() => {
        if (mounted) setStatus("anonymous");
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
    if (status !== "authenticated") {
      setMemberships(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        await acceptPendingCustomerInvitations();
        const list = await listMyMemberships(tenant);
        if (cancelled) return;
        setMemberships(list);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, tenant]);

  useEffect(() => {
    if (status === "anonymous" && !isLoginPath) {
      router.replace(`/${tenant}/portal/login/`);
    }
  }, [status, isLoginPath, router, tenant]);

  async function handleSignOut() {
    await signOut();
    router.replace(`/${tenant}/portal/login/`);
  }

  if (isLoginPath) return <>{children}</>;

  if (status === "loading" || (status === "authenticated" && memberships === null)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-foreground-muted">Laddar portal…</p>
      </div>
    );
  }

  if (status === "anonymous") return null;

  if (memberships && memberships.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">Ingen kund-åtkomst</h1>
          <p className="text-sm text-foreground-muted">
            Du är inloggad men inte kopplad till någon kund hos {tenant}. Be
            din inköpsansvarige att bjuda in dig till portalen.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-md border border-white/15 px-4 py-2 text-sm hover:bg-white/[0.05]"
          >
            Logga ut
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-semibold">Något gick fel</h1>
          <p className="text-sm text-foreground-muted font-mono">{error}</p>
        </div>
      </div>
    );
  }

  const membership = memberships?.[0];
  if (!membership) return null;

  const supplierName = membership.tenant.name;
  const customerName = membership.customer.name;
  const supplierLogo = membership.tenant.logo_url;
  const brandColor = membership.tenant.primary_color ?? undefined;

  const navItems = [
    { href: `/${tenant}/portal/`, label: "Katalog" },
    { href: `/${tenant}/portal/orders/`, label: "Mina ordrar" },
    { href: `/${tenant}/portal/account/`, label: "Konto" },
  ];

  return (
    <div
      className="min-h-screen flex flex-col bg-background"
      style={brandColor ? ({ "--brand": brandColor } as React.CSSProperties) : undefined}
    >
      <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-white/5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link
            href={`/${tenant}/portal/`}
            className="flex items-center gap-2.5 min-w-0"
          >
            {supplierLogo ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={supplierLogo}
                alt={supplierName}
                className="h-7 max-w-[8rem] object-contain"
              />
            ) : (
              <SaldoMark className="h-7 w-7" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{supplierName}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-foreground-muted">
                Kundportal · {customerName}
              </p>
            </div>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                pathname === item.href.replace(/\/$/, "");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-white/[0.06] text-foreground"
                      : "text-foreground-muted hover:text-foreground hover:bg-white/[0.03]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={handleSignOut}
              className="ml-2 rounded-md px-3 py-1.5 text-foreground-muted hover:text-foreground transition-colors"
            >
              Logga ut
            </button>
          </nav>
          <div className="md:hidden">
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-md border border-white/15 px-3 py-1.5 text-sm"
            >
              Logga ut
            </button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="h-px"
          style={{ background: "var(--brand-gradient)", opacity: 0.45 }}
        />
      </header>

      <main id="main" className="flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
