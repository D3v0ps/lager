"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { getTenantBySlug } from "@/lib/auth";
import type { Tenant } from "@/lib/database.types";

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [tenant, setTenant] = useState<Tenant | null>(null);

  useEffect(() => {
    let active = true;
    getTenantBySlug(slug).then((t) => {
      if (active) setTenant(t);
    });
    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant(): Tenant | null {
  return useContext(TenantContext);
}

/**
 * Same as useTenant() but throws when called from a tree without a provider
 * or before the tenant has loaded. For places that have already gated on
 * auth (so the provider has resolved).
 */
export function useRequiredTenant(): Tenant {
  const t = useContext(TenantContext);
  if (!t) {
    throw new Error("useRequiredTenant called outside TenantProvider");
  }
  return t;
}
