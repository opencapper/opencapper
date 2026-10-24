import { sportGroup, type SportGroup } from "@/lib/config/sports";
import type { ApiPick } from "@/lib/types";
import {
  formatPercent,
  formatRecord,
  formatUnits,
} from "@/lib/utils/format/number";
import { getCapperStats } from "@/server/stats/stats.service";
import { getProfileAvatar, getUserPicks } from "@/server/users/users.service";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";
import { Col, Eyebrow, Frame, Img, Row, Stat } from "../elements/frame";
import { Sparkline } from "../elements/sparkline";
import { FONT_MONO, remoteImage, vendorImage } from "../lib/assets";
import { sportIcon } from "../lib/icons";
import { C, signColor } from "../lib/theme";

const AVATAR = 104;
const SPORT_ICON = 30;
const MAX_SPORTS = 6;

function decimalOdds(american: number): number {
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american;
}

function runningUnits(picks: ApiPick[]): number[] {
  let total = 0;
  return picks
    .filter((pick) => pick.result !== "pending" && pick.result !== "void")
    .toSorted((a, b) => a.sequence - b.sequence)
    .map((pick) => {
      if (pick.result === "win")
        total += pick.units * (decimalOdds(pick.odds) - 1);
      if (pick.result === "loss") total -= pick.units;
      return total;
    });
}

function topSports(picks: ApiPick[]): string[] {
  const counts = new Map<SportGroup, { key: string; count: number }>();
  for (const pick of picks) {
    const group = sportGroup(pick.sportKey);
    if (!group) continue;
    const entry = counts.get(group);
    counts.set(group, {
      key: pick.sportKey,
      count: (entry?.count ?? 0) + 1,
    });
  }
  return [...counts.values()]
    .toSorted((a, b) => b.count - a.count)
    .slice(0, MAX_SPORTS)
    .map((entry) => entry.key);
}

export async function profileCard(
  locale: Locale,
  username: string,
): Promise<ReactNode | null> {
  const [t, stats, picks, avatarUrl] = await Promise.all([
    getTranslations({ locale }),
    getCapperStats(username),
    getUserPicks(username),
    getProfileAvatar(username),
  ]);
  if (stats.hidden) return null;
  const sports = topSports(picks);
  const [avatar, sourceLogo, ...icons] = await Promise.all([
    remoteImage(avatarUrl, AVATAR),
    stats.source ? vendorImage(stats.source.platform, AVATAR) : null,
    ...sports.map((key) => sportIcon(key, SPORT_ICON, C.soft)),
  ]);
  const series = runningUnits(picks);

  return (
    <Frame label={t("PROFILE.LABEL")}>
      <Col style={{ flexGrow: 1, justifyContent: "space-between" }}>
        <Row style={{ alignItems: "center", gap: 32 }}>
          <Img
            src={avatar ?? sourceLogo}
            size={AVATAR}
            fallback={stats.username.slice(0, 1).toUpperCase()}
            round={Boolean(avatar)}
            tile={!avatar && Boolean(sourceLogo)}
          />
          <Col style={{ gap: 12, flexGrow: 1 }}>
            <span style={{ fontSize: 60, fontWeight: 500, letterSpacing: -2 }}>
              {t("PROFILE.HEADING", { username: stats.username })}
            </span>
            <Eyebrow color={C.soft}>
              {stats.source
                ? t("OG.IMPORTED", { platform: stats.source.platform })
                : t("PROFILE.VERIFIED")}
            </Eyebrow>
          </Col>
          <Row style={{ gap: 14, alignSelf: "flex-start" }}>
            {sports.map((key, i) => (
              <Img
                key={key}
                src={icons[i] ?? null}
                size={SPORT_ICON}
                fallback=""
              />
            ))}
          </Row>
        </Row>
        <Row style={{ justifyContent: "space-between" }}>
          <Stat label={t("PROFILE.STATS.RECORD")} value={formatRecord(stats)} />
          <Stat
            label={t("PROFILE.STATS.UNITS")}
            value={formatUnits(stats.units, locale)}
            color={signColor(stats.units)}
          />
          <Stat
            label={t("PROFILE.STATS.ROI")}
            value={formatPercent(stats.roi, locale)}
            color={signColor(stats.roi)}
          />
          {stats.clv !== undefined && (
            <Stat
              label={t("PROFILE.STATS.CLV")}
              value={formatPercent(stats.clv, locale)}
              color={signColor(stats.clv)}
            />
          )}
          <Stat
            label={t("PROFILE.STATS.PICKS")}
            value={new Intl.NumberFormat(locale).format(stats.picks)}
          />
        </Row>
        <Row
          style={{
            height: 96,
            borderTop: `1px solid ${C.hairline}`,
            paddingTop: 16,
            alignItems: "flex-end",
          }}
        >
          {series.length > 1 ? (
            <Sparkline values={series} width={1024} height={80} />
          ) : (
            <span
              style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.faint }}
            >
              {t("PROFILE.CHART.EMPTY")}
            </span>
          )}
        </Row>
      </Col>
    </Frame>
  );
}
