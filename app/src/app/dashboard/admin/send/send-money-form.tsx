"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { sendMoney, type SendMoneyState } from "./actions";
import { CheckIcon } from "@/components/icons";
import { BankAccountFields, type Bank } from "@/components/bank-account-fields";

const initialState: SendMoneyState = { error: null, success: null };

export function SendMoneyForm({ banks }: { banks: Bank[] }) {
  const [state, formAction, pending] = useActionState(sendMoney, initialState);
  const [resolved, setResolved] = useState(false);

  if (state.success) {
    return (
      <div className="flex flex-col items-center rounded-[16px] border border-ink/10 bg-white p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-marigold/15 text-marigold-ink">
          <CheckIcon className="h-6 w-6" />
        </div>
        <p className="text-base font-bold text-ink">Transfer sent</p>
        <p className="mt-1 text-sm text-ink-60">Reference {state.success.reference}</p>

        <div className="mt-6 flex w-full flex-col gap-2.5 rounded-[10px] bg-paper p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-60">Fee</span>
            <span className="font-semibold text-ink">₦{state.success.feeNaira.toLocaleString("en-NG")}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-60">Stamp duty</span>
            <span className="font-semibold text-ink">
              ₦{state.success.stampDutyNaira.toLocaleString("en-NG")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-ink-60">New balance</span>
            <span className="font-semibold text-ink">
              ₦{state.success.newBalanceNaira.toLocaleString("en-NG")}
            </span>
          </div>
        </div>

        <Link
          href="/dashboard/admin"
          className="mt-6 w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
        >
          Done
        </Link>
      </div>
    );
  }

  const canSubmit = resolved && !pending;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Amount (₦)</span>
        <input
          name="amount_naira"
          type="number"
          min="1"
          step="1"
          required
          placeholder="50000"
          inputMode="numeric"
          className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />
      </label>

      <BankAccountFields banks={banks} onResolvedChange={setResolved} />

      {state.error && (
        <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-40"
      >
        {pending ? "Sending…" : "Send money"}
      </button>
    </form>
  );
}
