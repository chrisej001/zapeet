"use client";

import { useActionState } from "react";
import { createOrder, type CreateOrderState } from "./actions";
import { CheckCircleIcon } from "./checkout-icons";

const initialState: CreateOrderState = { error: null, order: null };

export function CheckoutForm({ slug }: { slug: string }) {
  const action = createOrder.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);

  if (state.order) {
    return (
      <div className="flex flex-col gap-5 rounded-[20px] border border-ink/10 bg-white p-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-marigold/15 text-marigold-ink">
            <CheckCircleIcon className="h-6 w-6" />
          </div>
          <p className="text-base font-bold text-ink">Transfer to complete your order</p>
          <p className="text-sm text-ink-60">
            We’ll confirm automatically once your transfer lands — no need to send a receipt.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-[14px] bg-paper p-4">
          <Row label="Amount" value={`₦${state.order.amountNaira.toLocaleString("en-NG")}`} />
          <Row label="Account number" value={state.order.accountNumber} />
          <Row label="Bank" value={state.order.bankName} />
          <Row label="Account name" value={state.order.accountName} />
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[20px] border border-ink/10 bg-white p-6">
      <Field name="customer_name" label="Full name" placeholder="Ada Okoye" />
      <Field name="customer_phone" label="Phone" type="tel" placeholder="08012345678" />
      <Field name="delivery_address" label="Delivery address" placeholder="14 Allen Avenue, Ikeja" />
      <Field name="delivery_state" label="State" placeholder="Lagos" />

      {state.error && (
        <div className="rounded-[10px] bg-terracotta/10 px-4 py-3 text-sm font-medium text-terracotta">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Please wait…" : "Continue to pay"}
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
        className="rounded-[10px] border border-ink/15 px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
      />
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink-60">{label}</span>
      <span className="text-sm font-bold text-ink">{value}</span>
    </div>
  );
}
