"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { LedgerEntry, LedgerEntryType } from "@/lib/felicity/client";
import { EyeIcon, EyeOffIcon, ArrowUpRightIcon, ArrowDownLeftIcon, SendIcon, LinkIcon } from "@/components/icons";

const CREDIT_TYPES = new Set<LedgerEntryType>(["inbound_credit", "checkout_payout", "refund", "settlement"]);

const PRIMARY_PRIORITY: LedgerEntryType[] = [
  "outbound_transfer",
  "checkout_payout",
  "inbound_credit",
  "refund",
  "settlement",
  "insurance_premium_debit",
  "delivery_fee_debit",
  "bill_payment",
  "payroll_disbursement",
  "transfer_fee",
  "stamp_duty",
  "bill_payment_fee",
  "payroll_fee",
];

const LABELS: Record<LedgerEntryType, string> = {
  outbound_transfer: "Money sent",
  checkout_payout: "Order payout",
  inbound_credit: "Money received",
  refund: "Refund",
  settlement: "Settlement",
  insurance_premium_debit: "Insurance premium",
  delivery_fee_debit: "Delivery fee",
  bill_payment: "Bill payment",
  payroll_disbursement: "Payroll",
  transfer_fee: "Transfer fee",
  stamp_duty: "Stamp duty",
  bill_payment_fee: "Bill payment fee",
  payroll_fee: "Payroll fee",
};

type Group = {
  key: string;
  primaryType: LedgerEntryType;
  netKobo: number;
  createdAt: string;
  entries: LedgerEntry[];
};

