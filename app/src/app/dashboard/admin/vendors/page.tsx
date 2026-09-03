import Link from "next/link";
import { requireAdminPage, fmtDateTime, statusColor } from "../require-admin-page";
import { ListRow } from "../list-row";

export default async function AdminVendorsPage() {
  const { admin } = await requireAdminPage();

  const { data: vendors } = await admin
    .from("vendors")
    .select("id, business_name, first_name, last_name, phone, felicity_kyc_status, is_admin, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <Link href="/dashboard/admin" className="text-sm font-medium text-ink-60">
          ← Back
        </Link>
        <h1 className="mt-4 mb-6 text-xl">Vendors ({vendors?.length ?? 0})</h1>

        <div className="flex flex-col gap-3">
          {!vendors?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No vendors yet.
            </div>
          )}
          {vendors?.map((v) => (
            <ListRow
              key={v.id}
              href={`/dashboard/admin/vendors/${v.id}`}
              title={v.business_name + (v.is_admin ? " · Admin" : "")}
              subtitle={`${v.first_name ?? ""} ${v.last_name ?? ""} · ${v.phone ?? "—"}`}
              status={v.felicity_kyc_status}
              statusClass={statusColor(v.felicity_kyc_status)}
              right={fmtDateTime(v.created_at).split(",")[0]}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
