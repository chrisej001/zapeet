import "server-only";
import crypto from "node:crypto";

/**
 * Verifies the `x-felicity-signature` header against the raw request body:
 * hex HMAC-SHA256 of the raw body, keyed by the webhook signing secret.
 * Confirmed against a real Felicity-delivered webhook (2026-09-02, via
 * simulate_funding against the production URL) — not just the docs.
 */
export function verifyFelicitySignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const secret = process.env.FELICITY_WEBHOOK_SECRET!;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