function groupTransactions(transactions: LedgerEntry[]): Group[] {
  const groups = new Map<string, Group>();
  transactions.forEach((entry, i) => {
    const ref = (entry.meta?.reference as string | undefined) ?? `__row_${i}`;
    const signed = CREDIT_TYPES.has(entry.entry_type) ? entry.amount_kobo : -entry.amount_kobo;
    const existing = groups.get(ref);
    if (!existing) {
      groups.set(ref, {
        key: ref,
        primaryType: entry.entry_type,
        netKobo: signed,
        createdAt: entry.created_at,
        entries: [entry],
      });
      return;
    }
    existing.netKobo += signed;
    existing.entries.push(entry);
    if (
      PRIMARY_PRIORITY.indexOf(entry.entry_type) !== -1 &&
      (PRIMARY_PRIORITY.indexOf(entry.entry_type) < PRIMARY_PRIORITY.indexOf(existing.primaryType) ||
        PRIMARY_PRIORITY.indexOf(existing.primaryType) === -1)
    ) {
      existing.primaryType = entry.entry_type;
    }
    if (entry.created_at < existing.createdAt) existing.createdAt = entry.created_at;
  });
  return Array.from(groups.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

function naira(kobo: number) {
  return `₦${(Math.abs(kobo) / 100).toLocaleString("en-NG")}`;
}

function counterparty(group: Group): string | null {
  const transfer = group.entries.find((e) => e.entry_type === "outbound_transfer");
  const name = transfer?.meta?.account_name as string | undefined;
  return name ?? null;
}

function relativeDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(date).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-NG", { day: "2-digit", month: "short" });
}

function CashflowChart({ transactions }: { transactions: LedgerEntry[] }) {
  const days = useMemo(() => {
    const buckets = new Map<string, number>();
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const t of transactions) {
      const day = t.created_at.slice(0, 10);
      if (!buckets.has(day)) continue;
      const signed = CREDIT_TYPES.has(t.entry_type) ? t.amount_kobo : -t.amount_kobo;
      buckets.set(day, (buckets.get(day) ?? 0) + signed);
    }
    return Array.from(buckets.entries()).map(([day, netKobo]) => ({ day, netKobo }));
  }, [transactions]);

  const max = Math.max(1, ...days.map((d) => Math.abs(d.netKobo)));
  const hasActivity = days.some((d) => d.netKobo !== 0);

  if (!hasActivity) {
    return (
      <div className="flex h-28 items-center justify-center rounded-[16px] border border-ink/10 bg-white text-xs text-ink-60">
        No activity in the last 14 days yet.
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-ink/10 bg-white p-4">
      <p className="mb-3 text-xs font-semibold text-ink-60">Last 14 days · net cashflow</p>
      <div className="flex h-20 items-end gap-1.5">
        {days.map((d) => {
          const h = Math.max(3, Math.round((Math.abs(d.netKobo) / max) * 72));
          const positive = d.netKobo >= 0;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center justify-end gap-1">
              <div
                className={`w-full rounded-[3px] ${positive ? "bg-marigold" : "bg-terracotta"}`}
                style={{ height: `${h}px`, opacity: d.netKobo === 0 ? 0.15 : 1 }}
                title={`${new Date(d.day).toLocaleDateString("en-NG")}: ${positive ? "+" : "-"}${naira(d.netKobo)}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function OverviewCard({
  businessName,
  accountNumber,
  bankName,
  balanceNaira,
  transactions,
}: {
  businessName: string;
  accountNumber: string | null;
  bankName: string | null;
  balanceNaira: number | null;
  transactions: LedgerEntry[];
}) {
  const [hidden, setHidden] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);

  useEffect(() => {
    setHidden(localStorage.getItem("zapeet_balance_hidden") === "1");
  }, []);

  function toggleHidden() {
    setHidden((prev) => {
      const next = !prev;
      localStorage.setItem("zapeet_balance_hidden", next ? "1" : "0");
      return next;
    });
  }

  const groups = useMemo(() => groupTransactions(transactions), [transactions]);

  return (
    <>
      <h1 className="mb-6 text-xl">{businessName}</h1>

      <div className="mb-4 rounded-[16px] border border-ink/10 bg-white p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-ink-60">Account balance</span>
          <button onClick={toggleHidden} className="text-ink-60" aria-label="Toggle balance visibility">
            {hidden ? <EyeOffIcon className="h-4.5 w-4.5" /> : <EyeIcon className="h-4.5 w-4.5" />}
          </button>
        </div>
        <p className="text-3xl font-extrabold text-ink">
          {balanceNaira == null ? "—" : hidden ? "₦••••••" : `₦${balanceNaira.toLocaleString("en-NG")}`}
        </p>
        {accountNumber && (
          <p className="mt-1 text-sm text-ink-60">
            {bankName} · {accountNumber}
          </p>
        )}
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <Link
          href="/dashboard/send"
          className="flex items-center justify-center gap-2 rounded-[10px] border border-ink/15 bg-white py-3 text-sm font-semibold text-ink"
        >
          <SendIcon className="h-4 w-4" />
          Send money
        </Link>
        <Link
          href="/dashboard/links/new"
          className="flex items-center justify-center gap-2 rounded-[10px] bg-ink py-3 text-sm font-semibold text-paper"
        >
          <LinkIcon className="h-4 w-4" />
          Generate link
        </Link>
      </div>

      <div className="mb-6">
        <CashflowChart transactions={transactions} />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-ink">Recent activity</h2>
      <div className="flex flex-col gap-2.5">
        {!groups.length && (
          <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
            No activity yet.
          </div>
        )}
        {groups.slice(0, 15).map((g) => {
          const positive = g.netKobo >= 0;
          const counterpartyName = counterparty(g);
          return (
            <button
              key={g.key}
              onClick={() => setSelected(g)}
              className="flex items-center gap-3 rounded-[14px] border border-ink/10 bg-white p-4 text-left"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  positive ? "bg-marigold/15 text-marigold-ink" : "bg-terracotta/15 text-terracotta"
                }`}
              >
                {positive ? <ArrowDownLeftIcon className="h-4 w-4" /> : <ArrowUpRightIcon className="h-4 w-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {LABELS[g.primaryType]}
                  {counterpartyName ? ` · ${counterpartyName}` : ""}
                </p>
                <p className="text-xs text-ink-60">{relativeDay(g.createdAt)}</p>
              </div>
              <span className={`shrink-0 text-sm font-bold ${positive ? "text-marigold-ink" : "text-terracotta"}`}>
                {positive ? "+" : "-"}
                {naira(g.netKobo)}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-ink/40 px-0"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-sm rounded-t-[20px] bg-paper p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="mb-1 text-base font-bold text-ink">
              {LABELS[selected.primaryType]}
              {counterparty(selected) ? ` · ${counterparty(selected)}` : ""}
            </p>
            <p className="mb-5 text-sm text-ink-60">
              {new Date(selected.createdAt).toLocaleString("en-NG", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            <div className="flex flex-col gap-2.5 rounded-[10px] bg-white p-4 text-sm">
              {selected.entries.map((e, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-ink-60">{LABELS[e.entry_type]}</span>
                  <span className="font-semibold text-ink">
                    {CREDIT_TYPES.has(e.entry_type) ? "+" : "-"}
                    {naira(e.amount_kobo)}
                  </span>
                </div>
              ))}
              <div className="h-px bg-ink/10" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">Net</span>
                <span className={`font-bold ${selected.netKobo >= 0 ? "text-marigold-ink" : "text-terracotta"}`}>
                  {selected.netKobo >= 0 ? "+" : "-"}
                  {naira(selected.netKobo)}
                </span>
              </div>
            </div>
            {selected.key && !selected.key.startsWith("__row_") && (
              <p className="mt-3 text-xs text-ink-60">Ref {selected.key}</p>
            )}
            <button
              onClick={() => setSelected(null)}
              className="mt-5 w-full rounded-[10px] border border-ink/15 py-3 text-sm font-semibold text-ink"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
