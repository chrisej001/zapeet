import Link from "next/link";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../require-admin-page";
import { ListRow } from "../list-row";

export default async function AdminDeliveriesPage() {
  const { admin } = await requireAdminPage();

  const { data: deliveries } = await admin
    .from("deliveries")
    .select("id, order_id, felicity_delivery_reference, fee_naira, status, created_at, vendors(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Deliveries ({deliveries?.length ?? 0})</h1>

        <div className="flex flex-col gap-3">
          {!deliveries?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No deliveries yet.
            </div>
          )}
          {deliveries?.map((d) => (
            <ListRow
              key={d.id}
              href={`/dashboard/admin/orders/${d.order_id}`}
              title={d.felicity_delivery_reference ?? "Pending delivery"}
              subtitle={`${(d.vendors as unknown as { business_name: string } | null)?.business_name ?? "—"} · ${fmtDateTime(d.created_at)}`}
              status={d.status}
              statusClass={statusColor(d.status)}
              right={fmtNaira(d.fee_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
