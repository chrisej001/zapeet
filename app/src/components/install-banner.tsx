"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo";
import { PlusSquareIcon, ShareIcon } from "@/components/icons";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "zapeet-install-dismissed-at";
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < SNOOZE_MS;
  } catch {
    return false;
  }
}

const noopSubscribe = () => () => {};

export function InstallBanner() {
  const pathname = usePathname();
  // iOS has no install event — Safari only supports manual Add to Home Screen,
  // so we offer it whenever the app isn't already running from the home screen.
  const ios = useSyncExternalStore(
    noopSubscribe,
    () => isIos() && !isStandalone() && !recentlyDismissed(),
    () => false,
  );
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    if (isIos() || isStandalone() || recentlyDismissed()) return;

    function onPrompt(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setDeferred(null);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  // Customers on a payment link and the splash screen never see the prompt —
  // the app is for vendors.
  if (dismissed || !(ios || deferred) || pathname === "/" || pathname.startsWith("/pay")) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setShowIosGuide(false);
    setDismissed(true);
  }

  async function install() {
    if (ios) {
      setShowIosGuide(true);
      return;
    }
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "dismissed") dismiss();
  }

  const aboveNav = pathname.startsWith("/dashboard");

  return (
    <>
      <div
        className={`fixed inset-x-0 z-30 px-4 ${
          aboveNav ? "bottom-[calc(env(safe-area-inset-bottom)+76px)]" : "bottom-[calc(env(safe-area-inset-bottom)+16px)]"
        }`}
      >
        <div className="mx-auto flex w-full max-w-sm items-center gap-3 rounded-[16px] bg-ink p-3 pr-2 shadow-[0_16px_40px_-12px_rgba(27,31,59,0.55)]">
          <button onClick={install} className="flex flex-1 items-center gap-3 text-left">
            <LogoMark size={40} className="shrink-0 rounded-[10px] ring-1 ring-paper/15" />
            <span className="flex flex-col">
              <span className="text-sm font-semibold text-paper">Install Zapeet</span>
              <span className="text-xs text-paper/65">Add it to your home screen for quick access</span>
            </span>
          </button>
          <button
            onClick={install}
            className="rounded-[10px] bg-marigold px-3.5 py-2 text-xs font-bold text-ink"
          >
            Install
          </button>
          <button onClick={dismiss} aria-label="Dismiss" className="px-1.5 text-lg leading-none text-paper/50">
            ×
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="fixed inset-0 z-[90] flex items-end bg-ink/50" onClick={() => setShowIosGuide(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="mx-auto w-full max-w-sm rounded-t-[24px] bg-white px-6 pt-6 pb-[calc(env(safe-area-inset-bottom)+24px)]"
          >
            <div className="flex items-center gap-3">
              <LogoMark size={44} />
              <div>
                <p className="text-base font-bold text-ink">Add Zapeet to your Home Screen</p>
                <p className="text-xs text-ink-60">It opens full-screen, just like an app.</p>
              </div>
            </div>
            <ol className="mt-5 flex flex-col gap-3">
              <Step n={1}>
                Tap the <strong className="text-ink">Share</strong> button{" "}
                <ShareIcon className="inline h-4 w-4 -translate-y-px text-[#0A84FF]" /> in Safari&apos;s toolbar (or
                tap <strong className="text-ink">•••</strong> first, then Share).
              </Step>
              <Step n={2}>
                Scroll down and tap <strong className="text-ink">Add to Home Screen</strong>{" "}
                <PlusSquareIcon className="inline h-4 w-4 -translate-y-px text-ink" />.
              </Step>
              <Step n={3}>
                Tap <strong className="text-ink">Add</strong> in the top-right corner.
              </Step>
            </ol>
            <button
              onClick={dismiss}
              className="mt-6 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 rounded-[14px] bg-paper p-3 text-sm text-ink-60">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
