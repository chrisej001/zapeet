"use client";

import { useActionState } from "react";
import { completeOnboarding, type OnboardState } from "./actions";
import { LogoMark } from "@/components/logo";

const initialState: OnboardState = { error: null };

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(completeOnboarding, initialState);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          <div>
            <h1 className="text-xl">Set up your Zapeet account</h1>
            <p className="mt-1.5 text-sm text-ink-60">
              We use this to issue your dedicated payout account — customer
              payments land here directly. Test mode: any 11-digit BVN/NIN
              works.
            </p>
          </div>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field name="first_name" label="First name" placeholder="Ada" />
            <Field name="last_name" label="Last name" placeholder="Okoye" />
          </div>
          <Field name="phone" label="Phone" type="tel" placeholder="08012345678" />
          <Field name="date_of_birth" label="Date of birth" type="date" />
          <Field
            name="bvn"
            label="BVN"
            placeholder="11 digits"
            inputMode="numeric"
            maxLength={11}
          />
          <Field
            name="nin"
            label="NIN"
            placeholder="11 digits"
            inputMode="numeric"
            maxLength={11}
          />
          <Field
            name="pickup_address"
            label="Pickup address"
            placeholder="14 Otigba Street, Ikeja"
          />
          <label className="flex flex-col gap-1.5">
            <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
              State
            </span>
            <input
              name="pickup_state"
              type="text"
              value="Lagos"
              readOnly
              className="rounded-[10px] border border-ink/15 bg-ink/5 px-4 py-3 text-sm text-ink-60 outline-none"
            />
          </label>
          <p className="-mt-2 text-xs text-ink-60">
            Where riders collect items for delivery. Same-day delivery only covers Lagos-to-Lagos right now, so this is fixed to Lagos.
          </p>

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
            {pending ? "Setting up your account…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  placeholder,
  inputMode,
  maxLength,
}: {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  inputMode?: "numeric" | "tel";
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">{label}</span>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        required
        inputMode={inputMode}
        maxLength={maxLength}
        className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
      />
    </label>
  );
}
