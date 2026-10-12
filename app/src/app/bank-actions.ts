"use server";

import { resolveAccount, FelicityError } from "@/lib/felicity/client";

/** Live name-enquiry for the bank-account pickers (vendor payout setup,
 * admin send-money) — shown before anything is saved or sent so a typo
 * never silently points money at the wrong account. */
export async function resolveAccountAction(
  accountNumber: string,
  bankCode: string,
): Promise<{ ok: true; accountName: string } | { ok: false; error: string }> {
  if (!/^\d{10}$/.test(accountNumber) || !bankCode) {
    return { ok: false, error: "" };
  }
  try {
    const { account } = await resolveAccount(accountNumber, bankCode);
    return { ok: true, accountName: account.account_name };
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Could not verify account.";
    return { ok: false, error: message };
  }
}
