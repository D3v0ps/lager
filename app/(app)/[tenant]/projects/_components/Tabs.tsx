"use client";

import { useEffect, useState } from "react";

export type Tab<T extends string> = {
  id: T;
  label: string;
  count?: number;
};

/**
 * Lightweight tabs primitive — keeps the active tab in the URL hash so a
 * deep-link to a project tab "just works" and back/forward navigation
 * preserves selection.
 */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: readonly Tab<T>[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="border-b border-white/5">
      <div className="flex gap-1 overflow-x-auto -mx-1 px-1">
        {tabs.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={`relative whitespace-nowrap px-3 sm:px-4 py-2.5 text-sm transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {tab.label}
              {typeof tab.count === "number" && (
                <span className="ml-1.5 text-[11px] tabular-nums text-foreground-muted">
                  {tab.count}
                </span>
              )}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-1 -bottom-px h-0.5 rounded-t-full"
                  style={{ background: "var(--brand-gradient)" }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * useHashTab — keep the active tab in the URL hash.
 */
export function useHashTab<T extends string>(
  validTabs: readonly T[],
  fallback: T,
): [T, (next: T) => void] {
  const [active, setActive] = useState<T>(fallback);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const apply = () => {
      const hash = window.location.hash.replace(/^#/, "") as T;
      if ((validTabs as readonly string[]).includes(hash)) {
        setActive(hash);
      } else {
        setActive(fallback);
      }
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, [validTabs, fallback]);

  function set(next: T) {
    setActive(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.hash = next;
      window.history.replaceState(null, "", url);
    }
  }

  return [active, set];
}
