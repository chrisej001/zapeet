import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "svix";
import { getReceivedEmail, forwardReceivedEmail } from "@/lib/resend";

// Resend signs inbound webhooks via Svix — svix-id/svix-timestamp/svix-signature
// headers, verified against the signing secret from the webhook's creation
// response. Confirmed against Resend's real docs 2026-09-10.
//
// svix@2.4's Webhook.verify() return type is `undefined` — it throws on an
// invalid signature and returns nothing on success (validation only, it
// doesn't hand back the parsed payload despite what some docs/examples
// imply). Found via a real deployed crash: every live delivery hit a bare
// 500 reading `.type` off what verify() actually returned (undefined),
// while a hand-crafted bad-signature test worked fine since it only
// exercised the throw path. Parse rawBody ourselves after verifying.
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET!;

  const svixHeaders = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  try {
    new Webhook(secret).verify(rawBody, svixHeaders);
  } catch {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody) as { type: string; data: { email_id: string } };

  if (payload.type === "email.received") {
    try {
      const email = await getReceivedEmail(payload.data.email_id);
      await forwardReceivedEmail(email);
    } catch (err) {
      // Durable failure here just means a missed forward, not a broken
      // customer-facing flow — log and still 200 so Resend doesn't retry
      // into a pile of duplicate relay attempts.
      console.error("inbound email relay failed", payload.data.email_id, err);
    }
  }

  return NextResponse.json({ received: true });
}
