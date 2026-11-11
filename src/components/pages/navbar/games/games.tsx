import { Ev } from "@/components/elements/odds/ev";
import { Empty, Panel, Unreachable } from "@/components/elements/odds/panel";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Link } from "@/i18n/navigation";
import type { GameSummary } from "@/lib/api/client";
import { day, time, until } from "@/lib/format";
import { useLocale, useTranslations } from "next-intl";

function byDay(games: GameSummary[], locale: string): [string, GameSummary[]][] {
  const out = new Map<string, GameSummary[]>();
  for (const g of games) {
    const d = day(g.starts_at, locale);
    out.set(d, [...(out.get(d) ?? []), g]);
  }
  return [...out.entries()];
}

export function Games(props: { data?: GameSummary[]; q?: string; now: number }) {
  const t = useTranslations();
  const tg = useTranslations("GAMES");
  const locale = useLocale();
  const data = props.data;

  return (
    <PageShell>
      <PageHeading className="mb-0" label={tg("LABEL")} title={tg("HEADING")} description={tg("SUBHEADING")} />
      <form className="flex max-w-md gap-2" action={`/${locale}/games`}>
        <Input name="q" defaultValue={props.q} placeholder={tg("SEARCH_PLACEHOLDER")} aria-label={tg("SEARCH_PLACEHOLDER")} />
        <Button type="submit" variant="outline">
          <Icon name="search" />
          {tg("SEARCH")}
        </Button>
      </form>
      {!data && <Unreachable />}
      {data &&
        byDay(data, locale).map((entry) => (
          <Panel key={entry[0]} title={entry[0]}>
            <ul className="divide-y">
              {entry[1].map((g) => (
                <li key={g.id}>
                  <Link
                    href={`/games/${encodeURIComponent(g.id)}`}
                    className="hover:bg-muted/50 grid grid-cols-[52px_1fr_auto] items-center gap-3 px-4 py-2.5 text-sm transition-colors sm:grid-cols-[52px_1fr_200px_100px_70px]"
                  >
                    <span className="tabular text-muted-foreground text-xs" title={until(g.starts_at, props.now, locale, t)}>
                      {time(g.starts_at, locale)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate">
                        {g.home} <span className="text-muted-foreground">{t("FORMAT.VS")}</span> {g.away}
                      </span>
                      <span className="text-muted-foreground block truncate text-[11px]">{g.league}</span>
                    </span>
                    <span className="text-muted-foreground hidden text-xs sm:block">
                      {tg("COVERAGE", { books: g.books.length, markets: g.markets })}
                    </span>
                    <span className="hidden text-right text-xs sm:block">
                      {g.value_bets > 0 ? (
                        tg("VALUE_COUNT", { count: String(g.value_bets) })
                      ) : (
                        <span className="text-muted-foreground">{tg("NO_VALUE")}</span>
                      )}
                    </span>
                    <span className="text-right text-xs">{g.best_ev ? <Ev value={g.best_ev} /> : null}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      {data && data.length === 0 && (
        <Panel>
          <Empty>{tg("EMPTY")}</Empty>
        </Panel>
      )}
    </PageShell>
  );
}
