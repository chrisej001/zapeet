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

// ---- Insurance ----

export type InsuranceProduct = {
  product_id: string;
  category: { name: string };
  base_price: number;
  [key: string]: unknown;
};

export function listInsuranceProducts() {
  return call<{ success: true; products: InsuranceProduct[] } & Record<string, unknown>>(
    "list_insurance_products",
  );
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
