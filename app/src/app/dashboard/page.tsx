import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LinkIcon } from "@/components/icons";
import { SignOutButton } from "./sign-out-button";
import { CopyLinkButton } from "./copy-link-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, felicity_account_number, felicity_bank_name")
    .eq("id", user.id)
    .single();

  const { data: links } = await supabase
    .from("payment_links")
    .select("id, slug, item_name, amount_naira, flow, status, created_at")
    .order("created_at", { ascending: false });

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl">{vendor?.business_name ?? "Your business"}</h1>
            {vendor?.felicity_account_number && (
              <p className="mt-1 text-sm text-ink-60">
                {vendor.felicity_account_number} · {vendor.felicity_bank_name}
              </p>
            )}
          </div>
          <SignOutButton />
        </div>

        <Link
          href="/dashboard/links/new"
          className="mb-6 block w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
        >
          + Generate payment link
        </Link>

        <div className="flex flex-col gap-3">
          {!links?.length && (
            <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
              No links yet — generate your first one above.
            </div>
          )}

          {links?.map((link) => (
            <div
              key={link.id}
              className="flex flex-col gap-3 rounded-[16px] border border-ink/10 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-ink">{link.item_name}</p>
                  <p className="mt-0.5 text-lg font-extrabold text-ink">
                    ₦{Number(link.amount_naira).toLocaleString("en-NG")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    link.flow === "insured"
                      ? "bg-marigold/15 text-marigold-ink"
                      : "bg-terracotta/15 text-terracotta"
                  }`}
                >
                  {link.flow === "insured" ? "Insured" : "Pure delivery"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-ink-60">
                  <LinkIcon className="h-3.5 w-3.5" />
                  /pay/{link.slug}
                </div>
                <CopyLinkButton slug={link.slug} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
