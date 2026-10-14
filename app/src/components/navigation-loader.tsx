"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { PageLoader } from "@/components/page-loader";

// Brief delay so prefetched pages that render instantly don't flash the loader.
const SHOW_AFTER_MS = 120;
const GIVE_UP_AFTER_MS = 15000;

// loading.tsx only covers the segment that changes, so deep navigations
// (e.g. orders → order detail) can look frozen. This watches internal link
// clicks and shows the loader until the URL actually changes.
export function NavigationLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentUrl = `${pathname}?${searchParams}`;
  // The URL a navigation started from — the loader shows only while we're
  // still on it, so it disappears the moment the new page commits.
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [delayPassed, setDelayPassed] = useState(false);
  if (pendingFrom && pendingFrom !== currentUrl) setPendingFrom(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest("a");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      setDelayPassed(false);
      setPendingFrom(currentUrl);
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [currentUrl]);

  useEffect(() => {
    if (!pendingFrom) return;
    const show = setTimeout(() => setDelayPassed(true), SHOW_AFTER_MS);
    const giveUp = setTimeout(() => setPendingFrom(null), GIVE_UP_AFTER_MS);
    return () => {
      clearTimeout(show);
      clearTimeout(giveUp);
    };
  }, [pendingFrom]);

  return pendingFrom === currentUrl && delayPassed ? <PageLoader /> : null;
}
