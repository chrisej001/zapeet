import "server-only";
import { RUBIES_MFB_BANK_CODE } from "@/lib/felicity/client";

/** Where the fee is paid — the live Felicity/Rubies account of the Zapeet
 * Technologies Ltd login (chris.zapeet@gmail.com). talent_ref is kept so the
 * admin dashboard can show its balance and send money out of it. */
export const ZAPEET_FEE_ACCOUNT = {
  talent_ref: "f94fb2c0-415d-4cd7-adc1-fd1b2b3d0d9b",
  account_number: "8881741065",
  bank_code: RUBIES_MFB_BANK_CODE,
  bank_name: "Rubies MFB",
  account_name: "Christopher Emelife Jnr",
};
