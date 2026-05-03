"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/database.types";

export type TenantState =
  | { status: "loading"; tenant: null; error: null }
  | { status: "ready"; tenant: Tenant; error: null }
  | { status: "missing"; tenant: null; error: null }
  | { status: "error"; tenant: null; error: string };

const TenantContext = createContext<TenantState>({
  status: "loading",
  tenant: null,
  error: null,
});

const supabase = createClient();

export function TenantProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TenantState>({
    status: "loading",
    tenant: null,
    error: null,
  });

  useEffect(() => {
    let active = true;
    setState({ status: "loading", tenant: null, error: null });

    (async () => {
      const { data, error } = await supabase
        .from("tenants")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setState({ status: "error", tenant: null, error: error.message });
        return;
      }
      if (!data) {
        setState({ status: "missing", tenant: null, error: null });
        return;
      }
      setState({ status: "ready", tenant: data, error: null });
    })();

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <TenantContext.Provider value={state}>{children}</TenantContext.Provider>
  );
}

/**
 * Returns the current tenant, or null if not yet loaded / not found / errored.
 * For most callers this is enough — if you need to react to error or missing
 * states, use useTenantState().
 */
export function useTenant(): Tenant | null {
  return useContext(TenantContext).tenant;
}

export function useTenantState(): TenantState {
  return useContext(TenantContext);
}

/**
 * Same as useTenant() but throws when called from a tree without a provider
 * or before the tenant has loaded.
 */
export function useRequiredTenant(): Tenant {
  const state = useContext(TenantContext);
  if (state.status !== "ready") {
    throw new Error(
      "useRequiredTenant called before tenant loaded (status: " +
        state.status +
        ")",
    );
  }
  return state.tenant;
}
