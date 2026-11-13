"use client";

import { Link } from "@/i18n/navigation";
import type { ValueBetList } from "@/lib/api/client";
import { count } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";
import { liveEdges, useBoardSnapshot } from "./landing-live";

// The count in the nav proves the board is real before anyone scrolls.
export function NavLive(props: { list: ValueBetList | null; edges: number }) {
  const t = useTranslations("LANDING");
  const locale = useLocale();
  const list = useBoardSnapshot(props.list);
  if (!list) return null;
  return (
    <Link
      href="/value-bets"
      className="hover:bg-muted mr-1 hidden h-8 items-center gap-2 rounded-md border px-2.5 text-xs font-medium transition-colors sm:inline-flex"
    >
      <span aria-hidden className="bg-success size-1.5 rounded-full" />
      <span className="tabular min-w-[2ch] text-right">
        {count(liveEdges(list, props.list, props.edges), locale)}
      </span>
      <span className="text-muted-foreground">{t("NAV_LIVE")}</span>
    </Link>
  );
}
