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
    const code = json.error ?? "felicity_error";
    const message = Array.isArray(json.message)
      ? json.message.join(", ")
      : (json.message ?? "Felicity request failed");
    throw new FelicityError(res.status, code, message);
  }

  return json as T;
}

// ---- Talent (vendor virtual account) ----

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

export function onboardTalent(input: {
  talent_ref: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth: string; // YYYY-MM-DD
  bvn: string;
  nin: string;
}) {
  return call<{ success: true; talent: Talent }>("onboard_talent", input);
}

export function getTalent(talent_ref: string) {
  return call<{ success: true; talent: Talent }>("get_talent", { talent_ref });
}

export function simulateFunding(talent_ref: string, amount_naira: number) {
  return call<{ success: true; reference: string; new_balance_kobo: number }>(
    "simulate_funding",
    { talent_ref, amount_naira },
  );
}

/** Every Felicity-issued VA we've seen (test mode) is hosted at Rubies MFB.
 * Bank code confirmed live by sending a real transfer to a Felicity VA. */
export const RUBIES_MFB_BANK_CODE = "090175";

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

// ---- Insurance ----

// Verified against the live catalog response (2026-09-02) — note this is
// {status, message, data}, not the {success, products} shape the older
// version of the docs implied.
export type InsuranceProduct = {
  id: string;
  product_name: string;
  product_class: string;
  provider: string;
  product_description: string;
  base_premium: number;
  base_premium_naira: number;
  duration_options: number[];
  required_fields: string[];
  currency: string;
  premium_type?: "percentage" | "flat";
  premium_rate_pct?: number;
  pricing_note?: string;
};

export function listInsuranceProducts() {
  return call<{ status: true; message: string; data: InsuranceProduct[] }>(
    "list_insurance_products",
  );
}

/** Gadget Cover V2 — the percentage-of-device-value product. There can be
 * more than one "Gadget" product (e.g. a flat-fee one); this picks the
 * percentage-priced one specifically, live or sandbox, rather than
 * hardcoding a product_id. */
export async function findGadgetCoverProduct(): Promise<InsuranceProduct> {
  const { data } = await listInsuranceProducts();
  const product = data.find(
    (p) => p.product_class === "Gadget" && p.premium_type === "percentage",
  );
  if (!product) {
    throw new FelicityError(
      404,
      "gadget_product_not_found",
      "No percentage-priced Gadget insurance product found in the catalog.",
    );
  }
  return product;
}

/** Felicity's insurance provider wants Nigerian numbers as 234xxxxxxxxxx,
 * not 0xxxxxxxxxx — confirmed as a genuine requirement in the docs. */
export function toInternationalPhone(localPhone: string): string {
  const digits = localPhone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  return "234" + digits;
}

export type Policy = {
  policy_reference: string;
  policy_number: string;
  product_id: string;
  status: string;
  premium_naira: number;
  policy_document_url: string | null;
  start_date: string | null;
  expiration_date: string | null;
};

export function buyInsurance(input: {
  talent_ref: string;
  product_id: string;
  amount_naira?: number;
  [extra: string]: unknown;
}) {
  return call<{ success: true; policy: Policy }>("buy_insurance", input);
}

export function getPolicy(policy_reference: string) {
  return call<{ success: true; policy: Policy }>("get_policy", { policy_reference });
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
// Verified live 2026-09-02: this is the real flow for a customer who isn't
// (and shouldn't need to become) an onboarded talent — no BVN/NIN. Only the
// vendor needs to already be onboarded; their goods cut is auto-credited,
// and delivery/insurance are booked/bought automatically on payment.

export type Checkout = {
  checkout_reference: string;
  status: "awaiting_payment" | "settled" | string;
  goods_amount_naira: number;
  delivery_amount_naira: number;
  insurance_amount_naira: number;
  total_amount_naira: number;
  account_number: string;
  account_name: string;
  bank_name: string;
  expires_at: string;
  settlement_error: string | null;
  delivery_reference?: string | null;
  policy_reference?: string | null;
};

export function createCheckout(input: {
  order_ref: string;
  vendor_ref: string;
  goods_amount_naira: number;
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
  insurance?: {
    product_id: string;
    device_type: string;
    device_value: number;
    device_make: string;
    device_model: string;
    gender: string;
    date_of_birth: string;
    address: string;
    first_name: string;
    last_name: string;
    email: string;
    [extra: string]: unknown;
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
