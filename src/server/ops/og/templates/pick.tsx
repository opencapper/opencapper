import { sportLabelKey } from "@/components/elements/sport/sport-icon";
import { isMarket, MARKET_KEY, PICK_STATUS_KEY } from "@/lib/config/markets";
import { vendorName } from "@/lib/config/vendor-registry";
import type { ApiPick } from "@/lib/types";
import { formatUtcDateTime } from "@/lib/utils/format/date";
import {
  formatAmericanOdds,
  formatPlainUnits,
} from "@/lib/utils/format/number";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import {
  Col,
  Eyebrow,
  Frame,
  Img,
  initials,
  Row,
  Stat,
} from "../elements/frame";
import { FONT_MONO, remoteImage, vendorImage } from "../lib/assets";
import { sportIcon } from "../lib/icons";
import { C, resultColor } from "../lib/theme";

const TEAM = 76;
const BOOK = 40;

function Team(props: { name: string; image: string | null }) {
  return (
    <Row style={{ alignItems: "center", gap: 20, maxWidth: 470 }}>
      <Img
        src={props.image}
        size={TEAM}
        fallback={initials(props.name)}
        round={!props.image}
      />
      <span
        style={{
          fontSize: 34,
          fontWeight: 500,
          letterSpacing: -0.8,
          lineHeight: 1.1,
        }}
      >
        {props.name}
      </span>
    </Row>
  );
}

export async function pickCard(
  locale: Locale,
  pick: ApiPick,
): Promise<ReactNode> {
  const [t, away, home, book, sport] = await Promise.all([
    getTranslations({ locale }),
    remoteImage(pick.awayImage, TEAM),
    remoteImage(pick.homeImage, TEAM),
    vendorImage(pick.bookmaker, BOOK),
    sportIcon(pick.sportKey, 26, C.soft),
  ]);
  const color = resultColor(pick.result);
  const tinted = pick.result === "win" || pick.result === "loss";

  return (
    <Frame
      label={t("OG.PICK_LABEL")}
      footer={
        <Eyebrow color={pick.logSeq ? C.soft : C.muted}>
          {pick.logSeq
            ? t("OG.SEALED", { seq: String(pick.logSeq) })
            : t("OG.NOT_SEALED")}
        </Eyebrow>
      }
    >
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Row style={{ alignItems: "center", justifyContent: "space-between" }}>
          <Row style={{ alignItems: "center", gap: 14 }}>
            <Img src={sport} size={26} fallback="" />
            <Eyebrow color={C.soft}>
              {`${t(sportLabelKey(pick.sportKey))}, ${isMarket(pick.market) ? t(MARKET_KEY[pick.market]) : pick.market}`}
            </Eyebrow>
            <Eyebrow>{`@${pick.username} #${pick.sequence}`}</Eyebrow>
          </Row>
          <Row
            style={{
              padding: "8px 16px",
              border: `1px solid ${tinted ? color : C.hairline}`,
              backgroundColor: tinted ? `${color}22` : C.fill,
            }}
          >
            <Eyebrow color={color}>{t(PICK_STATUS_KEY[pick.result])}</Eyebrow>
          </Row>
        </Row>
        <Row style={{ alignItems: "center", gap: 28 }}>
          <Team name={pick.away} image={away} />
          <span style={{ fontFamily: FONT_MONO, fontSize: 28, color: C.faint }}>
            @
          </span>
          <Team name={pick.home} image={home} />
        </Row>
        <span
          style={{
            fontSize: 58,
            fontWeight: 600,
            letterSpacing: -2,
            color: tinted ? color : C.text,
          }}
        >
          {pick.selection}
        </span>
        <Row style={{ gap: 64, alignItems: "flex-end" }}>
          <Row style={{ alignItems: "flex-end", gap: 18 }}>
            <Stat
              label={t("LANDING.SHOWCASE.ODDS")}
              value={formatAmericanOdds(pick.odds)}
              size={36}
            />
            <Img
              src={book}
              size={BOOK}
              fallback={vendorName(pick.bookmaker).slice(0, 2).toUpperCase()}
              tile
            />
          </Row>
          <Stat
            label={t("OG.STAKE")}
            value={`${formatPlainUnits(pick.units, locale)}u`}
            size={36}
          />
          <Stat
            label={t("OG.LOCKED")}
            value={formatUtcDateTime(pick.createdAt, locale)}
            size={36}
          />
        </Row>
      </Col>
    </Frame>
  );
}
