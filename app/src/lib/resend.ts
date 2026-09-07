import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
// No custom domain verified on the Resend account yet (checked live
// 2026-09-07: zero domains) — resend.dev is Resend's shared sender that
// works for any recipient without domain verification. Swap this once a
// domain (e.g. mail.zapeet.com) is verified.
const FROM_ADDRESS = process.env.RESEND_FROM_ADDRESS || "Zapeet <onboarding@resend.dev>";

export class ResendError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ResendError";
  }
}

export async function sendPolicyEmail(input: {
  to: string;
  firstName: string;
  itemName: string;
  policyNumber: string;
  premiumNaira: number;
  documentUrl: string;
}) {
  const premiumFormatted = `₦${input.premiumNaira.toLocaleString("en-NG")}`;

  const html = `
    <div style="background:#F7F4EE;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(27,31,59,0.1);">
        <div style="background:#1B1F3B;padding:24px 28px;">
          <span style="color:#F7F4EE;font-size:18px;font-weight:800;letter-spacing:-0.02em;">zapeet</span>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 4px;color:#5C6079;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;">
            Your device is insured
          </p>
          <h1 style="margin:0 0 16px;color:#1B1F3B;font-size:22px;line-height:1.3;">
            Hi ${escapeHtml(input.firstName)}, your policy is ready
          </h1>
          <p style="margin:0 0 20px;color:#1B1F3B;font-size:15px;line-height:1.6;">
            Your ${escapeHtml(input.itemName)} is now covered. Here's a copy of your policy for your records.
          </p>
          <div style="background:#F7F4EE;border-radius:10px;padding:16px 18px;margin-bottom:24px;">
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
              <span style="color:#5C6079;">Policy number</span>
              <strong style="color:#1B1F3B;">${escapeHtml(input.policyNumber)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:6px 0;font-size:14px;">
              <span style="color:#5C6079;">Premium</span>
              <strong style="color:#1B1F3B;">${premiumFormatted}</strong>
            </div>
          </div>
          <a href="${input.documentUrl}"
             style="display:block;text-align:center;background:#1B1F3B;color:#F7F4EE;text-decoration:none;padding:14px;border-radius:10px;font-weight:600;font-size:14px;">
            View your policy document
          </a>
          <p style="margin:20px 0 0;color:#5C6079;font-size:12px;line-height:1.5;">
            Protected. Instant. Local. — Zapeet
          </p>
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
      to: [input.to],
      subject: `Your Zapeet insurance policy for ${input.itemName} is ready`,
      html,
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new ResendError(res.status, json?.message ?? "Resend request failed");
  }
  return json as { id: string };
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
