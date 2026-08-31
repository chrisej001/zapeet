"use client";

import { motion, type Variants } from "framer-motion";
import { BoltIcon, DotsIcon, LinkIcon, ShieldCheckIcon, TruckIcon } from "./icons";
import { MotionLink } from "./motion-link";

const easeOut = [0.16, 1, 0.3, 1] as const;

const textVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: easeOut },
  }),
};

const statusRows = [
  { icon: ShieldCheckIcon, tone: "marigold" as const, text: "1-year device insurance issued" },
  { icon: BoltIcon, tone: "marigold" as const, text: "2.5% vendor rebate applied" },
  { icon: TruckIcon, tone: "terracotta" as const, text: "Rider dispatched — 12 min away" },
];

export function Hero() {
  return (
    <section className="relative overflow-x-hidden pt-10 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-12">
        <div className="flex flex-col items-start gap-6">
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="text-xs font-bold tracking-[0.1em] text-terracotta uppercase"
          >
            Insured checkout. Automated delivery.
          </motion.p>

          <motion.h1
            custom={0.1}
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="text-4xl leading-[1.05] sm:text-5xl lg:text-6xl"
          >
            Insure your delivery in one link.
          </motion.h1>

          <motion.p
            custom={0.2}
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="max-w-md text-lg leading-relaxed text-ink-60"
          >
            Generate a payment link, get instant device cover and rider dispatch —
            no back-and-forth on WhatsApp, no bank transfer screenshots, no
            absorbing the loss when something goes wrong in transit.
          </motion.p>

          <motion.div
            custom={0.3}
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="mt-1 flex flex-wrap items-center gap-4"
          >
            <MotionLink
              href="#"
              className="rounded-[10px] bg-ink px-7 py-4 text-base font-semibold text-paper"
            >
              Generate your first link
            </MotionLink>
            <MotionLink
              href="#how-it-works"
              className="rounded-[10px] border border-ink/25 px-7 py-4 text-base font-semibold text-ink"
              lift={false}
            >
              See how it works
            </MotionLink>
          </motion.div>

          <motion.p
            custom={0.4}
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="text-sm text-ink-60"
          >
            Built for Lagos vendors — from Computer Village to Lagos Island.
          </motion.p>
        </div>

        <div className="relative flex flex-col gap-3 lg:pl-6">
          {/* ambient glow behind the card */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -inset-x-10 -inset-y-16 -z-10"
            animate={{ y: [0, -14, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="absolute top-6 right-4 h-72 w-72 rounded-full bg-marigold/25 blur-[90px]" />
            <div className="absolute bottom-0 left-4 h-72 w-72 rounded-full bg-terracotta/20 blur-[90px]" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col gap-6 rounded-[24px] border border-ink/10 bg-white p-8 shadow-[0_36px_90px_-30px_rgba(27,31,59,0.4)] sm:p-10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-ink-60 uppercase">
                <LinkIcon className="h-4 w-4" />
                Zapeet link
              </div>
              <DotsIcon className="h-[18px] w-[18px] text-ink-60" />
            </div>

            <div>
              <div className="text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
                ₦185,000
              </div>
              <div className="mt-1.5 text-base text-ink-60">MacBook Air M2 · 13-inch</div>
            </div>

            <div className="flex gap-2.5">
              <span className="rounded-full bg-marigold px-4 py-2.5 text-sm font-semibold text-ink">
                Insured
              </span>
              <span className="rounded-full border border-ink/20 px-4 py-2.5 text-sm font-semibold text-ink-60">
                Pure delivery
              </span>
            </div>

            <div className="h-px bg-ink/10" />

            <div className="flex flex-col gap-4">
              {statusRows.map((row, i) => (
                <motion.div
                  key={row.text}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.9 + i * 0.35, ease: "easeOut" }}
                  className="flex items-center gap-3.5"
                >
                  <StatusIcon icon={row.icon} tone={row.tone} />
                  <div className="text-base font-semibold text-ink">{row.text}</div>
                </motion.div>
              ))}
            </div>

            <MotionLink
              href="#"
              lift={false}
              className="w-full rounded-[10px] border border-ink/25 py-4 text-center text-sm font-semibold text-ink"
            >
              Copy payment link
            </MotionLink>
          </motion.div>

          {/* floating stat badge */}
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: [0, -8, 0], scale: 1 }}
            transition={{
              opacity: { duration: 0.5, delay: 1.9 },
              scale: { duration: 0.5, delay: 1.9 },
              y: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 2.2 },
            }}
            className="absolute -bottom-6 -left-6 hidden items-center gap-2.5 rounded-2xl border border-ink/10 bg-white px-5 py-3.5 shadow-[0_20px_40px_-20px_rgba(27,31,59,0.35)] sm:flex"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-terracotta/15 text-terracotta">
              <TruckIcon className="h-[18px] w-[18px]" />
            </div>
            <div>
              <div className="text-sm font-bold text-ink">~48 min</div>
              <div className="text-xs text-ink-60">door to door, Lagos</div>
            </div>
          </motion.div>

          <p className="pr-1 text-right text-xs text-ink-60 italic">
            Sample link — insured flow, for illustration
          </p>
        </div>
      </div>
    </section>
  );
}

function StatusIcon({
  icon: Icon,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: "marigold" | "terracotta";
}) {
  const toneClasses =
    tone === "marigold"
      ? "bg-marigold/15 text-marigold-ink"
      : "bg-terracotta/15 text-terracotta";
  return (
    <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${toneClasses}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}
