import type { LeaderboardQuery } from "@/lib/api/typebox/leaderboard";
import { leaderboardFilters } from "@/lib/seo/metadata";
import {
  formatPercent,
  formatRecord,
  formatUnits,
} from "@/lib/utils/format/number";
import { getLeaderboard } from "@/server/leaderboard/leaderboard.service";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { CSSProperties, ReactNode } from "react";
import { Col, Eyebrow, Frame, Img, Row } from "../elements/frame";
import { FONT_MONO, vendorImage } from "../lib/assets";
import { C, signColor } from "../lib/theme";

const TOP = 5;

const COLS = {
  rank: { width: 90 },
  capper: { flexGrow: 1 },
  record: { width: 190, justifyContent: "flex-end" },
  units: { width: 190, justifyContent: "flex-end" },
  roi: { width: 170, justifyContent: "flex-end" },
} satisfies Record<string, CSSProperties>;

function Cell(props: { style: CSSProperties; children: ReactNode }) {
  return (
    <Row style={{ alignItems: "center", gap: 14, ...props.style }}>
      {props.children}
    </Row>
  );
}

export async function leaderboardCard(
  locale: Locale,
  query: Pick<LeaderboardQuery, "sport" | "period">,
): Promise<ReactNode> {
  const [t, board, filters] = await Promise.all([
    getTranslations({ locale }),
    getLeaderboard({ sport: query.sport, period: query.period, sort: "roi" }),
    leaderboardFilters(locale, query.sport, query.period),
  ]);
  const rows = board.rows.slice(0, TOP);
  const sources = await Promise.all(
    rows.map((row) => (row.source ? vendorImage(row.source, 26) : null)),
  );
  const mono = { fontFamily: FONT_MONO, fontSize: 26, fontWeight: 500 };

  return (
    <Frame
      label={t("LEADERBOARD.LABEL")}
      footer={
        <Eyebrow>
          {t("LEADERBOARD.RANKED_COUNT", { total: board.total })}
        </Eyebrow>
      }
    >
      <Col style={{ flexGrow: 1, gap: 18 }}>
        <Row
          style={{ alignItems: "baseline", justifyContent: "space-between" }}
        >
          <span style={{ fontSize: 40, fontWeight: 500, letterSpacing: -1.2 }}>
            {t("OG.TOP_BY_ROI")}
          </span>
          <Eyebrow color={C.soft}>{filters}</Eyebrow>
        </Row>
        {rows.length === 0 ? (
          <Row style={{ flexGrow: 1, alignItems: "center" }}>
            <span style={{ fontSize: 28, color: C.muted }}>
              {t("LEADERBOARD.EMPTY_TITLE")}
            </span>
          </Row>
        ) : (
          <Col>
            <Row
              style={{
                paddingBottom: 10,
                borderBottom: `1px solid ${C.hairline}`,
              }}
            >
              <Cell style={COLS.rank}>
                <Eyebrow>{t("LEADERBOARD.COLUMNS.RANK")}</Eyebrow>
              </Cell>
              <Cell style={COLS.capper}>
                <Eyebrow>{t("LEADERBOARD.COLUMNS.CAPPER")}</Eyebrow>
              </Cell>
              <Cell style={COLS.record}>
                <Eyebrow>{t("LEADERBOARD.COLUMNS.RECORD")}</Eyebrow>
              </Cell>
              <Cell style={COLS.units}>
                <Eyebrow>{t("LEADERBOARD.COLUMNS.UNITS")}</Eyebrow>
              </Cell>
              <Cell style={COLS.roi}>
                <Eyebrow>{t("LEADERBOARD.COLUMNS.ROI")}</Eyebrow>
              </Cell>
            </Row>
            {rows.map((row, i) => (
              <Row
                key={row.username}
                style={{
                  height: 52,
                  borderBottom: `1px solid ${C.hairline}`,
                }}
              >
                <Cell style={COLS.rank}>
                  <span style={{ ...mono, color: C.faint }}>
                    {String(row.rank).padStart(2, "0")}
                  </span>
                </Cell>
                <Cell style={COLS.capper}>
                  <span style={{ fontSize: 28, fontWeight: 500 }}>
                    {`@${row.username}`}
                  </span>
                  {sources[i] && (
                    <Img src={sources[i] ?? null} size={26} fallback="" tile />
                  )}
                </Cell>
                <Cell style={COLS.record}>
                  <span style={{ ...mono, color: C.soft }}>
                    {formatRecord(row)}
                  </span>
                </Cell>
                <Cell style={COLS.units}>
                  <span style={{ ...mono, color: signColor(row.units) }}>
                    {formatUnits(row.units, locale)}
                  </span>
                </Cell>
                <Cell style={COLS.roi}>
                  <span style={{ ...mono, color: signColor(row.roi) }}>
                    {formatPercent(row.roi, locale)}
                  </span>
                </Cell>
              </Row>
            ))}
          </Col>
        )}
      </Col>
    </Frame>
  );
}
