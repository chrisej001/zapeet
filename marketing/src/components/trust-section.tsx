import { BankIcon, BoltIcon, ClockIcon } from "./icons";
import { Reveal } from "./reveal";

const items = [
  {
    icon: BankIcon,
    title: "Paid to your own bank",
    body: "Payouts go straight to the account you add — any Nigerian bank. No wallet, no withdrawal requests, no money held back.",
  },
  {
    icon: BoltIcon,
    title: "Split the moment it clears",
    body: "Every order gets a one-time account for the exact amount. When the transfer lands, your share and the rider fee are paid out automatically.",
  },
  {
    icon: ClockIcon,
    title: "~48 minutes, door to door",
    body: "Same-day Lagos-to-Lagos dispatch, rider-tracked from pickup to delivery.",
  },
];

export function TrustSection() {
  return (
    <section id="trust" className="border-y border-ink/10 bg-white py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-10">
          <p className="mb-3.5 text-xs font-bold tracking-[0.1em] text-ink uppercase">
            Why vendors trust us
          </p>
          <h2 className="text-3xl sm:text-4xl">
            Bank-grade payments, not another dispatch app
          </h2>
        </Reveal>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {items.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <div
                className={`flex flex-col gap-3.5 ${
                  i > 0 ? "sm:border-l sm:border-ink/10 sm:pl-10" : ""
                }`}
              >
                <Icon className="h-[22px] w-[22px] text-ink" />
                <h4 className="text-lg">{title}</h4>
                <p className="text-sm text-ink-60">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
