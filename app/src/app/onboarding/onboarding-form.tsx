"use client";

import { useActionState, useState } from "react";
import { completeOnboarding, type OnboardState } from "./actions";
import { BankAccountFields, type Bank } from "@/components/bank-account-fields";

const initialState: OnboardState = { error: null };

export function OnboardingForm({ banks }: { banks: Bank[] }) {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);
  const [resolved, setResolved] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <p className="text-[11px] font-bold tracking-[0.06em] text-ink uppercase">Payout account</p>
      {banks.length ? (
        <BankAccountFields banks={banks} onResolvedChange={setResolved} />
      ) : (
        <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          Couldn&apos;t load the bank list — refresh to try again.
        </div>
      )}

      <div className="h-px bg-ink/10" />
      <p className="text-[11px] font-bold tracking-[0.06em] text-ink uppercase">Pickup details</p>

      <Field name="phone" label="Phone" type="tel" placeholder="08012345678" />
      <Field name="pickup_address" label="Pickup address" placeholder="14 Otigba Street, Ikeja" />
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">State</span>
        <input
          name="pickup_state"
          type="text"
          value="Lagos"
          readOnly
          className="rounded-[10px] border border-ink/15 bg-ink/5 px-4 py-3 text-sm text-ink-60 outline-none"
        />
      </label>
      <p className="-mt-2 text-xs text-ink-60">
        Where riders collect items for delivery. Same-day delivery only covers Lagos-to-Lagos right now, so this is
        fixed to Lagos.
      </p>

      {state.error && (
        <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !resolved}
        className="mt-2 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
      />
    </label>
  );
}
