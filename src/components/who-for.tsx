import { DeviceIcon, PinIcon, TagIcon } from "./icons";
import { Reveal } from "./reveal";

const icps = [
  {
    icon: DeviceIcon,
    title: "High-value device distributors",
    body: "Smartphone, laptop, and gaming console distributors on the Lagos Mainland who need long-term device protection to earn retail trust.",
  },
  {
    icon: TagIcon,
    title: "High-frequency social commerce merchants",
    body: "Fashion, beauty, and luxury vendors processing 5–20 point-to-point orders a day across Lagos.",
  },
];

const locations = [
  "Computer Village, Ikeja",
  "Yaba & Surulere",
  "Balogun & Trade Fair",
  "Mainland tech hubs",
  "Lagos vendor WhatsApp communities",
];

export function WhoFor() {
  return (
    <section id="who-its-for" className="border-t border-ink/10 py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-11 max-w-xl">
          <p className="mb-3.5 text-xs font-bold tracking-[0.1em] text-ink uppercase">
            Who it’s for
          </p>
          <h2 className="text-3xl sm:text-4xl">
            Built for vendors who move real inventory, every day
          </h2>
        </Reveal>

        <div className="mb-14 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {icps.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.1}>
              <div className="flex h-full flex-col gap-4 rounded-[18px] border border-ink/10 bg-white p-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-ink/6 text-ink">
                  <Icon className="h-[22px] w-[22px]" />
                </div>
                <h3 className="text-xl">{title}</h3>
                <p className="text-[0.95rem] text-ink-60">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <p className="mb-4.5 text-base font-semibold text-ink">
            Where we already show up
          </p>
          <div className="flex flex-wrap gap-3">
            {locations.map((location) => (
              <div
                key={location}
                className="flex items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 text-sm font-semibold text-ink"
              >
                <PinIcon className="h-4 w-4 text-terracotta" />
                {location}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
