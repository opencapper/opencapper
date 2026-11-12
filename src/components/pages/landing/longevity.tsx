"use client";

import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Link } from "@/i18n/navigation";
import type { BookHealth, BookStatus, ValueBetList } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { count, percent, prob } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { useBoardSnapshot } from "./landing-live";
import { RISK_SCORE, riskTone } from "./tools-grid";

const ROWS = 8;

const COLS =
  "grid grid-cols-[minmax(0,1fr)_64px_72px] items-center gap-3 px-4 sm:grid-cols-[44px_minmax(0,1.4fr)_92px_100px_88px_minmax(0,1fr)_76px] sm:gap-4 sm:px-6";

function Ring(props: { health?: BookHealth; label: string }) {
  if (!props.health) {
    return (
      <Link
        href="/tracker/health"
        className="border-foreground/30 text-foreground/55 hover:text-foreground grid size-[52px] place-items-center rounded-full border-2 border-dashed font-mono text-[9px] tracking-[0.06em] uppercase"
      >
        {props.label}
      </Link>
    );
  }
  const score = RISK_SCORE[props.health.risk];
  const tone = riskTone(score);
  return (
    <span className="relative grid size-[52px] place-items-center">
      <svg
        viewBox="0 0 40 40"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="6"
          className="stroke-foreground/10"
        />
        <circle
          cx="20"
          cy="20"
          r="16"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${score} 100`}
          stroke={tone}
          className="ring-fill"
        />
      </svg>
      <b className="num text-[18px]" style={{ color: tone }}>
        {score}
      </b>
    </span>
  );
}

export function Longevity(props: {
  list: ValueBetList | null;
  books: BookStatus[];
  form: Record<string, number[]>;
  alertsByBook: Record<string, number>;
  health?: BookHealth[];
}) {
  const t = useTranslations("LANDING.LONGEVITY");
  const locale = useLocale();
  const list = useBoardSnapshot(props.list);
  const edges: Record<string, number> = {};
  for (const b of list?.bets ?? []) {
    if (b.confidence !== "check") edges[b.book] = (edges[b.book] ?? 0) + 1;
  }
  const health = new Map((props.health ?? []).map((h) => [h.book, h]));
  // Rows keep the server's order so a live count never reshuffles the table under the reader.
  const rows = props.books
    .filter((b) => b.book !== "pinnacle")
    .sort(
      (a, b) =>
        (props.alertsByBook[b.book] ?? 0) - (props.alertsByBook[a.book] ?? 0) ||
        (a.median_implied_gap ?? 1) - (b.median_implied_gap ?? 1),
    )
    .slice(0, ROWS);

  return (
    <div className="border-foreground bg-card overflow-hidden rounded-[18px] border-2">
      <div
        className={cn(
          COLS,
          "bg-foreground text-background py-3 font-mono text-[10px] tracking-[0.14em] uppercase",
        )}
      >
        <span className="hidden sm:block">{t("POS")}</span>
        <span>{t("BOOK")}</span>
        <span className="hidden text-right sm:block">{t("ALERTS")}</span>
        <span className="hidden text-right sm:block">{t("GAP")}</span>
        <span className="text-right">{t("EDGES")}</span>
        <span className="hidden sm:block">{t("FORM")}</span>
        <span className="text-center">{t("HEALTH")}</span>
      </div>
      <ol>
        {rows.map((b, i) => {
          const form = props.form[b.book] ?? [];
          const h = health.get(b.book);
          return (
            <li
              key={b.book}
              className={cn(
                COLS,
                "border-foreground/10 border-b py-3 last:border-b-0",
                h?.risk === "high" && "bg-vermilion/8",
              )}
            >
              <span className="num text-foreground/45 hidden text-[34px] leading-none sm:block">
                {i + 1}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <VendorLogo
                  vendorKey={b.book}
                  size={36}
                  className="rounded-lg"
                />
                <span className="font-display truncate text-[22px] uppercase sm:text-[24px]">
                  {bookName(b.book)}
                </span>
              </span>
              <span className="num hidden text-right text-[22px] sm:block">
                {count(props.alertsByBook[b.book] ?? 0, locale)}
              </span>
              <span className="num hidden text-right text-[22px] sm:block">
                {b.median_implied_gap !== null &&
                b.median_implied_gap !== undefined
                  ? prob(b.median_implied_gap)
                  : "-"}
              </span>
              <span className="num text-vermilion text-right text-[26px] leading-none">
                {count(edges[b.book] ?? 0, locale)}
              </span>
              <span
                className="hidden gap-1.5 sm:flex"
                aria-label={form.map((x) => percent(x)).join(", ")}
              >
                {form.map((x, j) => (
                  <i
                    key={j}
                    title={percent(x)}
                    className={cn(
                      "num grid size-[22px] place-items-center rounded-full text-[11px] not-italic",
                      x > 0 ? "bg-pitch text-chalk" : "bg-vermilion text-ink",
                    )}
                  >
                    {x > 0 ? "+" : "-"}
                  </i>
                ))}
              </span>
              <span className="flex justify-center">
                <Ring health={h} label={t("TRACK")} />
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
