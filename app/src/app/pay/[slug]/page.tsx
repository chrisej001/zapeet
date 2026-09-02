import { createAdminClient } from "@/lib/supabase/admin";
import { LogoMark } from "@/components/logo";
import { CheckoutForm } from "./checkout-form";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: link } = await admin
    .from("payment_links")
    .select("item_name, amount_naira, flow, status, vendor:vendors(business_name)")
    .eq("slug", slug)
    .single();

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          {link && (
            <p className="text-sm font-medium text-ink-60">
              from {(link.vendor as unknown as { business_name: string } | null)?.business_name}
            </p>
          )}
        </div>

        {!link || link.status !== "active" ? (
          <div className="rounded-[16px] border border-ink/10 bg-white p-6 text-center text-sm text-ink-60">
            This payment link isn’t available anymore.
          </div>
        ) : (
          <>
            <div className="mb-6 rounded-[20px] border border-ink/10 bg-white p-6">
              <p className="text-sm font-semibold text-ink-60">{link.item_name}</p>
              <p className="mt-1 text-3xl font-extrabold tracking-tight text-ink">
                ₦{Number(link.amount_naira).toLocaleString("en-NG")}
              </p>
              <span
                className={`mt-3 inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${
                  link.flow === "insured"
                    ? "bg-marigold/15 text-marigold-ink"
                    : "bg-terracotta/15 text-terracotta"
                }`}
              >
                {link.flow === "insured" ? "Insured delivery" : "Pure delivery"}
              </span>
            </div>

            <CheckoutForm
              slug={slug}
              itemName={link.item_name}
              flow={link.flow as "insured" | "pure_delivery"}
            />
          </>
        )}
      </div>
    </div>
  );
}
