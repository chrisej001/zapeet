import Link from "next/link";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../require-admin-page";
import { ListRow } from "../list-row";

export default async function AdminOrdersPage() {
  const { admin } = await requireAdminPage();

  const { data: orders } = await admin
    .from("orders")
    .select(
      "id, total_amount_naira, payment_status, created_at, customer_first_name, customer_last_name, vendors(business_name)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Orders ({orders?.length ?? 0})</h1>

        <div className="flex flex-col gap-3">
          {!orders?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No orders yet.
            </div>
          )}
          {orders?.map((o) => (
            <ListRow
              key={o.id}
              href={`/dashboard/admin/orders/${o.id}`}
              title={`${o.customer_first_name ?? ""} ${o.customer_last_name ?? ""}`.trim() || "Customer"}
              subtitle={`${(o.vendors as unknown as { business_name: string } | null)?.business_name ?? "—"} · ${fmtDateTime(o.created_at)}`}
              status={o.payment_status}
              statusClass={statusColor(o.payment_status)}
              right={fmtNaira(o.total_amount_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
