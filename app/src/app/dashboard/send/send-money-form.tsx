"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { sendMoney, resolveAccountAction, type SendMoneyState } from "./actions";
import { CheckIcon } from "@/components/icons";

const initialState: SendMoneyState = { error: null, success: null };

type Bank = { code: string; name: string };
type Resolution = { status: "idle" } | { status: "checking" } | { status: "ok"; name: string } | { status: "error"; message: string };

export function SendMoneyForm({ banks }: { banks: Bank[] }) {
  const [state, formAction, pending] = useActionState(sendMoney, initialState);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [resolution, setResolution] = useState<Resolution>({ status: "idle" });
  const requestId = useRef(0);

  useEffect(() => {
    if (!bankCode || !/^\d{10}$/.test(accountNumber)) {
      setResolution({ status: "idle" });
      return;
    }
    const id = ++requestId.current;
    setResolution({ status: "checking" });
    const timer = setTimeout(async () => {
      const result = await resolveAccountAction(accountNumber, bankCode);
      if (requestId.current !== id) return; // superseded by a newer edit
      if (result.ok) {
        setResolution({ status: "ok", name: result.accountName });
      } else if (result.error) {
        setResolution({ status: "error", message: result.error });
      } else {
        setResolution({ status: "idle" });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [bankCode, accountNumber]);

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
          href="/dashboard"
          className="mt-6 w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
        >
          Done
        </Link>
      </div>
    );
  }

  const canSubmit = resolution.status === "ok" && !pending;

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

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Bank</span>
        <select
          name="bank_code"
          required
          value={bankCode}
          onChange={(e) => setBankCode(e.target.value)}
          className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        >
          <option value="" disabled>
            Select…
          </option>
          {banks.map((b) => (
            <option key={b.code} value={b.code}>
              {b.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Account number</span>
        <input
          name="account_number"
          type="text"
          required
          inputMode="numeric"
          maxLength={10}
          placeholder="0123456789"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
          className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />
      </label>

      <div className="-mt-1 min-h-5 text-sm">
        {resolution.status === "checking" && <span className="text-ink-60">Verifying account…</span>}
        {resolution.status === "ok" && (
          <span className="flex items-center gap-1.5 font-semibold text-marigold-ink">
            <CheckIcon className="h-3.5 w-3.5" />
            {resolution.name}
          </span>
        )}
        {resolution.status === "error" && <span className="text-terracotta">{resolution.message}</span>}
      </div>

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
