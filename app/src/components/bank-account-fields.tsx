"use client";

import { useEffect, useState } from "react";
import { resolveAccountAction } from "@/app/bank-actions";
import { CheckIcon } from "@/components/icons";

export type Bank = { code: string; name: string };

type Resolution =
  | { status: "idle" }
  | { status: "checking" }
  | { status: "ok"; name: string }
  | { status: "error"; message: string };

type Lookup = { key: string; result: { ok: true; name: string } | { ok: false; message: string } };

/** Bank picker + account number with live name-enquiry. Submits
 * `bank_code` and `account_number`; the server re-resolves the name itself
 * rather than trusting anything from the client. `onResolvedChange` lets the
 * parent form gate its submit button on a verified account. */
export function BankAccountFields({
  banks,
  defaultBankCode = "",
  defaultAccountNumber = "",
  onResolvedChange,
}: {
  banks: Bank[];
  defaultBankCode?: string;
  defaultAccountNumber?: string;
  onResolvedChange?: (resolved: boolean) => void;
}) {
  const [bankCode, setBankCode] = useState(defaultBankCode);
  const [accountNumber, setAccountNumber] = useState(defaultAccountNumber);
  // Only completed lookups are state; "checking"/"idle" are derived from
  // whether the latest lookup matches what's currently typed.
  const [lookup, setLookup] = useState<Lookup | null>(null);
  const key = bankCode && /^\d{10}$/.test(accountNumber) ? `${bankCode}:${accountNumber}` : null;

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const result = await resolveAccountAction(accountNumber, bankCode);
      if (cancelled) return; // superseded by a newer edit
      setLookup({
        key,
        result: result.ok ? { ok: true, name: result.accountName } : { ok: false, message: result.error },
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, bankCode, accountNumber]);

  const resolution: Resolution = !key
    ? { status: "idle" }
    : lookup?.key !== key
      ? { status: "checking" }
      : lookup.result.ok
        ? { status: "ok", name: lookup.result.name }
        : lookup.result.message
          ? { status: "error", message: lookup.result.message }
          : { status: "idle" };

  useEffect(() => {
    onResolvedChange?.(resolution.status === "ok");
  }, [resolution.status, onResolvedChange]);

  return (
    <>
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
    </>
  );
}
