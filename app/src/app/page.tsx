"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogoMark } from "@/components/logo";
import { createClient } from "@/lib/supabase/client";

const MIN_SPLASH_MS = 900;

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const start = Date.now();

    supabase.auth.getSession().then(({ data: { session } }) => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
      setTimeout(() => {
        router.replace(session ? "/dashboard" : "/auth");
      }, wait);
    });
  }, [router]);

  return (
    <div className="flex h-dvh w-full flex-col items-center justify-center gap-4 bg-ink">
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <LogoMark size={64} className="rounded-[16px] shadow-[0_16px_40px_-12px_rgba(242,169,59,0.4)]" />
      </motion.div>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-lg font-bold tracking-tight text-paper"
      >
        zapeet
      </motion.span>
    </div>
  );
}
