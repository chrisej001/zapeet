import Link from "next/link";
import { requireAdminPage, fmtNaira, fmtDateTime, statusColor } from "../require-admin-page";
import { ListRow } from "../list-row";

export default async function AdminLinksPage() {
  const { admin } = await requireAdminPage();

  const { data: links } = await admin
    .from("payment_links")
    .select("id, item_name, amount_naira, flow, status, created_at, vendors(business_name)")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Payment links ({links?.length ?? 0})</h1>

        <div className="flex flex-col gap-3">
          {!links?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No links yet.
            </div>
          )}
          {links?.map((l) => (
            <ListRow
              key={l.id}
              href={`/dashboard/admin/links/${l.id}`}
              title={l.item_name}
              subtitle={`${(l.vendors as unknown as { business_name: string } | null)?.business_name ?? "—"} · ${fmtDateTime(l.created_at)}`}
              status={l.status}
              statusClass={statusColor(l.status)}
              right={fmtNaira(l.amount_naira)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
