import "server-only";

const BASE_URL = process.env.FELICITY_BASE_URL!;
const PARTNER_KEY = process.env.FELICITY_PARTNER_KEY!;

export class FelicityError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "FelicityError";
  }
}

async function call<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PARTNER_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || json.error) {
    // Most partner-api errors are just {error: "<human text>"} — only a
    // handful (onboard_talent's KYC/VA failures, delivery/checkout
    // provisioning) carry a separate {error: <code>, message: <text>} pair.
    // Verified live 2026-09-04: resolve_account/list_banks/send's validation
    // errors are all the single-field shape, and were silently swallowed
    // into a generic "Felicity request failed" before this fallback.
    const code = typeof json.error === "string" ? json.error : "felicity_error";
    const message = Array.isArray(json.message)
      ? json.message.join(", ")
      : json.message != null
        ? String(json.message)
        : typeof json.error === "string"
          ? json.error
          : "Felicity request failed";
    throw new FelicityError(res.status, code, message);
  }

  return json as T;
}

// ---- Talent (Felicity-held balance) ----
// Vendors no longer get one — the only talent left is Zapeet's own fee
// account (see src/lib/zapeet-fee.ts), read and spent from the admin dashboard.

export type Talent = {
  talent_ref: string;
  currency: "NGN";
  kyc_status: "verified" | "pending" | "failed";
  account_number: string;
  account_name: string;
  bank_name: string;
  balance_kobo: number;
  created_at: string;
};

export function getTalent(talent_ref: string) {
  return call<{ success: true; talent: Talent }>("get_talent", { talent_ref });
}

/** Every Felicity-issued VA is hosted at Rubies MFB. Bank code confirmed
 * live by sending a real transfer to a Felicity VA. */
export const RUBIES_MFB_BANK_CODE = "090175";

export type Bank = { code: string; name: string };

/** Verified live 2026-09-04: in test mode returns a small fixed sandbox
 * fixture list (not real Rubies data); in live mode, Rubies' real bank list. */
export function listBanks() {
  return call<{ success: true; banks: Bank[] }>("list_banks");
}

export type ResolvedAccount = { account_name: string; account_number: string; bank_code: string };

/** Verified live 2026-09-04: in test mode resolves any well-formed account
 * number/known bank code to a deterministic "SANDBOX ACCOUNT ####" name (an
 * all-zeros account number is a deterministic failure hook); in live mode,
 * a real Rubies name-enquiry. */
export function resolveAccount(account_number: string, bank_code: string) {
  return call<{ success: true; account: ResolvedAccount }>("resolve_account", {
    account_number,
    bank_code,
  });
}

export function send(input: {
  talent_ref: string;
  amount_naira: number;
  account_number: string;
  bank_code: string;
  account_name: string;
}) {
  return call<{
    success: true;
    reference: string;
    fee_naira: number;
    stamp_duty_naira: number;
    new_balance_kobo: number;
  }>("send", input);
}

export type LedgerEntryType =
  | "inbound_credit"
  | "checkout_payout"
  | "refund"
  | "settlement"
  | "outbound_transfer"
  | "transfer_fee"
  | "stamp_duty"
  | "insurance_premium_debit"
  | "delivery_fee_debit"
  | "bill_payment"
  | "bill_payment_fee"
  | "payroll_disbursement"
  | "payroll_fee";

export type LedgerEntry = {
  entry_type: LedgerEntryType;
  amount_kobo: number;
  meta: Record<string, unknown> | null;
  created_at: string;
};

/** Verified live 2026-09-03 against a real talent — the talent's last 100
 * ledger entries, most recent first. A single user-facing action (e.g. a
 * transfer) can land as several rows sharing meta.reference (the transfer
 * itself, plus a transfer_fee and stamp_duty row) — group by that in the UI. */
export function getTransactions(talent_ref: string) {
  return call<{ transactions: LedgerEntry[] }>("get_transactions", { talent_ref });
}

// ---- Delivery ----

export function getDeliveryQuote(input: {
  pickup_address: string;
  pickup_state: string;
  dropoff_address: string;
  dropoff_state: string;
}) {
  return call<
    | { eligible: true; courier_cost_naira: number; service_fee_naira: number; total_fee_naira: number }
    | { eligible: false; message: string }
  >("get_delivery_quote", input);
}

export type Delivery = {
  delivery_reference: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  fee_naira: number;
  driver_name: string | null;
  driver_phone: string | null;
  delivery_pin: string;
  tracking_url: string | null;
  timeline: unknown[];
  created_at: string;
};

export function createDelivery(input: {
  talent_ref: string;
  pickup_contact_name: string;
  pickup_contact_phone: string;
  pickup_address: string;
  pickup_state: string;
  dropoff_contact_name: string;
  dropoff_contact_phone: string;
  dropoff_address: string;
  dropoff_state: string;
  item_description: string;
}) {
  return call<{ success: true; delivery: Delivery }>("create_delivery", input);
}

export function getDelivery(delivery_reference: string) {
  return call<{ success: true; delivery: Delivery }>("get_delivery", { delivery_reference });
}

// ---- Checkout: one-time collection account, auto-split on payment ----
// The customer pays one exact total into a one-time Rubies account; on
// settlement Felicity pays each `splits` entry its percentage of
// goods_amount_naira as a real, instant bank transfer and books the
// delivery out of the delivery leg. No talent/KYC needed for anyone.

export type CheckoutSplit = {
  account_number: string;
  bank_code: string;
  account_name: string;
  /** Of goods_amount_naira; all entries must sum to exactly 100. */
  percentage: number;
};

export type SplitResult = {
  account_number?: string;
  account_name?: string;
  status: "success" | "failed" | string;
  amount_naira: number;
  error?: string | null;
  reference?: string | null;
};

export type Checkout = {
  checkout_reference: string;
  status: "awaiting_payment" | "settled" | string;
  /** The partner key's actual mode, echoed back by Felicity — the reliable
   * way to know whether simulate_checkout_funding will work, rather than
   * tracking a separate env var that can drift out of sync with the key. */
  mode: "test" | "live" | string;
  goods_amount_naira: number;
  delivery_amount_naira: number;
  total_amount_naira: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  expires_at: string;
  settlement_error: string | null;
  split_results?: SplitResult[] | null;
  delivery_reference?: string | null;
};

export function createCheckout(input: {
  order_ref: string;
  goods_amount_naira: number;
  splits: CheckoutSplit[];
  /** Shown on the collection VA as "Checkout - <label>" instead of the
   * order_ref UUID — pass the vendor's business name. */
  label?: string;
  delivery?: {
    pickup_contact_name: string;
    pickup_contact_phone: string;
    pickup_address: string;
    pickup_state: string;
    dropoff_contact_name: string;
    dropoff_contact_phone: string;
    dropoff_address: string;
    dropoff_state: string;
    item_description: string;
  };
}) {
  return call<{ success: true; checkout: Checkout }>("create_checkout", input);
}

export function getCheckout(checkout_reference: string) {
  return call<{ success: true; checkout: Checkout }>("get_checkout", { checkout_reference });
}

/** Test mode only — settles a checkout without a real transfer. */
export function simulateCheckoutFunding(checkout_reference: string) {
  return call<{ checkout: Checkout }>("simulate_checkout_funding", { checkout_reference });
}
