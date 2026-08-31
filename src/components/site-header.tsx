import Link from "next/link";
import { Brand } from "./logo";
import { MotionLink } from "./motion-link";

const navLinks = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#who-its-for", label: "Who it’s for" },
  { href: "#trust", label: "Why vendors trust us" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
        <Link href="/">
          <Brand />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-ink hover:text-terracotta"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <MotionLink
            href="#"
            lift={false}
            className="hidden rounded-[10px] border border-ink/25 px-6 py-3 text-sm font-semibold text-ink sm:inline-flex"
          >
            Log in
          </MotionLink>
          <MotionLink
            href="#"
            className="rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-paper"
          >
            Get started
          </MotionLink>
        </div>
      </div>
    </header>
  );
}
