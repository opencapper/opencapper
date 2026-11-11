import { Ev } from "@/components/elements/odds/ev";
import { SectionTitle } from "@/components/elements/page/page-heading";
import { env } from "@/lib/config/env";
import { bookName } from "@/lib/config/vendor-registry";
import { ago, odds, sideName } from "@/lib/format";
import { groupBets } from "@/lib/group";
import { getLocale, getTranslations } from "next-intl/server";
import { firstPerSelection, type LandingLive } from "../landing-data";
import { DashFrame, type DashTab, type DashTick } from "./dash-frame";
import { FairView, HistoryView, OddsView, ValueBetsView } from "./dash-views";

const TICKS = 12;

export async function DashSection(props: { live: LandingLive; now: number }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const live = props.live;
  const detail = live.detail;
  const top = groupBets(
    live.list.bets.filter((b) => b.confidence === "high" || b.confidence === "medium"),
  ).slice(0, 7);
  const id = detail ? encodeURIComponent(detail.bet.id) : "";

  const tabs: DashTab[] = [
    {
      id: "value",
      label: t("LANDING.DASH.TABS.VALUE_BETS"),
      path: "/value-bets",
      panel: <ValueBetsView groups={live.groups} top={top.length > 0 ? top : live.groups.slice(0, 7)} now={props.now} />,
    },
  ];
  if (detail) {
    tabs.push(
      {
        id: "odds",
        label: t("LANDING.DASH.TABS.ODDS"),
        path: `/games/${encodeURIComponent(detail.bet.game_id)}`,
        panel: <OddsView detail={detail} now={props.now} />,
      },
      {
        id: "fair",
        label: t("LANDING.DASH.TABS.FAIR"),
        path: `/value-bets/${id}`,
        panel: <FairView detail={detail} books={live.books} now={props.now} />,
      },
      {
        id: "history",
        label: t("LANDING.DASH.TABS.HISTORY"),
        path: `/value-bets/${id}`,
        panel: <HistoryView detail={detail} now={props.now} />,
      },
    );
  }

  const ticks: DashTick[] = firstPerSelection(live.ledger.entries).slice(0, TICKS).map((e) => ({
    key: e.id,
    icon: "shield-check",
    text: (
      <>
        {t("LANDING.DASH.TICK", { bet: sideName(e, t), book: bookName(e.book), odds: odds(e.alert_odds) })}
        <Ev value={e.alert_ev} />
      </>
    ),
    when: ago(e.alerted_at, props.now, locale),
  }));

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.DASH.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-6 text-sm leading-relaxed sm:text-[15px]">{t("LANDING.DASH.BODY")}</p>
      <DashFrame
        host={new URL(env.appUrl).host}
        tabs={tabs}
        tickerLabel={t("LANDING.DASH.TICKER_LABEL")}
        ticks={ticks}
      />
      <p className="text-foreground/40 mt-3 text-[11px] leading-relaxed">{t("LANDING.DASH.FOOTNOTE")}</p>
    </section>
  );
}
