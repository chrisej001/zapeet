import { ClockIcon, ShieldCheckIcon, TruckIcon } from "./icons";
import { Reveal } from "./reveal";

type Flow = {
  tag: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  steps: string[];
  bestFor: string;
  tone: "marigold" | "terracotta";
};

const flows: Flow[] = [
  {
    tag: "Flow 1 — Insured",
    icon: ShieldCheckIcon,
    title: "Protect the sale",
    desc: "For high-value electronics where the customer needs to trust the delivery, not just the vendor.",
    steps: [
      "Vendor enters the device value",
      "Zapeet generates a payment link",
      "Customer enters their details and pays",
      "Instant 1-year device insurance, a 2.5% vendor rebate, and automatic rider dispatch",
    ],
    bestFor: "Best for smartphones, laptops, and gaming consoles",
    tone: "marigold",
  },
  {
    tag: "Flow 2 — Pure delivery",
    icon: TruckIcon,
    title: "Just get it there",
    desc: "For high-frequency fashion, beauty, and lifestyle orders that need speed, not insurance overhead.",
    steps: [
      "Vendor enters the item cost",
      "Zapeet generates a minimalist shipping link",
      "Customer enters their delivery address and pays",
      "Payment clears and a rider is routed automatically",
    ],
    bestFor: "Best for fashion, beauty, and daily point-to-point orders",
    tone: "terracotta",
  },
];

const toneClasses = {
  marigold: {
    iconWrap: "bg-marigold/15 text-marigold-ink",
    tag: "text-marigold-ink",
    step: "bg-marigold/15 text-marigold-ink",
  },
  terracotta: {
    iconWrap: "bg-terracotta/15 text-terracotta",
    tag: "text-terracotta",
    step: "bg-terracotta/15 text-terracotta",
  },
};

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
            Vendors pick a flow, Zapeet generates the link, and everything from
            payment verification to rider dispatch runs on its own.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          {flows.map((flow, i) => {
            const Icon = flow.icon;
            const tone = toneClasses[flow.tone];
            return (
              <Reveal key={flow.title} delay={i * 0.12} y={32}>
                <div className="flex h-full flex-col gap-6 rounded-[20px] border border-ink/10 bg-white p-8">
                  <div className="flex items-center gap-3.5">
                    <div className={`flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl ${tone.iconWrap}`}>
                      <Icon className="h-[22px] w-[22px]" />
                    </div>
                    <p className={`text-xs font-bold tracking-[0.1em] uppercase ${tone.tag}`}>
                      {flow.tag}
                    </p>
                  </div>

                  <h3 className="text-2xl">{flow.title}</h3>
                  <p className="text-base text-ink-60">{flow.desc}</p>

                  <div className="flex flex-col gap-3.5">
                    {flow.steps.map((step, j) => (
                      <div key={step} className="flex items-start gap-3.5">
                        <div className={`mt-0.5 flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg text-xs font-bold ${tone.step}`}>
                          {j + 1}
                        </div>
                        <p className="text-sm font-medium text-ink">{step}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-ink/10 pt-4 text-sm font-semibold text-ink-60">
                    <ClockIcon className="h-4 w-4 shrink-0" />
                    {flow.bestFor}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
