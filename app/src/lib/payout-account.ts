import "server-only";
import { listBanks, resolveAccount, FelicityError } from "@/lib/felicity/client";

export type PayoutAccount = {
  payout_bank_code: string;
  payout_bank_name: string;
  payout_account_number: string;
  payout_account_name: string;
};

/** Verifies a vendor-entered bank account with a live name-enquiry and
 * returns the columns to store. The resolved name is whatever the bank says
 * — it isn't required to match the vendor's business name. */
export async function verifyPayoutAccount(
  bankCode: string,
  accountNumber: string,
): Promise<{ ok: true; account: PayoutAccount } | { ok: false; error: string }> {
  if (!bankCode) return { ok: false, error: "Pick your bank." };
  if (!/^\d{10}$/.test(accountNumber)) return { ok: false, error: "Account number must be 10 digits." };

  try {
    const [{ account }, { banks }] = await Promise.all([resolveAccount(accountNumber, bankCode), listBanks()]);
    const bankName = banks.find((b) => b.code === bankCode)?.name ?? bankCode;
    return {
      ok: true,
      account: {
        payout_bank_code: bankCode,
        payout_bank_name: bankName,
        payout_account_number: accountNumber,
        payout_account_name: account.account_name,
      },
    };
  } catch (err) {
    const message = err instanceof FelicityError ? err.message : "Could not verify that account — try again.";
    return { ok: false, error: message };
  }
}
