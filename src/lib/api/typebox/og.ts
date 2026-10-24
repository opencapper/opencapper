import {
  LeaderboardPeriod,
  LeaderboardSport,
} from "@/lib/api/typebox/leaderboard";
import { LOCALES } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import { t } from "elysia";

export const OgTemplate = t.Union([
  t.Literal("home"),
  t.Literal("profile"),
  t.Literal("pick"),
  t.Literal("leaderboard"),
  t.Literal("verify"),
]);
export type OgTemplate = typeof OgTemplate.static;

const Username = t.String({ pattern: "^@?[A-Za-z0-9_.]{2,32}$" });
const Seq = t.String({ pattern: "^[1-9][0-9]{0,8}$" });

export const OgParams = t.Object({ template: OgTemplate });

export const OgQuery = t.Object({
  locale: t.Optional(t.Union(LOCALES.map((l) => t.Literal(l)))),
  username: t.Optional(Username),
  pick: t.Optional(Seq),
  seq: t.Optional(Seq),
  sport: t.Optional(LeaderboardSport),
  period: t.Optional(LeaderboardPeriod),
  v: t.Optional(t.String({ maxLength: 64 })),
});
export type OgQuery = typeof OgQuery.static;

export function buildOgUrl(
  template: OgTemplate,
  query: Omit<OgQuery, "v">,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  params.set("v", env.releaseVersion);
  return `/api/ops/og/${template}?${params.toString()}`;
}
