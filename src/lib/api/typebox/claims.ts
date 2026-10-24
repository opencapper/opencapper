import { t } from "elysia";

export const ClaimMethod = t.Union([
  t.Literal("polymarket_bio"),
  t.Literal("reddit_bio"),
  t.Literal("admin"),
]);
export type ClaimMethod = typeof ClaimMethod.static;

export const CLAIM_METHODS = ClaimMethod.anyOf.map((l) => l.const);

export const ClaimParams = t.Object({
  username: t.String({ minLength: 2, maxLength: 32 }),
});

export const AdminProfileParams = t.Object({
  id: t.Numeric({ minimum: 1, multipleOf: 1 }),
});

export const AdminClaimBody = t.Object({
  claimant: t.String({ minLength: 2, maxLength: 33 }),
});
export type AdminClaimBody = typeof AdminClaimBody.static;
