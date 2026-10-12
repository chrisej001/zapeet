import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OverviewCard, type OverviewOrder } from "./overview-card";
import { BottomNav } from "./bottom-nav";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const [{ data: vendor }, { data: orders }] = await Promise.all([
    supabase
      .from("vendors")
      .select("business_name, payout_bank_name, payout_account_number")
      .eq("id", user.id)
      .single(),
    supabase
      .from("orders")
      .select(
        "id, created_at, paid_at, vendor_payout_naira, goods_amount_naira, payout_status, customer_first_name, payment_links(item_name)",
      )
      .eq("payment_status", "paid")
      .order("paid_at", { ascending: false })
      .limit(100),
  ]);

  const paidOrders: OverviewOrder[] = (orders ?? []).map((o) => ({
    id: o.id,
    paidAt: o.paid_at ?? o.created_at,
    // Orders from before split payouts have no payout figure — the whole
    // item price was credited then.
    payoutNaira: Number(o.vendor_payout_naira ?? o.goods_amount_naira ?? 0),
    payoutStatus: o.payout_status,
    customerName: o.customer_first_name,
    itemName: (o.payment_links as unknown as { item_name: string } | null)?.item_name ?? "Order",
  }));

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-8 pb-28">
      <div className="mx-auto w-full max-w-sm">
        <OverviewCard
          businessName={vendor?.business_name ?? "Your business"}
          payoutBankName={vendor?.payout_bank_name ?? null}
          payoutAccountNumber={vendor?.payout_account_number ?? null}
          orders={paidOrders}
        />
      </div>
      <BottomNav />
    </div>
  );
}
