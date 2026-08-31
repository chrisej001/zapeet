"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function MotionLink({
  href,
  className,
  children,
  lift = true,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  lift?: boolean;
}) {
  return (
    <motion.a
      href={href}
      className={className}
      whileHover={lift ? { y: -2, scale: 1.015 } : { scale: 1.015 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 22 }}
    >
      {children}
    </motion.a>
  );
}
