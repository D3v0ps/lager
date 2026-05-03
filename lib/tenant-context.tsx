"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/database.types";

export type TenantState =
  | { status: "loading"; tenant: null; error: null }
  | { status: "ready"; tenant: Tenant; error: null }
  | { status: "missing"; tenant: null; error: null }
  | { status: "error"; tenant: null; error: string };

type TenantContextValue = {
  state: TenantState;
  refresh: () => Promise<void>;
};

const initialValue: TenantContextValue = {
  state: { status: "loading", tenant: null, error: null },
  refresh: async () => {},
};

const TenantContext = createContext<TenantContextValue>(initialValue);

const supabase = createClient();

export function TenantProvider({
  slug,
  children,
}: {
  slug: string;
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TenantState>(initialValue.state);
  const slugRef = useRef(slug);
  slugRef.current = slug;

  const load = useCallback(async (): Promise<void> => {
    const targetSlug = slugRef.current;
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", targetSlug)
      .maybeSingle();

    // Bail if the slug changed while we were fetching.
    if (slugRef.current !== targetSlug) return;

    if (error) {
      setState({ status: "error", tenant: null, error: error.message });
      return;
    }
    if (!data) {
      setState({ status: "missing", tenant: null, error: null });
      return;
    }
    setState({ status: "ready", tenant: data, error: null });
  }, []);

  useEffect(() => {
    setState({ status: "loading", tenant: null, error: null });
    void load();
  }, [slug, load]);

  return (
    <TenantContext.Provider value={{ state, refresh: load }}>
      {children}
    </TenantContext.Provider>
  );
}

/**
 * Returns the current tenant, or null if not yet loaded / not found / errored.
 * For most callers this is enough — if you need to react to error or missing
 * states, use useTenantState().
 */
export function useTenant(): Tenant | null {
  return useContext(TenantContext).state.tenant;
}

export function useTenantState(): TenantState {
  return useContext(TenantContext).state;
}

/**
 * Re-fetch the tenant row. Call this after mutations (branding save, name
 * change, etc.) so dependent UI like the sidebar logo updates without a
 * full page reload.
 */
export function useTenantRefresh(): () => Promise<void> {
  return useContext(TenantContext).refresh;
}
