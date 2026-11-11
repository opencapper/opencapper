"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/value-bets", label: "Value bets" },
  { href: "/arbs", label: "Arbitrage" },
  { href: "/games", label: "Odds screen" },
  { href: "/proof", label: "Proof" },
  { href: "/books", label: "Bookmakers" },
  { href: "/tools", label: "Calculators" },
];

const SOON = ["Bet tracker", "Discord alerts", "Account health"];

function active(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-line bg-panel lg:flex">
        <Link href="/" className="flex items-baseline gap-1 px-5 py-5">
          <span className="text-lg font-semibold tracking-tight">OpenEV</span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">preview</span>
        </Link>
        <nav className="flex flex-col gap-0.5 px-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 text-sm transition-colors ${
                active(pathname, item.href)
                  ? "bg-foreground/10 text-foreground"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 px-5 text-[11px] uppercase tracking-wider text-muted">Coming</div>
        <div className="mt-1 flex flex-col px-2">
          {SOON.map((label) => (
            <span key={label} className="px-3 py-1.5 text-sm text-muted/60">
              {label}
            </span>
          ))}
        </div>
        <div className="mt-auto border-t border-line px-5 py-4 text-[11px] leading-relaxed text-muted">
          Fair odds from Pinnacle with the margin removed. Check every price at the bookmaker before betting.
        </div>
      </aside>
      <header className="sticky top-0 z-10 border-b border-line bg-panel/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">
            OpenEV
          </Link>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`shrink-0 px-3 py-1.5 text-xs ${
                active(pathname, item.href) ? "bg-foreground/10 text-foreground" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    </>
  );
}
