"use client";

import { TickText } from "@/components/elements/live/tick-cell";
import { Link } from "@/i18n/navigation";
import type { ValueBetList } from "@/lib/api/client";
import { count } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { edgeCount, useBoardSnapshot } from "./landing-live";
import { LiveDot } from "./landing-ui";

// Kalshi's "LIVE 124": the count in the nav proves the board is real before anyone scrolls.
export function NavLive(props: { list: ValueBetList | null }) {
  const t = useTranslations("LANDING");
  const locale = useLocale();
  const list = useBoardSnapshot(props.list);
  if (!list) return null;
  const n = count(edgeCount(list), locale);
  return (
    <Link
      href="/value-bets"
      className="border-foreground hover:bg-foreground hover:text-background mr-1 inline-flex h-9 items-center gap-2 rounded-full border-2 px-3.5 font-mono text-[11px] font-medium tracking-[0.08em] uppercase transition-colors"
    >
      <LiveDot />
      <span className="num min-w-[3ch] text-center text-[15px] tracking-normal">
        {n}
      </span>
      <span className="hidden sm:inline">{t("NAV_LIVE")}</span>
    </Link>
  );
}

// The engine's own counters under the hero copy, ticking with every snapshot.
export function HeroCounters(props: {
  list: ValueBetList | null;
  books: number;
}) {
  const t = useTranslations("LANDING.HERO");
  const locale = useLocale();
  const list = useBoardSnapshot(props.list);
  if (!list) return null;
  const cells = [
    { label: t("COUNT_BOOKS"), value: props.books },
    { label: t("COUNT_PRICES"), value: list.stats.quotes },
    { label: t("COUNT_GAMES"), value: list.stats.matched_events },
  ];
  return (
    <dl className="border-foreground mt-10 grid max-w-[560px] grid-cols-3 border-y-2">
      {cells.map((c, i) => (
        <div
          key={c.label}
          className={
            i > 0 ? "border-foreground/20 border-l py-3 pl-4" : "py-3 pr-4"
          }
        >
          <dt className="text-foreground/60 font-mono text-[10px] tracking-[0.12em] uppercase">
            {c.label}
          </dt>
          <dd>
            <TickText
              value={c.value}
              className="num block text-[34px] leading-none sm:text-[40px]"
            >
              {count(c.value, locale)}
            </TickText>
          </dd>
        </div>
      ))}
    </dl>
  );
}
