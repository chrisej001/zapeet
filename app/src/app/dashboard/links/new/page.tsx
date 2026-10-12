"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { createPaymentLink, type CreateLinkState } from "../actions";
import { zapeetFeeNaira } from "@/lib/fee";

const initialState: CreateLinkState = { error: null };

const naira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

export default function NewLinkPage() {
  const [state, formAction, pending] = useActionState(createPaymentLink, initialState);
  const [amount, setAmount] = useState("");
  const [customerPaysFee, setCustomerPaysFee] = useState(false);

  const price = Number(amount);
  const fee = price > 0 ? zapeetFeeNaira(price) : 0;

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/links" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>

        <h1 className="mt-4 text-xl">Generate a payment link</h1>
        <p className="mt-1.5 text-sm text-ink-60">
          Your customer pays the item price plus delivery. You&apos;re paid instantly to your bank, and a rider is
          booked automatically.
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
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Amount (₦)</span>
            <input
              name="amount_naira"
              type="number"
              min="1"
              step="1"
              required
              placeholder="185000"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
            />
          </label>

          <input type="hidden" name="customer_pays_fee" value={customerPaysFee ? "1" : "0"} />
          <button
            type="button"
            role="switch"
            aria-checked={customerPaysFee}
            onClick={() => setCustomerPaysFee((v) => !v)}
            className="flex items-center justify-between gap-4 rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-left"
          >
            <span>
              <span className="block text-sm font-semibold text-ink">Customer pays the Zapeet fee</span>
              <span className="mt-0.5 block text-xs text-ink-60">
                2% of the price, capped at ₦2,000. Off: it comes out of your payout.
              </span>
            </span>
            <span
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                customerPaysFee ? "bg-marigold" : "bg-ink/20"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  customerPaysFee ? "translate-x-5" : ""
                }`}
              />
            </span>
          </button>

          {price > 0 && (
            <div className="flex flex-col gap-2 rounded-[10px] bg-white p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-ink-60">Customer pays (before delivery)</span>
                <span className="font-semibold text-ink">{naira(customerPaysFee ? price + fee : price)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-60">Zapeet fee</span>
                <span className="font-semibold text-ink">{naira(fee)}</span>
              </div>
              <div className="h-px bg-ink/10" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">You receive</span>
                <span className="font-bold text-marigold-ink">{naira(customerPaysFee ? price : price - fee)}</span>
              </div>
            </div>
          )}

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
