"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const easeOut = [0.16, 1, 0.3, 1] as const;

const tiles = [
  {
    src: "/images/checkout-phone-v2.jpg",
    alt: "Customer completing a payment on their phone",
    eyebrow: "Insured checkout",
    caption: "One link, paid and verified in seconds.",
    fromX: -32,
  },
  {
    src: "/images/courier-delivery.jpg",
    alt: "Rider dispatched on a delivery run",
    eyebrow: "Automated delivery",
    caption: "A rider is routed the moment payment clears.",
    fromX: 32,
  },
];

export function PhotoShowcase() {
  return (
    <section className="py-16 sm:py-24 lg:py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-5 sm:px-8 md:grid-cols-2">
        {tiles.map((tile) => (
          <motion.div
            key={tile.src}
            initial={{ opacity: 0, x: tile.fromX, y: 16 }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="group relative aspect-[4/5] overflow-hidden rounded-[24px] border border-ink/10 sm:aspect-[4/3]"
          >
            <Image
              src={tile.src}
              alt={tile.alt}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-7">
              <p className="text-xs font-bold tracking-[0.1em] text-marigold uppercase">
                {tile.eyebrow}
              </p>
              <p className="text-lg font-semibold text-paper">{tile.caption}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
