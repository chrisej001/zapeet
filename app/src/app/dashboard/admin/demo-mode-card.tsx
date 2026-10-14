"use client";

import { useState, useTransition } from "react";
import { clearDemoData, setDemoMode } from "./demo-actions";

export function DemoModeCard({
  vendorId,
  businessName,
  demoMode,
  demoLinkCount,
}: {
  vendorId: string;
  businessName: string;
  demoMode: boolean;
  demoLinkCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await action();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{businessName}</p>
          <p className="mt-0.5 text-xs text-ink-60">
            {demoMode
              ? "Demo mode — new links use a fake account and a Simulate payment button. No money moves."
              : "Live mode — links take real payments."}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-[12px] bg-paper p-1">
        {[
          { label: "Demo", on: true },
          { label: "Live", on: false },
        ].map((opt) => {
          const active = demoMode === opt.on;
          return (
            <button
              key={opt.label}
              disabled={pending || active}
              onClick={() => run(() => setDemoMode(vendorId, opt.on))}
              className={`rounded-[9px] py-2.5 text-sm font-semibold transition-colors ${
                active ? (opt.on ? "bg-marigold text-ink" : "bg-ink text-paper") : "text-ink-60"
              } disabled:cursor-default`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {demoLinkCount > 0 && (
        <button
          disabled={pending}
          onClick={() => {
            if (confirm(`Delete ${demoLinkCount} demo link(s) and their orders?`)) {
              run(() => clearDemoData(vendorId));
            }
          }}
          className="mt-3 w-full rounded-[10px] border border-ink/15 py-2.5 text-xs font-semibold text-ink disabled:opacity-60"
        >
          Clear demo data ({demoLinkCount} link{demoLinkCount === 1 ? "" : "s"})
        </button>
      )}

      {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
    </div>
  );
}
