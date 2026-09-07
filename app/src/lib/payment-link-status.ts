export type PaymentLinkStatus = "active" | "paid" | "expired" | "cancelled";

type LinkRow = { status: string; expires_at: string | null };

/** payment_links.status only ever gets set to 'active' | 'paid' | 'cancelled'
 * by application code — 'expired' is never written to the row, it's derived
 * here from expires_at so there's no cron/background job needed to keep it
 * accurate. */
export function effectiveLinkStatus(link: LinkRow): PaymentLinkStatus {
  if (link.status === "active" && link.expires_at && new Date(link.expires_at) < new Date()) {
    return "expired";
  }
  return link.status as PaymentLinkStatus;
}

export function isLinkUsable(link: LinkRow): boolean {
  return effectiveLinkStatus(link) === "active";
}

export const LINK_STATUS_LABEL: Record<PaymentLinkStatus, string> = {
  active: "Awaiting payment",
  paid: "Paid",
  expired: "Expired",
  cancelled: "Cancelled",
};
