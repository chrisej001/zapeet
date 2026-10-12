import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
// zapeet.app verified on Resend 2026-09-10 (DKIM + SPF via Namecheap DNS) —
// confirmed live with a real delivered send to an arbitrary recipient.
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "Zapeet <noreply@zapeet.app>";

export class ResendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResendError";
  }
}

function emailShell(headerAccent: string, bodyHtml: string) {
  return `
    <div style="background:#F7F4EE;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(27,31,59,0.1);">
        <div style="background:#1B1F3B;padding:24px 28px;">
          <span style="color:#F7F4EE;font-size:18px;font-weight:800;letter-spacing:-0.02em;">zapeet</span>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 4px;color:#5C6079;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">
            ${headerAccent}
          </p>
          ${bodyHtml}
          <p style="margin:20px 0 0;color:#5C6079;font-size:12px;line-height:1.5;">
            Paid instantly. Delivered same day. — Zapeet
          </p>
        </div>
      </div>
    </div>
  `;
}

/** Sent to the vendor once their split lands — the money went straight to
 * their own bank, so this is their receipt for it. */
export async function sendVendorPayoutEmail(input: {
  to: string;
  itemName: string;
  payoutNaira: number;
  bankName: string;
  accountNumber: string;
}) {
  const amount = `₦${input.payoutNaira.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
  const masked = input.accountNumber ? `••••${input.accountNumber.slice(-4)}` : "";
  const body = `
    <h1 style="margin:0 0 16px;color:#1B1F3B;font-size:22px;line-height:1.3;">
      You've been paid ${amount}
    </h1>
    <p style="margin:0 0 20px;color:#1B1F3B;font-size:15px;line-height:1.6;">
      A customer just paid for ${escapeHtml(input.itemName)}. Your payout has been sent to
      ${escapeHtml(input.bankName)} ${masked}, and a rider is being booked to collect the item.
    </p>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: `Paid: ${amount} for ${input.itemName} — Zapeet`,
      html: emailShell("Payout sent", body),
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as { id: string };
}

/** Sent to the customer once the courier books the delivery (right after
 * checkout_completed resolves a delivery_reference) — this is the only
 * proactive notice a customer gets of their pickup PIN and tracking link;
 * the checkout page itself doesn't poll for a post-payment success state. */
export async function sendDeliveryEmail(input: {
  to: string;
  firstName: string;
  itemName: string;
  deliveryPin: string;
  trackingUrl: string | null;
}) {
  const body = `
    <h1 style="margin:0 0 16px;color:#1B1F3B;font-size:22px;line-height:1.3;">
      Hi ${escapeHtml(input.firstName)}, your rider is on the way
    </h1>
    <p style="margin:0 0 20px;color:#1B1F3B;font-size:15px;line-height:1.6;">
      Your ${escapeHtml(input.itemName)} has been dispatched for same-day delivery. Give the rider this PIN
      at drop-off to confirm you received it.
    </p>
    <div style="background:#F7F4EE;border-radius:10px;padding:16px 18px;margin-bottom:24px;text-align:center;">
      <span style="color:#5C6079;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Delivery PIN</span>
      <div style="margin-top:4px;color:#1B1F3B;font-size:28px;font-weight:800;letter-spacing:0.1em;">${escapeHtml(input.deliveryPin)}</div>
    </div>
    ${
      input.trackingUrl
        ? `<a href="${input.trackingUrl}"
             style="display:block;text-align:center;background:#1B1F3B;color:#F7F4EE;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;">
            Track your delivery
          </a>`
        : `<p style="margin:0;color:#5C6079;font-size:13px;">Live tracking isn't available for this delivery.</p>`
    }
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: `Your ${input.itemName} is on the way — Zapeet`,
      html: emailShell("Delivery dispatched", body),
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as { id: string };
}

/** Sent to the vendor at the same time — so they have the customer's pickup
 * PIN and tracking link too without needing to open the admin dashboard
 * (which they can't — only admins can see /dashboard/admin/orders). */
