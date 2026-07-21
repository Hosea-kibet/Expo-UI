"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { BrandPreloader } from "@/src/components/brand-preloader";

export function NavigationSplash() {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  useEffect(() => {
    const showForInternalNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const destination = new URL(anchor.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      if (destination.pathname === current.pathname) return;

      // Commit the splash before Next starts its server request/transition.
      flushSync(() => setIsNavigating(true));
    };

    document.addEventListener("click", showForInternalNavigation, true);
    return () => document.removeEventListener("click", showForInternalNavigation, true);
  }, []);

  if (!isNavigating) return null;

  return (
    <BrandPreloader
      id="navigation-splash"
      className="preloader route-splash-loader navigation-splash"
      ariaLabel="Loading page"
    />
  );
}
