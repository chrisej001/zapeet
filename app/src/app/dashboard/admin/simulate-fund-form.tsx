"use client";

import { useActionState } from "react";
import { simulateTreasuryFunding, type SimulateFundState } from "./actions";

const initialState: SimulateFundState = { error: null };

export function SimulateFundForm() {
  const [state, formAction, pending] = useActionState(simulateTreasuryFunding, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3 rounded-[16px] border border-ink/10 bg-white p-5">
      <p className="text-sm font-semibold text-ink">Simulate funding (test mode only)</p>
      <div className="flex gap-2.5">
        <input
          name="amount_naira"
          type="number"
          min="1"
          step="1"
          placeholder="50000"
          required
          className="flex-1 rounded-[10px] border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[10px] border border-ink/25 px-4 py-3 text-sm font-semibold text-ink disabled:opacity-60"
        >
          {pending ? "…" : "Fund"}
        </button>
      </div>
      {state.error && <p className="text-sm font-medium text-terracotta">{state.error}</p>}
    </form>
  );
}
