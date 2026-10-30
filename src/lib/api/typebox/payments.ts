import { t } from "elysia";

// A single member union collapses to the literal; widen to t.Union when stripe or crypto lands.
export const PaymentProvider = t.Literal("whop");
export type PaymentProvider = typeof PaymentProvider.static;
export const PAYMENT_PROVIDERS = [PaymentProvider.const];

export const PayoutAccountStatus = t.Union([
  t.Literal("pending"),
  t.Literal("active"),
  t.Literal("restricted"),
]);
export type PayoutAccountStatus = typeof PayoutAccountStatus.static;
export const PAYOUT_ACCOUNT_STATUSES = PayoutAccountStatus.anyOf.map(
  (l) => l.const,
);

export const PlanInterval = t.Union([
  t.Literal("week"),
  t.Literal("month"),
  t.Literal("one_time"),
]);
export type PlanInterval = typeof PlanInterval.static;
export const PLAN_INTERVALS = PlanInterval.anyOf.map((l) => l.const);

export const SubscriptionStatus = t.Union([
  t.Literal("active"),
  t.Literal("canceled"),
  t.Literal("past_due"),
]);
export type SubscriptionStatus = typeof SubscriptionStatus.static;
export const SUBSCRIPTION_STATUSES = SubscriptionStatus.anyOf.map(
  (l) => l.const,
);

export const PLAN_MIN_CENTS = 100;
export const PLAN_MAX_CENTS = 50000;

export const PlanBody = t.Object({
  priceCents: t.Integer({ minimum: PLAN_MIN_CENTS, maximum: PLAN_MAX_CENTS }),
  interval: PlanInterval,
  active: t.Boolean(),
});
export type PlanBody = typeof PlanBody.static;

export const PaymentsUserParams = t.Object({
  username: t.String({ minLength: 2, maxLength: 32 }),
});

// The webhook body is checked against this before any field is trusted.
export const WhopMembershipEvent = t.Object({
  id: t.String({ minLength: 1 }),
  type: t.String({ minLength: 1 }),
  data: t.Object({
    id: t.String({ minLength: 1 }),
    status: t.String(),
    current_period_end: t.Union([t.String(), t.Null()]),
    updated_at: t.String(),
    metadata: t.Record(t.String(), t.Unknown()),
    // Checked against the capper's stored Whop ids: metadata alone is not proof of who sold it.
    account: t.Object({ id: t.String({ minLength: 1 }) }),
    product_id: t.Optional(t.Union([t.String(), t.Null()])),
  }),
});

export const WhopEventEnvelope = t.Object({
  id: t.String({ minLength: 1 }),
  type: t.String({ minLength: 1 }),
});
