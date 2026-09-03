"use client";

import { useActionState } from "react";
import { setupTreasury, type SetupTreasuryState } from "./actions";

const initialState: SetupTreasuryState = { error: null };

export function TreasurySetupForm({
  name,
  phone,
  email,
  accountNumber,
  bankName,
}: {
  name: string;
  phone: string;
  email: string;
  accountNumber: string;
  bankName: string;
}) {
  const [state, formAction, pending] = useActionState(setupTreasury, initialState);

  return (
    <div className="rounded-[16px] border border-ink/10 bg-white p-5">
      <p className="mb-1 text-base font-bold text-ink">Set up the treasury account</p>
      <p className="mb-5 text-sm text-ink-60">
        A dedicated balance you fund yourself — vendor insurance rebates (2.5% of the premium) pay out of
        it automatically. Reuses your own already-verified Felicity account, no re-entry needed.
      </p>

      <div className="mb-5 flex flex-col gap-2.5 rounded-[10px] bg-paper p-4 text-sm">
        <Row label="Name" value={name} />
        <Row label="Phone" value={phone} />
        <Row label="Email" value={email} />
        <Row label="Account" value={`${accountNumber} · ${bankName}`} />
      </div>

      <form action={formAction}>
        {state.error && (
          <div className="mb-4 rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
            {state.error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Use these details as treasury"}
        </button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-60">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
