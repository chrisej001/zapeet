import Link from "next/link";
import { Brand } from "./logo";

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
          <a
            href="#"
            className="hidden rounded-[10px] border border-ink/25 px-6 py-3 text-sm font-semibold text-ink hover:border-ink sm:inline-flex"
          >
            Log in
          </a>
          <a
            href="#"
            className="rounded-[10px] bg-ink px-6 py-3 text-sm font-semibold text-paper hover:bg-ink/90"
          >
            Get started
          </a>
        </div>
      </div>
    </header>
  );
}
