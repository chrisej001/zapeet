import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { LogoMark } from "@/components/logo";
import { CheckIcon } from "@/components/icons";
import { AutoRefresh } from "./auto-refresh";

export const metadata: Metadata = { title: "Track your delivery · Zapeet" };

// Tracking page for demo deliveries only — live deliveries link to the
// courier's own tracking URL. Progress is derived from time since booking
// so the demo moves along on its own without any background job.
const STAGES = [
  { label: "Rider assigned", afterMin: 0 },
  { label: "Picked up from vendor", afterMin: 2 },
  { label: "On the way to you", afterMin: 4 },
  { label: "Arriving now", afterMin: 10 },
];

function stagesReached(bookedAt: string) {
  const minutes = (Date.now() - new Date(bookedAt).getTime()) / 60000;
  return STAGES.filter((s) => minutes >= s.afterMin).length;
}

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data: delivery } = await createAdminClient()
    .from("deliveries")
    .select(
      "created_at, driver_name, driver_phone, orders(customer_first_name, delivery_address, payment_links(item_name), vendors(business_name))",
    )
    .eq("id", id)
    .eq("is_demo", true)
    .maybeSingle();
  if (!delivery) notFound();

  const order = delivery.orders as unknown as {
    customer_first_name: string | null;
    delivery_address: string | null;
    payment_links: { item_name: string } | null;
    vendors: { business_name: string } | null;
  } | null;

  const reached = stagesReached(delivery.created_at);

  return (
    <div className="flex min-h-dvh flex-col bg-paper px-6 py-10">
      <AutoRefresh everyMs={15000} />
      <div className="mx-auto w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <LogoMark size={40} />
          <p className="text-sm font-medium text-ink-60">Same-day delivery</p>
        </div>

        <div className="mb-4 rounded-[20px] border border-ink/10 bg-white p-6">
          <p className="text-sm text-ink-60">{order?.payment_links?.item_name ?? "Your order"}</p>
          <p className="mt-1 text-xl font-bold text-ink">{STAGES[reached - 1].label}</p>
          {order?.vendors?.business_name && (
            <p className="mt-1 text-xs text-ink-60">from {order.vendors.business_name}</p>
          )}

          <ol className="mt-6 flex flex-col">
            {STAGES.map((stage, i) => {
              const done = i < reached;
              const current = i === reached - 1;
              return (
                <li key={stage.label} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        done ? "bg-ink text-paper" : "border-2 border-ink/15"
                      } ${current ? "ring-4 ring-marigold/30" : ""}`}
                    >
                      {done && <CheckIcon className="h-3.5 w-3.5" />}
                    </span>
                    {i < STAGES.length - 1 && (
                      <span className={`my-1 h-6 w-0.5 ${i < reached - 1 ? "bg-ink" : "bg-ink/15"}`} />
                    )}
                  </div>
                  <span className={`pt-0.5 text-sm ${done ? "font-semibold text-ink" : "text-ink-60"}`}>
                    {stage.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="mb-4 flex items-center justify-between rounded-[20px] border border-ink/10 bg-white p-5">
          <div>
            <p className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Your rider</p>
            <p className="mt-1 text-base font-bold text-ink">{delivery.driver_name}</p>
          </div>
          {delivery.driver_phone && (
            <a
              href={`tel:${delivery.driver_phone}`}
              className="rounded-[10px] bg-ink px-4 py-2.5 text-xs font-semibold text-paper"
            >
              Call rider
            </a>
          )}
        </div>

        {order?.delivery_address && (
          <div className="mb-4 rounded-[20px] border border-ink/10 bg-white p-5">
            <p className="text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">Delivering to</p>
            <p className="mt-1 text-sm font-semibold text-ink">{order.delivery_address}</p>
          </div>
        )}

        <p className="text-center text-xs text-ink-60">
          Give the rider your delivery PIN at drop-off — it&apos;s in your confirmation email.
        </p>
      </div>
    </div>
  );
}
