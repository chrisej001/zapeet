import { BankIcon, BoltIcon, TruckIcon } from "./icons";
import { Reveal } from "./reveal";

const steps = [
  "Add your bank account once — any Nigerian bank",
  "Enter the item and price; Zapeet generates a payment link",
  "Your customer enters their delivery address and pays one transfer for the item and delivery",
  "The moment it clears, your money is sent to your bank and a rider is booked to collect the item",
];

const pricing = [
  { label: "Item price", value: "₦185,000" },
  { label: "Zapeet fee (2%, capped at ₦2,000)", value: "−₦2,000" },
  { label: "Lands in your bank, instantly", value: "₦183,000", strong: true },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-3.5 text-xs font-bold tracking-[0.1em] text-ink uppercase">
            How Zapeet works
          </p>
          <h2 className="text-3xl sm:text-4xl">
            One link replaces the entire manual process
          </h2>
          <p className="mt-4 text-lg text-ink-60">
            Zapeet generates the link, confirms the payment, pays you, and books
            the rider. You just pack the item.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Reveal y={32}>
            <div className="flex h-full flex-col gap-6 rounded-[20px] border border-ink/10 bg-white p-8">
              <div className="flex items-center gap-3.5">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-marigold/15 text-marigold-ink">
                  <BoltIcon className="h-[22px] w-[22px]" />
                </div>
                <p className="text-xs font-bold tracking-[0.1em] text-marigold-ink uppercase">
                  Pay, payout, dispatch
                </p>
              </div>

              <h3 className="text-2xl">From chat to doorstep</h3>

              <div className="flex flex-col gap-3.5">
                {steps.map((step, j) => (
                  <div key={step} className="flex items-start gap-3.5">
                    <div className="mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-marigold/15 text-xs font-bold text-marigold-ink">
                      {j + 1}
                    </div>
                    <p className="text-sm font-medium text-ink">{step}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2.5 border-t border-ink/10 pt-4 text-sm font-semibold text-ink-60">
                <TruckIcon className="h-4 w-4 shrink-0" />
                Same-day, Lagos-to-Lagos — ~48 minutes door to door
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.12} y={32}>
            <div className="flex h-full flex-col gap-6 rounded-[20px] border border-ink/10 bg-white p-8">
              <div className="flex items-center gap-3.5">
                <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl bg-terracotta/15 text-terracotta">
                  <BankIcon className="h-[22px] w-[22px]" />
                </div>
                <p className="text-xs font-bold tracking-[0.1em] text-terracotta uppercase">
                  Simple pricing
                </p>
              </div>

              <h3 className="text-2xl">2% per order, never more than ₦2,000</h3>
              <p className="text-base text-ink-60">
                No setup fee, no monthly fee, no withdrawal fee. You decide who pays
                it — take it out of your payout, or pass it on to the customer with
                one toggle on the link.
              </p>

              <div className="flex flex-col gap-3 rounded-[14px] bg-paper p-5">
                {pricing.map((row) => (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <span className={row.strong ? "font-semibold text-ink" : "text-ink-60"}>{row.label}</span>
                    <span className={row.strong ? "text-base font-extrabold text-marigold-ink" : "font-semibold text-ink"}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-ink-60">
                Delivery is quoted live for each route and paid by the customer at checkout.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
