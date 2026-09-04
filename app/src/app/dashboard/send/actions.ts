"use server";

import { createClient } from "@/lib/supabase/server";
import { send, resolveAccount, FelicityError } from "@/lib/felicity/client";

export type SendMoneyState = {
  error: string | null;
  success: {
    reference: string;
    feeNaira: number;
    stampDutyNaira: number;
    newBalanceNaira: number;
  } | null;
};

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

export async function sendMoney(_prev: SendMoneyState, formData: FormData): Promise<SendMoneyState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired — please log in again.", success: null };

  const amount = Number(formData.get("amount_naira"));
  const bankCode = String(formData.get("bank_code") ?? "").trim();
  const accountNumber = String(formData.get("account_number") ?? "").trim();

  if (!amount || amount <= 0) return { error: "Enter a valid amount.", success: null };
  if (!bankCode) return { error: "Pick a bank.", success: null };
  if (!/^\d{10}$/.test(accountNumber)) {
    return { error: "Account number must be 10 digits.", success: null };
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("felicity_talent_ref")
    .eq("id", user.id)
    .single();

  if (!vendor?.felicity_talent_ref) {
    return { error: "Your Felicity account isn't set up yet.", success: null };
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
      talent_ref: vendor.felicity_talent_ref,
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
