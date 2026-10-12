"use client";

import { useCallback, useSyncExternalStore } from "react";

const KEY = "zapeet_balance_hidden";
const listeners = new Set<() => void>();

function read() {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

/** The eye toggle on money amounts — remembered per device. Shown
 * (false) on the server render, then the stored preference on the client. */
export function useHiddenAmount() {
  const hidden = useSyncExternalStore(subscribe, read, () => false);
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(KEY, read() ? "0" : "1");
    } catch {}
    listeners.forEach((l) => l());
  }, []);
  return [hidden, toggle] as const;
}
