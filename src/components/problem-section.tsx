import { AlertIcon, BankIcon, ChatIcon, GridIcon } from "./icons";
import { Reveal } from "./reveal";

const painPoints = [
  {
    icon: GridIcon,
    title: "Erratic dispatch apps",
    body: "Vendors juggle multiple dispatch apps with no shared record of who’s holding what, or where it is.",
  },
  {
    icon: ChatIcon,
    title: "Hours on WhatsApp",
    body: "Every delivery starts with a manual back-and-forth to negotiate an address, one order at a time.",
  },
  {
    icon: BankIcon,
    title: "Loose bank transfers",
    body: "Payment proof is a screenshot, not a system — and a dispute has nowhere to go.",
  },
  {
    icon: AlertIcon,
    title: "Unhedged risk",
    body: "Transit theft and post-sale device damage come out of the vendor’s pocket, every time.",
  },
];

export function ProblemSection() {
  return (
    <section className="bg-ink py-16 sm:py-24 lg:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-11 max-w-xl">
          <p className="mb-3.5 text-xs font-bold tracking-[0.1em] text-marigold uppercase">
            The old way
          </p>
          <h2 className="text-3xl text-paper sm:text-4xl">
            Every sale becomes a small logistics operation
          </h2>
          <p className="mt-4 text-lg text-paper/70">
            Moving goods across Lagos creates real operational anxiety — vendors
            absorb the cost of a broken process, one order at a time.
          </p>
        </Reveal>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {painPoints.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col gap-4 rounded-2xl border border-paper/10 bg-paper/5 p-6">
                <Icon className="h-[22px] w-[22px] text-marigold" />
                <h4 className="text-base text-paper">{title}</h4>
                <p className="text-sm text-paper/60">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
