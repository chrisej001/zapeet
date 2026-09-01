"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createPaymentLink, type CreateLinkState } from "../actions";

const initialState: CreateLinkState = { error: null };

export default function NewLinkPage() {
  const [state, formAction, pending] = useActionState(createPaymentLink, initialState);
  const [flow, setFlow] = useState<"insured" | "pure_delivery">("insured");

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>

        <h1 className="mt-4 text-xl">Generate a payment link</h1>
        <p className="mt-1.5 text-sm text-ink-60">
          Pick insured for high-value devices, pure delivery for everything
          else.
        </p>

        <form action={formAction} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
              What are you selling?
            </span>
            <input
              name="item_name"
              type="text"
              required
              placeholder="MacBook Air M2 · 13-inch"
              className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
              Amount (₦)
            </span>
            <input
              name="amount_naira"
              type="number"
              min="1"
              step="1"
              required
              placeholder="185000"
              inputMode="numeric"
              className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
            />
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
              Flow
            </span>
            <input type="hidden" name="flow" value={flow} />
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setFlow("insured")}
                className={`flex-1 rounded-[10px] border px-4 py-3 text-sm font-semibold ${
                  flow === "insured"
                    ? "border-marigold bg-marigold/15 text-marigold-ink"
                    : "border-ink/15 text-ink-60"
                }`}
              >
                Insured
              </button>
              <button
                type="button"
                onClick={() => setFlow("pure_delivery")}
                className={`flex-1 rounded-[10px] border px-4 py-3 text-sm font-semibold ${
                  flow === "pure_delivery"
                    ? "border-terracotta bg-terracotta/15 text-terracotta"
                    : "border-ink/15 text-ink-60"
                }`}
              >
                Pure delivery
              </button>
            </div>
          </div>

          {state.error && (
            <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
              {state.error}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
          >
            {pending ? "Generating…" : "Generate link"}
          </button>
        </form>
      </div>
    </div>
  );
}
