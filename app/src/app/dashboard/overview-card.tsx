"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useHiddenAmount } from "@/lib/use-hidden-amount";
import { EyeIcon, EyeOffIcon, ArrowDownLeftIcon, LinkIcon } from "@/components/icons";

export type OverviewOrder = {
  id: string;
  paidAt: string;
  payoutNaira: number;
  payoutStatus: string;
  customerName: string | null;
  itemName: string;
};

const naira = (n: number) => `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;

function relativeDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

function PayoutChart({ orders }: { orders: OverviewOrder[] }) {
  const days = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      if (o.payoutStatus !== "paid") continue;
      const day = o.paidAt.slice(0, 10);
      if (!buckets.has(day)) continue;
      buckets.set(day, (buckets.get(day) ?? 0) + o.payoutNaira);
    }
    return Array.from(buckets.entries()).map(([day, total]) => ({ day, total }));
  }, [orders]);

  const max = Math.max(1, ...days.map((d) => d.total));
  if (!days.some((d) => d.total > 0)) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[16px] border border-ink/10 bg-white text-xs text-ink-60">
        No payouts in the last 14 days yet.
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-ink/10 bg-white p-4">
      <p className="mb-3 text-xs font-semibold text-ink-60">Last 14 days · payouts</p>
      <div className="flex h-20 items-end gap-1.5">
        {days.map((d) => (
          <div key={d.day} className="flex flex-1 flex-col items-center justify-end">
            <div
              className="w-full rounded-[3px] bg-marigold"
              style={{ height: `${Math.max(3, Math.round((d.total / max) * 72))}px`, opacity: d.total === 0 ? 0.15 : 1 }}
              title={`${new Date(d.day).toLocaleDateString("en-NG")}: ${naira(d.total)}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Vendors don't hold a balance with us anymore — every order pays straight
 * to their bank — so the headline is what's been paid out, not a wallet. */
export function OverviewCard({
  businessName,
  payoutBankName,
  payoutAccountNumber,
  orders,
}: {
  businessName: string;
  payoutBankName: string | null;
  payoutAccountNumber: string | null;
  orders: OverviewOrder[];
}) {
  const [hidden, toggleHidden] = useHiddenAmount();



  const totalPaidOut = orders.filter((o) => o.payoutStatus === "paid").reduce((sum, o) => sum + o.payoutNaira, 0);
  const pendingCount = orders.filter((o) => o.payoutStatus !== "paid").length;

  return (
    <>
      <h1 className="mb-6 text-xl">{businessName}</h1>

      <div className="mb-4 rounded-[16px] border border-ink/10 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-ink-60">Total paid out to you</span>
          <button onClick={toggleHidden} className="text-ink-60" aria-label="Toggle amount visibility">
            {hidden ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
        <p className="text-3xl font-extrabold text-ink">{hidden ? "₦••••••" : naira(totalPaidOut)}</p>
        {payoutAccountNumber && (
          <p className="mt-1 text-sm text-ink-60">
            Paid to {payoutBankName} · {payoutAccountNumber}
          </p>
        )}
        {pendingCount > 0 && (
          <p className="mt-2 text-xs font-semibold text-terracotta">
            {pendingCount} payout{pendingCount === 1 ? "" : "s"} need attention — we&apos;re on it.
          </p>
        )}
      </div>

      <Link
        href="/dashboard/links/new"
        className="mb-6 flex items-center justify-center gap-2 rounded-[10px] bg-ink py-3 text-sm font-semibold text-paper"
      >
        <LinkIcon className="h-4 w-4" />
        Generate payment link
      </Link>

      <div className="mb-6">
        <PayoutChart orders={orders} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">Recent payouts</h2>
      <div className="flex flex-col gap-2.5">
        {!orders.length && (
          <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
            No paid orders yet — share a payment link to get your first one.
          </div>
        )}
        {orders.slice(0, 15).map((o) => (
          <Link
            key={o.id}
            href={`/dashboard/orders/${o.id}`}
            className="flex items-center gap-3 rounded-[14px] border border-ink/10 bg-white p-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-marigold/15 text-marigold-ink">
              <ArrowDownLeftIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">
                {o.itemName}
                {o.customerName ? ` · ${o.customerName}` : ""}
              </p>
              <p className={`text-xs ${o.payoutStatus === "paid" ? "text-ink-60" : "font-semibold text-terracotta"}`}>
                {o.payoutStatus === "paid" ? relativeDay(o.paidAt) : "Payout pending"}
              </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-marigold-ink">+{naira(o.payoutNaira)}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
