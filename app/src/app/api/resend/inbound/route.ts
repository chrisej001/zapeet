import { NextResponse, type NextRequest } from "next/server";
import { Webhook } from "svix";
import { getReceivedEmail, forwardReceivedEmail } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";

// TEMP diagnostic — real Resend webhook deliveries are hitting a bare 500
// with no response body (confirmed via Resend's own delivery log), but a
// hand-crafted bad-signature request correctly gets our 401. No way to read
// Vercel function logs on this tier, so log the real exception somewhere
// queryable directly. Remove once the real cause is found and fixed.
async function debugLog(stage: string, extra: Record<string, unknown>) {
  try {
    const admin = createAdminClient();
    await admin.from("felicity_webhook_events").insert({
      event_type: `debug.inbound_${stage}`,
      payload: extra,
    });
  } catch {
    // best-effort only
  }
}

// Resend signs inbound webhooks via Svix — svix-id/svix-timestamp/svix-signature
// headers, verified against the signing secret from the webhook's creation
// response. Confirmed against Resend's real docs 2026-09-10.
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET!;

    const svixHeaders = {
      "svix-id": req.headers.get("svix-id") ?? "",
      "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
      "svix-signature": req.headers.get("svix-signature") ?? "",
    };

    await debugLog("received", { hasSecret: !!secret, headers: svixHeaders, bodyLen: rawBody.length });

    let payload: { type: string; data: { email_id: string } };
    try {
      payload = new Webhook(secret).verify(rawBody, svixHeaders) as unknown as typeof payload;
    } catch (err) {
      await debugLog("signature_failed", { error: err instanceof Error ? err.message : String(err) });
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    await debugLog("verified", { type: payload.type, emailId: payload.data?.email_id });

    if (payload.type === "email.received") {
      try {
        const email = await getReceivedEmail(payload.data.email_id);
        await debugLog("fetched_email", { emailId: email.id, from: email.from });
        const result = await forwardReceivedEmail(email);
        await debugLog("forwarded", { resendId: result.id });
      } catch (err) {
        await debugLog("relay_failed", {
          emailId: payload.data.email_id,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    await debugLog("top_level_crash", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
