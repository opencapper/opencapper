import { t } from "elysia";

export const CHECK_QUERY_MAX = 200;

export const CheckQuery = t.Object({
  q: t.String({ minLength: 1, maxLength: CHECK_QUERY_MAX }),
});
export type CheckQuery = typeof CheckQuery.static;

export const CheckDiscordParams = t.Object({
  discordId: t.String({ pattern: "^[0-9]{15,21}$" }),
});

// How the query reached the profile; shown as "matched by" on the result card.
export const CheckMatchKind = t.Union([
  t.Literal("username"),
  t.Literal("discord"),
  t.Literal("telegram"),
  t.Literal("polymarket"),
  t.Literal("reddit"),
]);
export type CheckMatchKind = typeof CheckMatchKind.static;

// "member" signed up here, "imported" is an unclaimed public profile, "claimed" an imported one its owner proved.
export const CheckStatus = t.Union([
  t.Literal("member"),
  t.Literal("imported"),
  t.Literal("claimed"),
]);
export type CheckStatus = typeof CheckStatus.static;

// Any string: an invalid or unknown name still answers with the neutral badge, never a JSON error.
export const BadgeParams = t.Object({
  username: t.String({ maxLength: 64 }),
});