export async function sendVendorDeliveryEmail(input: {
  to: string;
  itemName: string;
  customerName: string;
  deliveryPin: string;
  trackingUrl: string | null;
}) {
  const body = `
    <h1 style="margin:0 0 16px;color:#1B1F3B;font-size:22px;line-height:1.3;">
      Order dispatched: ${escapeHtml(input.itemName)}
    </h1>
    <p style="margin:0 0 20px;color:#1B1F3B;font-size:15px;line-height:1.6;">
      ${escapeHtml(input.customerName)}'s order is on its way. The rider will ask the customer for this PIN
      at drop-off.
    </p>
    <div style="background:#F7F4EE;border-radius:10px;padding:16px 18px;margin-bottom:24px;text-align:center;">
      <span style="color:#5C6079;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">Delivery PIN</span>
      <div style="margin-top:4px;color:#1B1F3B;font-size:28px;font-weight:800;letter-spacing:0.1em;">${escapeHtml(input.deliveryPin)}</div>
    </div>
    ${
      input.trackingUrl
        ? `<a href="${input.trackingUrl}"
             style="display:block;text-align:center;background:#1B1F3B;color:#F7F4EE;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;">
            Track this delivery
          </a>`
        : `<p style="margin:0;color:#5C6079;font-size:13px;">Live tracking isn't available for this delivery.</p>`
    }
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [input.to],
      subject: `Dispatched: ${input.itemName} — Zapeet`,
      html: emailShell("Order dispatched", body),
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as { id: string };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

// ---- Inbound: relay hello@zapeet.app mail to a real inbox ----
// Resend's receiving webhook only carries metadata (from/to/subject) — the
// actual body and attachments need a separate fetch by email_id, confirmed
// against their real API docs 2026-09-10.

export type ReceivedEmail = {
  id: string;
  from: string;
  to: string[];
  subject: string | null;
  html: string | null;
  text: string | null;
  created_at: string;
  attachments: { id: string; filename: string; content_type: string; size: number }[];
};

export async function getReceivedEmail(emailId: string): Promise<ReceivedEmail> {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as ReceivedEmail;
}

export async function getReceivedEmailAttachment(emailId: string, attachmentId: string) {
  const res = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments/${attachmentId}`, {
    headers: { Authorization: `Bearer ${RESEND_API_KEY}` },
  });
  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as { id: string; filename: string; content_type: string; size: number; download_url: string };
}

const FORWARD_TO = process.env.RESEND_FORWARD_TO || "chris@myfirstresponseai.com";

/** Relays a real received email (fetched by id) to FORWARD_TO, reattaching
 * any files rather than linking to Resend's short-lived download URLs. */
export async function forwardReceivedEmail(email: ReceivedEmail) {
  const attachments = await Promise.all(
    email.attachments.map(async (a) => {
      const meta = await getReceivedEmailAttachment(email.id, a.id);
      const fileRes = await fetch(meta.download_url);
      const buf = await fileRes.arrayBuffer();
      return { filename: a.filename, content: Buffer.from(buf).toString("base64") };
    }),
  );

  const originalBody =
    email.html ??
    (email.text ? `<pre style="white-space:pre-wrap;font-family:inherit;">${escapeHtml(email.text)}</pre>` : "");

  const html = `
    <div style="background:#F7F4EE;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(27,31,59,0.1);">
        <div style="background:#1B1F3B;padding:24px 28px;">
          <span style="color:#F7F4EE;font-size:18px;font-weight:800;letter-spacing:-0.02em;">zapeet</span>
        </div>
        <div style="padding:20px 28px;background:#F7F4EE;border-bottom:1px solid rgba(27,31,59,0.1);font-size:13px;color:#5C6079;">
          <div><strong style="color:#1B1F3B;">From:</strong> ${escapeHtml(email.from)}</div>
          <div><strong style="color:#1B1F3B;">To:</strong> ${escapeHtml(email.to.join(", "))}</div>
          <div><strong style="color:#1B1F3B;">Subject:</strong> ${escapeHtml(email.subject ?? "(no subject)")}</div>
        </div>
        <div style="padding:28px;">
          ${originalBody || "<p style='color:#5C6079;'>(empty message body)</p>"}
        </div>
      </div>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [FORWARD_TO],
      reply_to: email.from,
      subject: `Fwd: ${email.subject ?? "(no subject)"}`,
      html,
      attachments: attachments.length ? attachments : undefined,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new ResendError(res.status, json?.message ?? "Resend request failed");
  return json as { id: string };
}
