import Link from "next/link";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../require-admin-page";
import { ListRow } from "../list-row";

export default async function AdminPoliciesPage() {
  const { admin } = await requireAdminPage();

  const { data: policies } = await admin
    .from("insurance_policies")
    .select("id, order_id, felicity_policy_number, premium_naira, status, created_at, vendors(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Insurance policies ({policies?.length ?? 0})</h1>

        <div className="flex flex-col gap-3">
          {!policies?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No policies yet.
            </div>
          )}
          {policies?.map((p) => (
            <ListRow
              key={p.id}
              href={`/dashboard/admin/orders/${p.order_id}`}
              title={p.felicity_policy_number ?? "Pending policy"}
              subtitle={`${(p.vendors as unknown as { business_name: string } | null)?.business_name ?? "—"} · ${fmtDateTime(p.created_at)}`}
              status={p.status}
              statusClass={statusColor(p.status)}
              right={fmtNaira(p.premium_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
