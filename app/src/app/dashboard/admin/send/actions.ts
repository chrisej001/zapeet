"use server";

import { send, resolveAccount, FelicityError } from "@/lib/felicity/client";
import { ZAPEET_FEE_ACCOUNT } from "@/lib/zapeet-fee";
import { requireAdmin } from "../require-admin-page";

export type SendMoneyState = {
  error: string | null;
  success: {
    reference: string;
    feeNaira: number;
    stampDutyNaira: number;
    newBalanceNaira: number;
  } | null;
};

/** Withdraws from Zapeet's fee account — the Felicity balance every
 * order's 2% fee lands in. Admin-only. */
export async function sendMoney(_prev: SendMoneyState, formData: FormData): Promise<SendMoneyState> {
  try {
    await requireAdmin();
  } catch {
    return { error: "Not authorized.", success: null };
  }

  const amount = Number(formData.get("amount_naira"));
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();

  if (!amount || amount <= 0) return { error: "Enter a valid amount.", success: null };
  if (!bankCode) return { error: "Pick a bank.", success: null };
  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "Account number must be 10 digits.", success: null };
  }

  // Re-resolve server-side at submit time — authoritative, not a client-
  // supplied name — so the confirm screen can't be tampered with.
  let accountName: string;
  try {
    const { account } = await resolveAccount(accountNumber, bankCode);
    accountName = account.account_name;
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Could not verify account.";
    return { error: message, success: null };
  }

  try {
    const result = await send({
      talent_ref: ZAPEET_FEE_ACCOUNT.talent_ref,
      amount_naira: amount,
      account_number: accountNumber,
      bank_code: bankCode,
      account_name: accountName,
    });

    return {
      error: null,
      success: {
        reference: result.reference,
        feeNaira: result.fee_naira,
        stampDutyNaira: result.stamp_duty_naira,
        newBalanceNaira: result.new_balance_kobo / 100,
      },
    };
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Transfer failed — try again.";
    return { error: message, success: null };
  }
}
