"use client";

import { useActionState, useState } from "react";
import { updatePayoutAccount, type ProfileFormState } from "../actions";
import { BankAccountFields, type Bank } from "@/components/bank-account-fields";

const initialState: ProfileFormState = { error: null };

export function PayoutForm({
  banks,
  defaultBankCode,
  defaultAccountNumber,
}: {
  banks: Bank[];
  defaultBankCode: string;
  defaultAccountNumber: string;
}) {
  const [state, formAction, pending] = useActionState(updatePayoutAccount, initialState);
  const [resolved, setResolved] = useState(false);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <BankAccountFields
        banks={banks}
        defaultBankCode={defaultBankCode}
        defaultAccountNumber={defaultAccountNumber}
        onResolvedChange={setResolved}
      />

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
        {pending ? "Saving…" : "Save payout account"}
      </button>
    </form>
  );
}
