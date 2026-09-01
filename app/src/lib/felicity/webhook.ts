import "server-only";
import crypto from "node:crypto";

/**
 * Verifies the `x-felicity-signature` header against the raw request body.
 *
 * The Felicity docs specify HMAC-SHA256 signing shared across their proxy
 * families, cross-referencing a companion brief we don't have on hand, so
 * this assumes the standard convention (hex digest of the raw body, keyed
 * by the webhook signing secret) rather than a confirmed spec. Verify this
 * against a real delivery (e.g. via `simulate_funding` in test mode once a
 * public URL is registered) and adjust if Felicity's actual format differs.
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
