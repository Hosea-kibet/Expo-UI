"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPixel(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") {
    return;
  }

  if (params) {
    window.fbq("track", event, params);
    return;
  }

  window.fbq("track", event);
}

export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window.fbq !== "function") {
      return;
    }

    window.fbq("track", "PageView");
  }, [pathname]);

  return null;
}
