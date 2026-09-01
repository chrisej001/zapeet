"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BoltIcon,
  CheckCircleIcon,
  PinIcon,
  ShieldCheckIcon,
  TruckIcon,
  UserIcon,
} from "./icons";

const STEP_MS = 4200;
const STEPS = [
  { label: "Vendor creates the link", tone: "marigold" as const },
  { label: "Customer checks out", tone: "marigold" as const },
  { label: "Rider picks up", tone: "terracotta" as const },
  { label: "Delivered", tone: "terracotta" as const },
];

export function HeroFlowDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, STEP_MS);
    return () => clearInterval(id);
  }, []);

  const tone = STEPS[step].tone;
  const toneText = tone === "marigold" ? "text-marigold-ink" : "text-terracotta";
  const toneBg = tone === "marigold" ? "bg-marigold/15 text-marigold-ink" : "bg-terracotta/15 text-terracotta";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2.5">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className={`h-1.5 flex-1 overflow-hidden rounded-full ${i <= step ? "" : "bg-ink/10"}`}
          >
            {i === step && (
              <motion.div
                key={step}
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: STEP_MS / 1000, ease: "linear" }}
                className={s.tone === "marigold" ? "h-full bg-marigold" : "h-full bg-terracotta"}
              />
            )}
            {i < step && <div className={s.tone === "marigold" ? "h-full bg-marigold" : "h-full bg-terracotta"} />}
          </div>
        ))}
      </div>

      <div className={`text-xs font-bold tracking-[0.1em] uppercase ${toneText}`}>
        Step {step + 1} · {STEPS[step].label}
      </div>

      <div className="min-h-[268px]">
        <AnimatePresence mode="wait">
          {step === 0 && <VendorStep key="vendor" toneBg={toneBg} />}
          {step === 1 && <CustomerStep key="customer" toneBg={toneBg} />}
          {step === 2 && <PickupStep key="pickup" />}
          {step === 3 && <DeliveredStep key="delivered" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

const fadeUp = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.35, ease: "easeOut" as const },
};

function VendorStep({ toneBg }: { toneBg: string }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col gap-5">
      <div>
        <div className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">₦185,000</div>
        <div className="mt-1.5 text-sm text-ink-60">MacBook Air M2 · 13-inch</div>
      </div>
      <div className="flex gap-2.5">
        <span className="rounded-full bg-marigold px-4 py-2 text-sm font-semibold text-ink">Insured</span>
        <span className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink-60">
          Pure delivery
        </span>
      </div>
      <motion.div
        animate={{ scale: [1, 1, 0.95, 1] }}
        transition={{ duration: 1.1, delay: 1.5, times: [0, 0.6, 0.75, 1], ease: "easeOut" }}
        className="w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
      >
        Generate payment link
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 2.3 }}
        className={`flex items-center gap-2.5 rounded-[10px] px-4 py-3 text-sm font-semibold ${toneBg}`}
      >
        <BoltIcon className="h-4 w-4 shrink-0" />
        zapeet.link/8fK2a1 — ready to send
      </motion.div>
    </motion.div>
  );
}

function CustomerStep({ toneBg }: { toneBg: string }) {
  return (
    <motion.div {...fadeUp} className="flex flex-col gap-4">
      <TypingField label="Full name" value="Ada Okoye" delay={0.1} />
      <TypingField label="Delivery address" value="14 Allen Avenue, Ikeja" delay={0.9} />

      <div className="flex items-center justify-between border-t border-ink/10 pt-3.5">
        <div className="text-sm font-semibold text-ink-60">Total due</div>
        <div className="text-base font-extrabold text-ink">₦185,000</div>
      </div>

      <div className="relative">
        <motion.div
          animate={{ scale: [1, 1, 0.95, 1] }}
          transition={{ duration: 1.1, delay: 2.5, times: [0, 0.6, 0.75, 1], ease: "easeOut" }}
          className="w-full rounded-[10px] bg-ink py-3.5 text-center text-sm font-semibold text-paper"
        >
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.001, delay: 3.2 }}
          >
            Pay ₦185,000
          </motion.span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25, delay: 3.2 }}
          className={`absolute inset-0 flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold ${toneBg}`}
        >
          <CheckCircleIcon className="h-4 w-4" />
          Payment verified
        </motion.div>
      </div>
    </motion.div>
  );
}

function TypingField({ label, value, delay }: { label: string; value: string; delay: number }) {
  const [shown, setShown] = useState("");

  useEffect(() => {
    let iv: ReturnType<typeof setInterval> | undefined;
    const startTimer = setTimeout(() => {
      let i = 0;
      iv = setInterval(() => {
        i += 1;
        setShown(value.slice(0, i));
        if (i >= value.length && iv) clearInterval(iv);
      }, 28);
    }, delay * 1000);
    return () => {
      clearTimeout(startTimer);
      if (iv) clearInterval(iv);
    };
  }, [value, delay]);

  return (
    <div>
      <div className="mb-1.5 text-[11px] font-bold tracking-[0.06em] text-ink-60 uppercase">{label}</div>
      <div className="rounded-xl border border-ink/15 px-3.5 py-3 text-sm font-medium text-ink">
        {shown}
        <span className="inline-block h-[14px] w-[1.5px] translate-y-[2px] animate-pulse bg-ink/40" />
      </div>
    </div>
  );
}

function PickupStep() {
  return (
    <motion.div {...fadeUp} className="flex flex-col gap-6">
      <div className="relative h-16">
        <div className="absolute top-1/2 left-[8%] h-px w-[84%] -translate-y-1/2 border-t-2 border-dashed border-ink/20" />
        <div className="absolute top-1/2 left-[8%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
            <PinIcon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-ink-60">Pickup</span>
        </div>
        <div className="absolute top-1/2 right-[8%] flex translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-terracotta text-paper">
            <UserIcon className="h-4 w-4" />
          </div>
          <span className="text-[11px] font-semibold text-ink-60">Ikeja</span>
        </div>
        <motion.div
          initial={{ left: "8%" }}
          animate={{ left: "92%" }}
          transition={{ duration: 3.4, ease: "easeInOut" }}
          className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-terracotta bg-white text-terracotta shadow-[0_8px_16px_-6px_rgba(216,90,48,0.5)]"
        >
          <TruckIcon className="h-4 w-4" />
        </motion.div>
      </div>

      <div className="flex flex-col gap-3">
        <StatusLine delay={0.1} text="Rider assigned — 11 seconds" />
        <StatusLine delay={1.7} text="Package picked up" />
        <StatusLine delay={3.2} text="En route to Ikeja" />
      </div>
    </motion.div>
  );
}

function StatusLine({ delay, text }: { delay: number; text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex items-center gap-2.5 text-sm font-semibold text-ink"
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-terracotta" />
      {text}
    </motion.div>
  );
}

function DeliveredStep() {
  return (
    <motion.div {...fadeUp} className="flex flex-col items-center gap-4 py-4 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 16 }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-terracotta/15 text-terracotta"
      >
        <CheckCircleIcon className="h-8 w-8" />
      </motion.div>
      <div>
        <div className="text-lg font-bold text-ink">Delivered to Ada Okoye</div>
        <div className="mt-1 text-sm text-ink-60">47.6 min, door to door</div>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex items-center gap-2 rounded-full bg-marigold/15 px-4 py-2 text-sm font-semibold text-marigold-ink"
      >
        <ShieldCheckIcon className="h-4 w-4" />
        1-year insurance active
      </motion.div>
    </motion.div>
  );
}
