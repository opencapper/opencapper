import { api, load } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import {
  count,
  kickoff,
  marketName,
  odds,
  percent,
  sideName,
} from "@/lib/format";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { FONT_DISPLAY, FONT_SERIF, remoteImage } from "./assets";
import {
  C,
  Col,
  Eyebrow,
  Frame,
  Row,
  Stat,
  TeamImage,
  Wordmark,
} from "./frame";

export const OG_SECTIONS = [
  "VALUE_BETS",
  "ARBS",
  "GAMES",
  "BOOKS",
  "PROOF",
  "TOOLS",
] as const;
export type OgSection = (typeof OG_SECTIONS)[number];

const TEAM = 96;

function Headline(props: { children: ReactNode; size?: number }) {
  return (
    <span
      style={{
        fontFamily: FONT_DISPLAY,
        fontSize: props.size ?? 72,
        lineHeight: 0.95,
        textTransform: "uppercase",
        maxWidth: 1000,
      }}
    >
      {props.children}
    </span>
  );
}

function Body(props: { children: ReactNode }) {
  return (
    <span
      style={{
        fontFamily: FONT_SERIF,
        fontStyle: "italic",
        fontSize: 34,
        lineHeight: 1.2,
        color: C.soft,
        maxWidth: 940,
      }}
    >
      {props.children}
    </span>
  );
}

export async function brandCard(locale: Locale): Promise<ReactNode> {
  const t = await getTranslations({ locale });
  return (
    <Frame label={t("VALUE_BETS.LABEL")}>
      <Col style={{ flexGrow: 1, justifyContent: "center", gap: 36 }}>
        <Wordmark size={64} />
        <span
          style={{
            fontSize: 30,
            lineHeight: 1.35,
            color: C.soft,
            maxWidth: 900,
          }}
        >
          {t("METADATA.DESCRIPTION")}
        </span>
      </Col>
    </Frame>
  );
}

export async function homeCard(locale: Locale): Promise<ReactNode> {
  const t = await getTranslations({ locale });
  const results = await Promise.all([
    load(
      api.GET("/v1/value-bets", {
        params: { query: { limit: 1000 } },
        cache: "no-store",
      }),
    ),
    load(api.GET("/v1/books", { cache: "no-store" })),
    load(
      api.GET("/v1/ledger", {
        params: { query: { limit: 1 } },
        cache: "no-store",
      }),
    ),
  ]);
  const list = results[0];
  const soft = results[1]?.filter((b) => b.book !== "pinnacle").length;
  const stats = results[2]?.stats;
  return (
    <Frame
      pitch
      label={t("LANDING.BOARD.TITLE")}
      footer={<Eyebrow>{t("LANDING.ISSUE_FREE")}</Eyebrow>}
    >
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Col>
          <Headline size={104}>{t("LANDING.HERO.TITLE_A")}</Headline>
          <Row style={{ alignItems: "baseline", gap: 18 }}>
            <span
              style={{
                fontFamily: FONT_SERIF,
                fontStyle: "italic",
                fontSize: 84,
                lineHeight: 1,
                color: C.edge,
              }}
            >
              {t("LANDING.HERO.TITLE_B")}
            </span>
            <Headline size={104}>{t("LANDING.HERO.TITLE_C")}</Headline>
          </Row>
        </Col>
        <Row style={{ gap: 56 }}>
          {list && (
            <Stat
              label={t("LANDING.NAV_LIVE")}
              value={count(
                list.bets.filter((b) => b.confidence !== "check").length,
                locale,
              )}
              color={C.edge}
            />
          )}
          {soft !== undefined && (
            <Stat label={t("NAV.BOOKS")} value={count(soft, locale)} />
          )}
          {stats && (
            <Stat
              label={t("LANDING.PROOF.ALERTS")}
              value={count(stats.alerts, locale)}
            />
          )}
        </Row>
      </Col>
    </Frame>
  );
}

