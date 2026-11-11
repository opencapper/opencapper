import { TickCell } from "@/components/elements/live/tick-cell";
import { VendorLabel, VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Link } from "@/i18n/navigation";
import type { BookPrice, Market } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  ago,
  count,
  marketName,
  odds,
  percent,
  prob,
  sideName,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";

const HEAD =
  "label-mono text-foreground/45 px-3 py-2 text-right text-[10px] font-normal whitespace-nowrap";

function cellTone(p: BookPrice, best: boolean): string {
  if (p.ev !== null && p.ev !== undefined && p.ev > 0)
    return "bg-success/15 text-success";
  if (best) return "text-foreground";
  return "text-muted-foreground";
}

// Every book's price for one market: outcomes down, books across, the fair line first.
export function MarketTable(props: {
  market: Market;
  home: string;
  away: string;
  now: number;
  highlight?: string;
  valueLinks?: boolean;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const m = props.market;
  const books = [
    ...new Set(m.outcomes.flatMap((o) => o.prices.map((p) => p.book))),
  ].sort();
  return (
    <div>
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className={cn(HEAD, "bg-card sticky left-0 text-left")}>
                {marketName({ market: m.kind, period: m.period, line: m.line }, t)}
              </th>
              <th className={HEAD}>{t("ODDS.FAIR")}</th>
              <th className={cn(HEAD, "text-warning")}>
                <span className="inline-flex items-center gap-1.5">
                  <VendorLogo vendorKey="pinnacle" size={14} />
                  {t("ODDS.PINNACLE")}
                </span>
              </th>
              {books.map((b) => (
                <th key={b} className={cn(HEAD, "normal-case tracking-normal")}>
                  <VendorLabel vendorKey={b} size={14} className="justify-end" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.outcomes.map((o) => {
              const top = o.prices[0]?.odds;
              return (
                <tr key={o.side} className="border-b last:border-0">
                  <td className="bg-card sticky left-0 px-3 py-2 whitespace-nowrap">
                    {sideName(
                      { market: m.kind, side: o.side, line: m.line, home: props.home, away: props.away },
                      t,
                    )}
                  </td>
                  <td
                    className="tabular px-3 py-2 text-right"
                    title={o.fair ? t("ODDS.FAIR_CHANCE", { chance: prob(o.fair.power) }) : undefined}
                  >
                    {o.fair_odds ? odds(o.fair_odds) : <span className="text-muted-foreground">{t("FORMAT.NA")}</span>}
                  </td>
                  <TickCell value={o.sharp ? Number(o.sharp.odds) : 0} className="tabular text-warning px-3 py-2 text-right">
                    {o.sharp ? odds(o.sharp.odds) : <span className="text-muted-foreground">{t("FORMAT.NA")}</span>}
                  </TickCell>
                  {books.map((b) => {
                    const p = o.prices.find((x) => x.book === b);
                    if (!p) {
                      return (
                        <td key={b} className="text-muted-foreground/40 px-3 py-2 text-right">
                          .
                        </td>
                      );
                    }
                    const value = p.ev !== null && p.ev !== undefined && p.ev > 0;
                    const title =
                      p.ev !== null && p.ev !== undefined
                        ? t("ODDS.PRICE_TITLE_EV", {
                            book: bookName(b),
                            odds: odds(p.odds),
                            ev: percent(p.ev),
                            seen: ago(p.seen_at, props.now, locale),
                          })
                        : t("ODDS.PRICE_TITLE", {
                            book: bookName(b),
                            odds: odds(p.odds),
                            seen: ago(p.seen_at, props.now, locale),
                          });
                    return (
                      <TickCell
                        key={b}
                        value={Number(p.odds)}
                        title={title}
                        className={cn(
                          "tabular px-3 py-2 text-right",
                          cellTone(p, p.odds === top),
                          props.highlight === p.key && "outline-success outline-1 -outline-offset-1",
                        )}
                      >
                        {props.valueLinks && value ? (
                          <Link
                            href={`/value-bets/${encodeURIComponent(p.key)}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {odds(p.odds)}
                          </Link>
                        ) : (
                          odds(p.odds)
                        )}
                      </TickCell>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {m.sharp_overround !== null && m.sharp_overround !== undefined && (
        <div className="text-muted-foreground border-t px-3 py-1.5 text-[11px]">
          {m.sharp_max_stake
            ? t("ODDS.MARGIN_STAKE", {
                margin: percent(m.sharp_overround),
                stake: count(Number(m.sharp_max_stake), locale),
              })
            : t("ODDS.MARGIN", { margin: percent(m.sharp_overround) })}
        </div>
      )}
    </div>
  );
}
