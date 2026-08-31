import { BoltIcon, DotsIcon, LinkIcon, ShieldCheckIcon, TruckIcon } from "./icons";

export function Hero() {
  return (
    <section className="pt-10 sm:pt-16 lg:pt-20">
      <div className="mx-auto grid max-w-6xl gap-14 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
        <div className="flex flex-col items-start gap-6">
          <p className="text-xs font-bold tracking-[0.1em] text-terracotta uppercase">
            Insured checkout. Automated delivery.
          </p>
          <h1 className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl">
            Insure your delivery in one link.
          </h1>
          <p className="max-w-md text-lg leading-relaxed text-ink-60">
            Generate a payment link, get instant device cover and rider dispatch —
            no back-and-forth on WhatsApp, no bank transfer screenshots, no
            absorbing the loss when something goes wrong in transit.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <a
              href="#"
              className="rounded-[10px] bg-ink px-7 py-4 text-base font-semibold text-paper hover:bg-ink/90"
            >
              Generate your first link
            </a>
            <a
              href="#how-it-works"
              className="rounded-[10px] border border-ink/25 px-7 py-4 text-base font-semibold text-ink hover:border-ink"
            >
              See how it works
            </a>
          </div>
          <p className="text-sm text-ink-60">
            Built for Lagos vendors — from Computer Village to Lagos Island.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-5 rounded-[20px] border border-ink/10 bg-white p-7 shadow-[0_24px_60px_-30px_rgba(27,31,59,0.35)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-ink-60 uppercase">
                <LinkIcon className="h-4 w-4" />
                Zapeet link
              </div>
              <DotsIcon className="h-[18px] w-[18px] text-ink-60" />
            </div>

            <div>
              <div className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
                ₦185,000
              </div>
              <div className="mt-1 text-sm text-ink-60">MacBook Air M2 · 13-inch</div>
            </div>

            <div className="flex gap-2.5">
              <span className="rounded-full bg-marigold px-3.5 py-2 text-sm font-semibold text-ink">
                Insured
              </span>
              <span className="rounded-full border border-ink/20 px-3.5 py-2 text-sm font-semibold text-ink-60">
                Pure delivery
              </span>
            </div>

            <div className="h-px bg-ink/10" />

            <div className="flex flex-col gap-3.5">
              <StatusRow
                icon={<ShieldCheckIcon className="h-[18px] w-[18px]" />}
                tone="marigold"
                text="1-year device insurance issued"
              />
              <StatusRow
                icon={<BoltIcon className="h-[18px] w-[18px]" />}
                tone="marigold"
                text="2.5% vendor rebate applied"
              />
              <StatusRow
                icon={<TruckIcon className="h-[18px] w-[18px]" />}
                tone="terracotta"
                text="Rider dispatched — 12 min away"
              />
            </div>

            <a
              href="#"
              className="w-full rounded-[10px] border border-ink/25 py-3.5 text-center text-sm font-semibold text-ink hover:border-ink"
            >
              Copy payment link
            </a>
          </div>
          <p className="text-right text-xs text-ink-60 italic">
            Sample link — insured flow, for illustration
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusRow({
  icon,
  tone,
  text,
}: {
  icon: React.ReactNode;
  tone: "marigold" | "terracotta";
  text: string;
}) {
  const toneClasses =
    tone === "marigold"
      ? "bg-marigold/15 text-marigold-ink"
      : "bg-terracotta/15 text-terracotta";
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] ${toneClasses}`}>
        {icon}
      </div>
      <div className="text-sm font-semibold text-ink">{text}</div>
    </div>
  );
}