export async function sectionCard(
  locale: Locale,
  section: OgSection,
): Promise<ReactNode> {
  const t = await getTranslations({ locale });
  return (
    <Frame label={t(`${section}.LABEL`)}>
      <Col style={{ flexGrow: 1, justifyContent: "center", gap: 28 }}>
        <Headline>{t(`${section}.HEADING`)}</Headline>
        {/* The arbs subheading describes the stake table below it, which a card does not have. */}
        {section !== "ARBS" && <Body>{t(`${section}.SUBHEADING`)}</Body>}
      </Col>
    </Frame>
  );
}

function Matchup(props: {
  home: string;
  away: string;
  homeImage: string | null;
  awayImage: string | null;
}) {
  return (
    <Row style={{ alignItems: "center", gap: 28 }}>
      <TeamImage src={props.homeImage} size={TEAM} name={props.home} />
      <Col style={{ gap: 6, maxWidth: 820 }}>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 56,
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {props.home}
        </span>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: 56,
            lineHeight: 1,
            textTransform: "uppercase",
            color: C.soft,
          }}
        >
          {props.away}
        </span>
      </Col>
      <TeamImage src={props.awayImage} size={TEAM} name={props.away} />
    </Row>
  );
}

export async function gameCard(
  locale: Locale,
  id: string,
): Promise<ReactNode | null> {
  const game = await load(
    api.GET("/v1/games/{id}", { params: { path: { id } }, cache: "no-store" }),
  );
  if (!game) return null;
  const g = game.summary;
  const t = await getTranslations({ locale, namespace: "GAME" });
  const images = await Promise.all([
    remoteImage(g.home_image, TEAM),
    remoteImage(g.away_image, TEAM),
  ]);
  return (
    <Frame
      label={g.league}
      footer={<Eyebrow>{kickoff(g.starts_at, locale)}</Eyebrow>}
    >
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Matchup
          home={g.home}
          away={g.away}
          homeImage={images[0]}
          awayImage={images[1]}
        />
        <Row style={{ gap: 64 }}>
          <Stat label={t("STAT_BOOKS")} value={count(g.books.length, locale)} />
          <Stat label={t("STAT_MARKETS")} value={count(g.markets, locale)} />
          <Stat label={t("STAT_VALUE")} value={count(g.value_bets, locale)} />
          <Stat
            label={t("STAT_BEST_EV")}
            value={g.best_ev != null ? percent(g.best_ev) : t("NONE")}
            color={g.best_ev != null && g.best_ev > 0 ? C.win : undefined}
          />
        </Row>
      </Col>
    </Frame>
  );
}

export async function betCard(
  locale: Locale,
  id: string,
): Promise<ReactNode | null> {
  const detail = await load(
    api.GET("/v1/value-bets/{id}", {
      params: { path: { id } },
      cache: "no-store",
    }),
  );
  if (!detail) return null;
  const b = detail.bet;
  const t = await getTranslations({ locale });
  const images = await Promise.all([
    remoteImage(b.home_image, 56),
    remoteImage(b.away_image, 56),
  ]);
  return (
    <Frame label={t("BET.LABEL")} footer={<Eyebrow>{b.league}</Eyebrow>}>
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Col style={{ gap: 22 }}>
          <Headline size={56}>
            {t("BET.TITLE", { bet: sideName(b, t), book: bookName(b.book) })}
          </Headline>
          <Row style={{ alignItems: "center", gap: 16 }}>
            <TeamImage src={images[0]} size={56} name={b.home} />
            <TeamImage src={images[1]} size={56} name={b.away} />
            <span style={{ fontSize: 26, color: C.muted, marginLeft: 8 }}>
              {`${t("FORMAT.MATCHUP", { home: b.home, away: b.away })}, ${marketName(b, t)}`}
            </span>
          </Row>
        </Col>
        <Row style={{ gap: 64 }}>
          <Stat
            label={t("BET.STAT_EV")}
            value={percent(b.ev)}
            color={C.edge}
            size={64}
          />
          <Stat
            label={t("BET.STAT_SAFE_EV")}
            value={percent(b.ev_conservative)}
            size={64}
          />
          <Stat label={t("BET.STAT_ODDS")} value={odds(b.odds)} size={64} />
          <Stat
            label={t("BET.STAT_FAIR")}
            value={odds(b.fair_odds)}
            size={64}
          />
        </Row>
      </Col>
    </Frame>
  );
}
