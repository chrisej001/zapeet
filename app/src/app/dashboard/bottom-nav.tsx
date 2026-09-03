"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, LinkIcon, UserIcon } from "@/components/icons";

const TABS = [
  { href: "/dashboard", label: "Overview", icon: HomeIcon },
  { href: "/dashboard/links", label: "Links", icon: LinkIcon },
  { href: "/dashboard/profile", label: "Profile", icon: UserIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-ink/10 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-sm items-stretch justify-around px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
        {TABS.map((tab) => {
          const active = tab.href === "/dashboard" ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[10px] py-1.5 text-[11px] font-medium ${
                active ? "text-ink" : "text-ink-60"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
