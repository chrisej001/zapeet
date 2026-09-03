import Link from "next/link";
import { ChevronRightIcon } from "@/components/icons";

export function ListRow({
  href,
  title,
  subtitle,
  right,
  status,
  statusClass,
}: {
  href: string;
  title: string;
  subtitle?: string;
  right?: string;
  status?: string;
  statusClass?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-[14px] border border-ink/10 bg-white p-4 hover:border-ink/30"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{title}</p>
        {subtitle && <p className="mt-0.5 truncate text-xs text-ink-60">{subtitle}</p>}
        {status && <p className={`mt-1 text-xs font-semibold ${statusClass ?? "text-ink-60"}`}>{status}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {right && <span className="text-sm font-bold text-ink">{right}</span>}
        <ChevronRightIcon className="h-4 w-4 text-ink-60" />
      </div>
    </Link>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 text-sm">
      <span className="text-ink-60">{label}</span>
      <span className="text-right font-semibold text-ink">{value}</span>
    </div>
  );
}
