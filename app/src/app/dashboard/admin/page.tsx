import Link from "next/link";
import { getTalent, getTransactions } from "@/lib/felicity/client";
import { ZAPEET_FEE_ACCOUNT } from "@/lib/zapeet-fee";
import { requireAdminPage, fmtNaira } from "./require-admin-page";
import { FeeAccountCard } from "./fee-account-card";
import { DemoModeCard } from "./demo-mode-card";

export default async function AdminPage() {
  const { user, admin } = await requireAdminPage();

  // Demo-mode records never count here — they're not real business.
  const [vendorsCount, ordersCount, deliveriesCount, linksCount, paidOrders, failedPayouts, me, myDemoLinks] =
    await Promise.all([
      admin.from("vendors").select("id", { count: "exact", head: true }),
      admin.from("orders").select("id", { count: "exact", head: true }).eq("is_demo", false),
      admin.from("deliveries").select("id", { count: "exact", head: true }).eq("is_demo", false),
      admin.from("payment_links").select("id", { count: "exact", head: true }).eq("is_demo", false),
      admin.from("orders").select("zapeet_fee_naira").eq("payment_status", "paid").eq("is_demo", false),
      admin
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("payout_status", "failed")
        .eq("is_demo", false),
      admin.from("vendors").select("business_name, demo_mode").eq("id", user.id).single(),
      admin
        .from("payment_links")
        .select("id", { count: "exact", head: true })
        .eq("vendor_id", user.id)
        .eq("is_demo", true),
    ]);

  const feesEarned = (paidOrders.data ?? []).reduce((sum, o) => sum + Number(o.zapeet_fee_naira ?? 0), 0);

  // The fee account is a live-mode talent; a test key can't see it, so
  // both calls just come back empty rather than breaking the page.
  const [talentResult, txResult] = await Promise.allSettled([
    getTalent(ZAPEET_FEE_ACCOUNT.talent_ref),
    getTransactions(ZAPEET_FEE_ACCOUNT.talent_ref),
  ]);
  const balanceNaira = talentResult.status === "fulfilled" ? talentResult.value.talent.balance_kobo / 100 : null;
  const transactions = txResult.status === "fulfilled" ? txResult.value.transactions : [];

  const stats = [
    { label: "Vendors", count: vendorsCount.count ?? 0, href: "/dashboard/admin/vendors" },
    { label: "Orders", count: ordersCount.count ?? 0, href: "/dashboard/admin/orders" },
    { label: "Deliveries", count: deliveriesCount.count ?? 0, href: "/dashboard/admin/deliveries" },
    { label: "Payment links", count: linksCount.count ?? 0, href: "/dashboard/admin/links" },
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Admin</h1>

        <div className="mb-3 grid grid-cols-2 gap-3">
          {stats.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="flex flex-col gap-1 rounded-[16px] border border-ink/10 bg-white p-4 hover:border-ink/30"
            >
              <span className="text-2xl font-extrabold text-ink">{s.count}</span>
              <span className="text-xs font-medium text-ink-60">{s.label}</span>
            </Link>
          ))}
        </div>

        <div className="mb-8 flex flex-col gap-1 rounded-[16px] border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-60">Fees earned (all paid orders)</span>
            <span className="font-bold text-ink">{fmtNaira(feesEarned)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-ink-60">Failed vendor payouts</span>
            <span className={`font-bold ${(failedPayouts.count ?? 0) > 0 ? "text-terracotta" : "text-ink"}`}>
              {failedPayouts.count ?? 0}
            </span>
          </div>
        </div>

        <h2 className="mb-3 text-sm font-semibold text-ink">Your account mode</h2>
        <DemoModeCard
          vendorId={user.id}
          businessName={me.data?.business_name ?? "Your account"}
          demoMode={me.data?.demo_mode ?? false}
          demoLinkCount={myDemoLinks.count ?? 0}
        />

        <FeeAccountCard
          accountNumber={ZAPEET_FEE_ACCOUNT.account_number}
          bankName={ZAPEET_FEE_ACCOUNT.bank_name}
          balanceNaira={balanceNaira}
          transactions={transactions}
        />
      </div>
    </div>
  );
}
