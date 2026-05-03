"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Scroll-triggered reveal. Uses IntersectionObserver to flip a
 * data-reveal="in" attribute on the host element when it enters the viewport;
 * the actual fade+rise transition is defined in globals.css (.reveal class).
 *
 * Pure CSS transition — no Framer Motion dependency.
 *
 * Honours prefers-reduced-motion (handled in CSS).
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  /** Delay in ms — useful for staggering siblings */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => {
              el.setAttribute("data-reveal", "in");
            }, delay);
            observer.unobserve(el);
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  // Cast through unknown so TS lets us use a dynamic tag without an
  // exhaustive intrinsic-elements union.
  const Component = Tag as unknown as "div";

  return (
    <Component ref={ref} className={`reveal ${className}`}>
      {children}
    </Component>
  );
}
