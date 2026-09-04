"use client";

import { useActionState, useState } from "react";
import { createOrder, simulatePayment, type CreateOrderState } from "./actions";
import { CheckCircleIcon } from "./checkout-icons";

const initialState: CreateOrderState = { error: null, order: null };

export function CheckoutForm({
  slug,
  itemName,
  flow,
  testMode,
}: {
  slug: string;
  itemName: string;
  flow: "insured" | "pure_delivery";
  testMode: boolean;
}) {
  const action = createOrder.bind(null, slug);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [confirmedToPay, setConfirmedToPay] = useState(false);
  const [simulateState, setSimulateState] = useState<"idle" | "pending" | "done" | "error">("idle");
  const [simulateError, setSimulateError] = useState<string | null>(null);

  async function handleSimulate(orderId: string) {
    setSimulateState("pending");
    setSimulateError(null);
    const result = await simulatePayment(orderId);
    if (result.ok) {
      setSimulateState("done");
    } else {
      setSimulateState("error");
      setSimulateError(result.error);
    }
  }

  if (state.order) {
    const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

    if (!confirmedToPay) {
      return (
        <div className="flex flex-col gap-5 rounded-[20px] border border-ink/10 bg-white p-6">
          <p className="text-base font-bold text-ink">Order summary</p>
          <div className="flex flex-col gap-3 rounded-[14px] bg-paper p-4">
            <Row label={itemName} value={naira(state.order.goodsAmountNaira)} />
            {state.order.insuranceAmountNaira > 0 && (
              <Row label="Device insurance" value={naira(state.order.insuranceAmountNaira)} />
            )}
            <Row label="Delivery" value={naira(state.order.deliveryAmountNaira)} />
            <div className="h-px bg-ink/10" />
            <Row
              label="Total"
              value={naira(state.order.totalAmountNaira)}
              bold
            />
          </div>
          <button
            onClick={() => setConfirmedToPay(true)}
            className="w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper"
          >
            Pay {naira(state.order.totalAmountNaira)}
          </button>
        </div>
      );
    }

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
          <Row label="Amount" value={naira(state.order.totalAmountNaira)} bold />
          <Row label="Account number" value={state.order.accountNumber} />
          <Row label="Bank" value={state.order.bankName} />
          <Row label="Account name" value={state.order.accountName} />
        </div>

        {testMode && (
          <div className="rounded-[14px] border border-dashed border-ink/20 p-4">
            <p className="mb-3 text-xs font-semibold text-ink-60">
              TEST MODE — simulate the transfer instead of sending real money
            </p>
            {simulateState === "done" ? (
              <p className="text-sm font-semibold text-marigold-ink">
                ✓ Payment simulated — delivery and insurance are processing.
              </p>
            ) : (
              <>
                <button
                  onClick={() => handleSimulate(state.order!.orderId)}
                  disabled={simulateState === "pending"}
                  className="w-full rounded-[10px] border border-ink/25 py-3 text-sm font-semibold text-ink disabled:opacity-60"
                >
                  {simulateState === "pending" ? "Simulating…" : "Simulate payment"}
                </button>
                {simulateState === "error" && (
                  <p className="mt-2 text-xs text-terracotta">{simulateError}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-4 rounded-[20px] border border-ink/10 bg-white p-6">
      <div className="grid grid-cols-2 gap-3">
        <Field name="customer_first_name" label="First name" placeholder="Ada" />
        <Field name="customer_last_name" label="Last name" placeholder="Okoye" />
      </div>
      <Field name="customer_email" label="Email" type="email" placeholder="ada@example.com" />
      <Field name="customer_phone" label="Phone" type="tel" placeholder="08012345678" />
      <Field name="delivery_address" label="Delivery address" placeholder="14 Allen Avenue, Ikeja" />
      <label className="flex flex-col gap-1.5">
        <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">State</span>
        <input
          name="delivery_state"
          type="text"
          value="Lagos"
          readOnly
          className="rounded-[10px] border border-ink/15 bg-ink/5 px-4 py-3 text-sm text-ink-60 outline-none"
        />
      </label>
      <p className="-mt-2 text-xs text-ink-60">Same-day delivery only covers Lagos right now.</p>

      {flow === "insured" && (
        <div className="flex flex-col gap-4 rounded-[10px] border border-marigold/30 bg-marigold/5 p-4">
          <p className="text-xs text-ink-60">Needed to issue your device insurance policy.</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">
                Gender
              </span>
              <select
                name="customer_gender"
                required
                defaultValue=""
                className="rounded-[10px] border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
              >
                <option value="" disabled>
                  Select…
                </option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </label>
            <Field name="customer_date_of_birth" label="Date of birth" type="date" />
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
        className="mt-1 w-full rounded-[10px] bg-ink py-3.5 text-sm font-semibold text-paper disabled:opacity-60"
      >
        {pending ? "Please wait…" : "See total & pay"}
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

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`text-sm ${bold ? "font-semibold text-ink" : "text-ink-60"}`}>{label}</span>
      <span className={`text-sm font-bold text-ink ${bold ? "text-base" : ""}`}>{value}</span>
    </div>
  );
}
