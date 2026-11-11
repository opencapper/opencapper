import Link from "next/link";
import type { BookPrice, Market } from "@/lib/api/client";
import { ago, bookName, marketName, odds, percent, prob, sideName } from "@/lib/format";

function cellTone(p: BookPrice, best: boolean): string {
  if (p.ev !== null && p.ev !== undefined && p.ev > 0) return "bg-win/15 text-win";
  if (best) return "text-foreground";
  return "text-muted";
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
  const m = props.market;
  const books = [...new Set(m.outcomes.flatMap((o) => o.prices.map((p) => p.book)))].sort();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className="sticky left-0 bg-panel px-3 py-2 text-left text-[11px] font-normal uppercase tracking-wider text-muted">
              {marketName({ market: m.kind, period: m.period, line: m.line })}
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-normal uppercase tracking-wider text-muted">Fair</th>
            <th className="px-3 py-2 text-right text-[11px] font-normal uppercase tracking-wider text-muted">Pinnacle</th>
            {books.map((b) => (
              <th key={b} className="whitespace-nowrap px-3 py-2 text-right text-[11px] font-normal text-muted">
                {bookName(b)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {m.outcomes.map((o) => {
            const top = o.prices[0]?.odds;
            return (
              <tr key={o.side} className="border-b border-line/60 last:border-0">
                <td className="sticky left-0 whitespace-nowrap bg-panel px-3 py-2">
                  {sideName({ market: m.kind, side: o.side, line: m.line, home: props.home, away: props.away })}
                </td>
                <td className="tabular px-3 py-2 text-right font-mono" title={o.fair ? `${prob(o.fair.power)} fair chance` : undefined}>
                  {o.fair_odds ? odds(o.fair_odds) : <span className="text-muted">n/a</span>}
                </td>
                <td className="tabular px-3 py-2 text-right font-mono text-warn">
                  {o.sharp ? odds(o.sharp.odds) : <span className="text-muted">n/a</span>}
                </td>
                {books.map((b) => {
                  const p = o.prices.find((x) => x.book === b);
                  if (!p) {
                    return (
                      <td key={b} className="px-3 py-2 text-right text-muted/50">
                        .
                      </td>
                    );
                  }
                  const title = `${bookName(b)} ${odds(p.odds)}${
                    p.ev !== null && p.ev !== undefined ? `, EV ${percent(p.ev)}` : ""
                  }, seen ${ago(p.seen_at, props.now)}`;
                  const content = odds(p.odds);
                  const cls = `tabular px-3 py-2 text-right font-mono ${cellTone(p, p.odds === top)} ${
                    props.highlight === p.key ? "outline outline-1 -outline-offset-1 outline-win" : ""
                  }`;
                  return (
                    <td key={b} className={cls} title={title}>
                      {props.valueLinks && p.ev !== null && p.ev !== undefined && p.ev > 0 ? (
                        <Link href={`/value-bets/${encodeURIComponent(p.key)}`} className="underline-offset-2 hover:underline">
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {m.sharp_overround !== null && m.sharp_overround !== undefined && (
        <div className="border-t border-line/60 px-3 py-1.5 text-[11px] text-muted">
          Pinnacle margin {percent(m.sharp_overround)}
          {m.sharp_max_stake ? `, max stake ${Number(m.sharp_max_stake).toLocaleString("en-GB")}` : ""}
        </div>
      )}
    </div>
  );
}
