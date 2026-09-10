import Link from "next/link";
import { getTalent } from "@/lib/felicity/client";
import { resolveVendorFelicityAccount } from "@/lib/felicity/vendor-identity";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "./require-admin-page";
import { SimulateFundForm } from "./simulate-fund-form";

export default async function AdminPage() {
  const { user, admin } = await requireAdminPage();

  const [vendorsCount, ordersCount, policiesCount, deliveriesCount, linksCount] = await Promise.all([
    admin.from("vendors").select("id", { count: "exact", head: true }),
    admin.from("orders").select("id", { count: "exact", head: true }),
    admin.from("insurance_policies").select("id", { count: "exact", head: true }),
    admin.from("deliveries").select("id", { count: "exact", head: true }),
    admin.from("payment_links").select("id", { count: "exact", head: true }),
  ]);

  // The treasury IS the admin vendor's own account — whichever mode the
  // currently-deployed key resolves to (see vendor-identity.ts) — not a
  // separately onboarded identity. Nothing to "set up" anymore.
  const account = await resolveVendorFelicityAccount(admin, user.id);

  let balanceNaira: number | null = null;
  if (account) {
    try {
      const { talent } = await getTalent(account.felicity_talent_ref);
      balanceNaira = talent.balance_kobo / 100;
    } catch {
      balanceNaira = null;
    }
  }

  const { data: rebates } = await admin
    .from("orders")
    .select(
      "id, vendor_rebate_naira, rebate_status, rebate_payout_reference, rebate_paid_at, rebate_error, created_at, vendors(business_name)",
    )
    .neq("rebate_status", "not_applicable")
    .order("created_at", { ascending: false })
    .limit(20);

  const stats = [
    { label: "Vendors", count: vendorsCount.count ?? 0, href: "/dashboard/admin/vendors" },
    { label: "Orders", count: ordersCount.count ?? 0, href: "/dashboard/admin/orders" },
    { label: "Insurance policies", count: policiesCount.count ?? 0, href: "/dashboard/admin/policies" },
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

        <div className="mb-8 grid grid-cols-2 gap-3">
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

        <h2 className="mb-3 text-sm font-semibold text-ink">Treasury &amp; rebates</h2>

        {!account ? (
          <div className="mb-6 rounded-[16px] border border-ink/10 bg-white p-5 text-sm text-ink-60">
            No Felicity account resolved for the current key's mode — onboard the admin vendor for this
            mode first.
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 rounded-[16px] border border-ink/10 bg-white p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-60">Balance</span>
                <span className="text-2xl font-extrabold text-ink">
                  {balanceNaira == null ? "—" : fmtNaira(balanceNaira)}
                </span>
              </div>
              <div className="h-px bg-ink/10" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-60">Mode</span>
                <span
                  className={`font-semibold ${account.mode === "live" ? "text-marigold-ink" : "text-ink"}`}
                >
                  {account.mode === "live" ? "Live" : "Test"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-60">Account number</span>
                <span className="font-semibold text-ink">{account.felicity_account_number}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink-60">Bank</span>
                <span className="font-semibold text-ink">{account.felicity_bank_name}</span>
              </div>
              <p className="text-xs text-ink-60">
                Fund this account by transferring into it, same as any vendor's account — vendor rebates
                (2.5% of the insurance premium on insured orders) pay out of this balance automatically.
              </p>
            </div>

            {account.mode === "test" && <SimulateFundForm />}

            <p className="mt-8 mb-3 text-sm font-semibold text-ink">Recent rebates</p>
            <div className="flex flex-col gap-3">
              {!rebates?.length && (
                <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
                  No rebates yet.
                </div>
              )}
              {rebates?.map((r) => (
                <div key={r.id} className="rounded-[14px] border border-ink/10 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-ink">
                      {(r.vendors as unknown as { business_name: string } | null)?.business_name}
                    </span>
                    <span className="text-sm font-bold text-ink">{fmtNaira(r.vendor_rebate_naira)}</span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className={`text-xs font-semibold ${statusColor(r.rebate_status)}`}>
                      {r.rebate_status}
                    </span>
                    <span className="text-xs text-ink-60">{fmtDateTime(r.created_at)}</span>
                  </div>
                  {r.rebate_error && <p className="mt-1.5 text-xs text-terracotta">{r.rebate_error}</p>}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
