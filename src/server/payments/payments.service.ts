import {
  WhopEventEnvelope,
  WhopMembershipEvent,
  type PlanBody,
  type SubscriptionStatus,
} from "@/lib/api/typebox/payments";
import { env } from "@/lib/config/env";
import { getDb, type Db } from "@/lib/db/server/client";
import {
  authUser,
  capperPayoutAccounts,
  capperPlans,
  paymentEvents,
  picks,
  subscriptions,
  users,
  type CapperPayoutAccount,
  type CapperPlan,
} from "@/lib/db/schema/server";
import type {
  ApiCapperPlan,
  AuthUser,
  MyPayments,
  PublicCapperPlan,
} from "@/lib/types";
import { dayjs } from "@/lib/utils/format/date";
import { serverEnv } from "@/server/env";
import { ApiError } from "@/server/errors";
import {
  createCheckout,
  createConnectedAccount,
  createOnboardingLink,
  fetchAccountStatus,
  verifyWhopWebhook,
} from "@/server/payments/whop.client";
import { createRateLimiter } from "@/server/rate-limit";
import { visibleUser } from "@/server/users/hidden";
import { Value } from "@sinclair/typebox/value";
import { and, count, eq, gt, inArray, isNull, or, sql } from "drizzle-orm";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const PROVIDER = "whop";
const STATUS_REFRESH_MS = 60_000;
// Every call here reaches the Whop API, so a user gets a handful per minute.
const providerLimit = createRateLimiter({ limit: 5, windowMs: 60_000 });

function profileUrl(username: string): string {
  // No locale prefix: the middleware sends each visitor to their own language.
  return `${env.siteOrigin}/u/${encodeURIComponent(username)}`;
}

function toPlan(row: CapperPlan): ApiCapperPlan {
  return {
    priceCents: row.priceCents,
    currency: "usd",
    interval: row.interval,
    active: row.active,
  };
}

export function platformFeeCents(priceCents: number, feeBps: number): number {
  return Math.round((priceCents * feeBps) / 10000);
}

async function gradedPickCount(userId: number): Promise<number> {
  const [row] = await getDb()
    .select({ total: count() })
    .from(picks)
    .where(
      and(
        eq(picks.userId, userId),
        inArray(picks.result, ["win", "loss", "push"]),
      ),
    );
  return row?.total ?? 0;
}

async function payoutAccount(
  userId: number,
): Promise<CapperPayoutAccount | null> {
  const [row] = await getDb()
    .select()
    .from(capperPayoutAccounts)
    .where(
      and(
        eq(capperPayoutAccounts.userId, userId),
        eq(capperPayoutAccounts.provider, PROVIDER),
      ),
    )
    .limit(1);
  return row ?? null;
}

async function planOf(userId: number): Promise<CapperPlan | null> {
  const [row] = await getDb()
    .select()
    .from(capperPlans)
    .where(eq(capperPlans.userId, userId))
    .limit(1);
  return row ?? null;
}

async function storeStatus(
  account: CapperPayoutAccount,
): Promise<CapperPayoutAccount> {
  const status = await fetchAccountStatus(account.externalAccountId);
  const [row] = await getDb()
    .update(capperPayoutAccounts)
    .set({ status, updatedAt: new Date() })
    .where(eq(capperPayoutAccounts.id, account.id))
    .returning();
  return row ?? account;
}

// Onboarding finishes on Whop's side without a webhook to us, so the owner's own page polls it.
async function refreshedAccount(
  account: CapperPayoutAccount,
): Promise<CapperPayoutAccount> {
  if (
    account.status === "active" ||
    dayjs().diff(dayjs(account.updatedAt)) < STATUS_REFRESH_MS
  )
    return account;
  try {
    return await storeStatus(account);
  } catch {
    return account;
  }
}

export async function getMyPayments(user: AuthUser): Promise<MyPayments> {
  const payments = serverEnv.payments;
  const [gradedPicks, stored, plan] = await Promise.all([
    gradedPickCount(user.id),
    payoutAccount(user.id),
    planOf(user.id),
  ]);
  const account =
    stored && payments.enabled ? await refreshedAccount(stored) : stored;
  return {
    enabled: payments.enabled,
    feeBps: payments.feeBps,
    minGradedPicks: payments.minGradedPicks,
    gradedPicks,
    eligible: gradedPicks >= payments.minGradedPicks,
    account: account
      ? { provider: account.provider, status: account.status }
      : null,
    plan: plan ? toPlan(plan) : null,
  };
}

async function assertEligible(userId: number) {
  const payments = serverEnv.payments;
  if (!payments.enabled) throw new ApiError(503, "ERRORS.PAYMENTS_DISABLED");
  if ((await gradedPickCount(userId)) < payments.minGradedPicks)
    throw new ApiError(403, "ERRORS.PAYMENTS_NOT_ELIGIBLE");
}

// Telegram logins carry a placeholder address that Whop cannot reach.
async function sellerEmail(userId: number): Promise<string> {
  const [row] = await getDb()
    .select({ email: authUser.email })
    .from(users)
    .innerJoin(authUser, eq(authUser.id, users.authUserId))
    .where(eq(users.id, userId))
    .limit(1);
  const email = row?.email.trim().toLowerCase() ?? "";
  if (!email.includes("@") || email.endsWith("@telegram.invalid"))
    throw new ApiError(409, "ERRORS.PAYMENTS_EMAIL_REQUIRED");
  return email;
}

export async function connectWhop(
  user: AuthUser,
): Promise<{ url: string; status: CapperPayoutAccount["status"] }> {
  await assertEligible(user.id);
  providerLimit(`connect:${user.id}`);
  let account = await payoutAccount(user.id);
  if (!account) {
    const externalAccountId = await createConnectedAccount({
      email: await sellerEmail(user.id),
      title: user.username,
      userId: user.id,
    });
    await getDb()
      .insert(capperPayoutAccounts)
      .values({ userId: user.id, provider: PROVIDER, externalAccountId })
      .onConflictDoNothing();
    account = await payoutAccount(user.id);
    if (!account) throw new ApiError(500, "ERRORS.INTERNAL");
  }
  const url = await createOnboardingLink({
    accountId: account.externalAccountId,
    returnUrl: profileUrl(user.username),
  });
  return { url, status: account.status };
}

export async function onboardingLink(
  user: AuthUser,
): Promise<{ url: string; status: CapperPayoutAccount["status"] }> {
  if (!serverEnv.payments.enabled)
    throw new ApiError(503, "ERRORS.PAYMENTS_DISABLED");
  const account = await payoutAccount(user.id);
  if (!account) throw new ApiError(404, "ERRORS.PAYMENTS_NOT_CONNECTED");
  providerLimit(`link:${user.id}`);
  const url = await createOnboardingLink({
    accountId: account.externalAccountId,
    returnUrl: profileUrl(user.username),
  });
  return { url, status: account.status };
}

export async function setPlan(
  user: AuthUser,
  body: PlanBody,
): Promise<ApiCapperPlan> {
  await assertEligible(user.id);
  if (!(await payoutAccount(user.id)))
    throw new ApiError(409, "ERRORS.PAYMENTS_NOT_CONNECTED");
  const values = {
    priceCents: body.priceCents,
    interval: body.interval,
    active: body.active,
    updatedAt: new Date(),
  };
  const [row] = await getDb()
    .insert(capperPlans)
    .values({ userId: user.id, currency: "usd", ...values })
    .onConflictDoUpdate({ target: capperPlans.userId, set: values })
    .returning();
  if (!row) throw new ApiError(500, "ERRORS.INTERNAL");
  return toPlan(row);
}

// Grace day: a renewal can land shortly after the old period ends.
const accessible = and(
  eq(subscriptions.status, "active"),
  or(
    isNull(subscriptions.currentPeriodEnd),
    gt(subscriptions.currentPeriodEnd, sql`now() - interval '1 day'`),
  ),
);

export async function hasActiveSubscription(
  buyerUserId: number,
  capperUserId: number,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.buyerUserId, buyerUserId),
        eq(subscriptions.capperUserId, capperUserId),
        accessible,
      ),
    )
    .limit(1);
  return row !== undefined;
}

// Sellers are signed up users only: imported and hidden profiles never sell.
async function sellerByName(username: string) {
  const [row] = await getDb()
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(
      and(
        eq(users.username, username.toLowerCase()),
        isNull(users.sourcePlatform),
        visibleUser,
      ),
    )
    .limit(1);
  return row ?? null;
}

async function sellableOffer(capperUserId: number) {
  const [plan, account] = await Promise.all([
    planOf(capperUserId),
    payoutAccount(capperUserId),
  ]);
  if (!plan?.active || account?.status !== "active") return null;
  return { plan, account };
}

// The viewer loads lazily so a disabled feature costs no session lookup.
export async function getCapperPlan(
  username: string,
  loadViewer: () => Promise<AuthUser | null>,
): Promise<PublicCapperPlan> {
  const feeBps = serverEnv.payments.feeBps;
  const none = { plan: null, subscribed: false, feeBps };
  if (!serverEnv.payments.enabled) return none;
  const seller = await sellerByName(username);
  if (!seller) return none;
  const viewer = await loadViewer();
  const [offer, subscribed] = await Promise.all([
    sellableOffer(seller.id),
    viewer && viewer.id !== seller.id
      ? hasActiveSubscription(viewer.id, seller.id)
      : false,
  ]);
  if (!offer) return { ...none, subscribed };
  return {
    plan: {
      priceCents: offer.plan.priceCents,
      currency: "usd",
      interval: offer.plan.interval,
    },
    subscribed,
    feeBps,
  };
}

export async function startCheckout(
  buyer: AuthUser,
  username: string,
): Promise<{ url: string }> {
  const payments = serverEnv.payments;
  if (!payments.enabled) throw new ApiError(503, "ERRORS.PAYMENTS_DISABLED");
  const seller = await sellerByName(username);
  if (!seller) throw new ApiError(404, "ERRORS.PAYMENTS_NO_PLAN");
  if (seller.id === buyer.id)
    throw new ApiError(409, "ERRORS.PAYMENTS_OWN_PLAN");
  const offer = await sellableOffer(seller.id);
  if (!offer) throw new ApiError(404, "ERRORS.PAYMENTS_NO_PLAN");
  if (await hasActiveSubscription(buyer.id, seller.id))
    throw new ApiError(409, "ERRORS.PAYMENTS_ALREADY_SUBSCRIBED");
  providerLimit(`checkout:${buyer.id}`);
  const url = await createCheckout({
    accountId: offer.account.externalAccountId,
    priceCents: offer.plan.priceCents,
    feeCents: platformFeeCents(offer.plan.priceCents, payments.feeBps),
    interval: offer.plan.interval,
    title: `@${seller.username} picks`,
    metadata: {
      buyer_user_id: String(buyer.id),
      capper_user_id: String(seller.id),
    },
    redirectUrl: profileUrl(seller.username),
  });
  return { url };
}

const MEMBERSHIP_STATUS: Record<string, SubscriptionStatus | null> = {
  active: "active",
  trialing: "active",
  canceling: "active",
  completed: "active",
  past_due: "past_due",
  unresolved: "past_due",
  canceled: "canceled",
  expired: "canceled",
  drafted: null,
};

function metadataId(value: unknown): number | null {
  const id = typeof value === "string" ? Number(value) : value;
  return typeof id === "number" && Number.isInteger(id) && id > 0 ? id : null;
}

async function upsertMembership(tx: Tx, event: unknown) {
  if (!Value.Check(WhopMembershipEvent, event)) return;
  const membership = event.data;
  const status = MEMBERSHIP_STATUS[membership.status] ?? null;
  const buyerUserId = metadataId(membership.metadata.buyer_user_id);
  const capperUserId = metadataId(membership.metadata.capper_user_id);
  // Memberships we did not sell through checkout carry no metadata and are ignored.
  const updatedAt = dayjs(membership.updated_at);
  const periodEnd = membership.current_period_end
    ? dayjs(membership.current_period_end)
    : null;
  if (!status || !buyerUserId || !capperUserId) return;
  if (!updatedAt.isValid() || (periodEnd && !periodEnd.isValid())) return;
  const [capper] = await tx
    .select({ id: capperPayoutAccounts.id })
    .from(capperPayoutAccounts)
    .where(
      and(
        eq(capperPayoutAccounts.userId, capperUserId),
        eq(capperPayoutAccounts.provider, PROVIDER),
      ),
    )
    .limit(1);
  const [buyer] = await tx
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, buyerUserId))
    .limit(1);
  if (!capper || !buyer) return;
  const state = {
    status,
    currentPeriodEnd: periodEnd ? periodEnd.toDate() : null,
    providerUpdatedAt: updatedAt.toDate(),
  };
  await tx
    .insert(subscriptions)
    .values({
      buyerUserId,
      capperUserId,
      provider: PROVIDER,
      externalMembershipId: membership.id,
      ...state,
    })
    .onConflictDoUpdate({
      target: [subscriptions.provider, subscriptions.externalMembershipId],
      set: { ...state, updatedAt: new Date() },
      setWhere: sql`${subscriptions.providerUpdatedAt} <= excluded.provider_updated_at`,
    });
}

// Store first, dedupe on the event id, act in the same transaction so a failure lets Whop retry.
export async function handleWhopWebhook(
  rawBody: string,
  headers: Headers,
): Promise<{ received: true }> {
  if (!serverEnv.payments.enabled)
    throw new ApiError(503, "ERRORS.PAYMENTS_DISABLED");
  let event: Record<string, unknown>;
  try {
    event = verifyWhopWebhook(rawBody, headers);
  } catch {
    throw new ApiError(401, "ERRORS.WEBHOOK_SIGNATURE_INVALID");
  }
  if (!Value.Check(WhopEventEnvelope, event))
    throw new ApiError(400, "ERRORS.INVALID_REQUEST", { path: "body" });
  const envelope = { id: event.id, type: event.type };
  await getDb().transaction(async (tx) => {
    const [stored] = await tx
      .insert(paymentEvents)
      .values({
        provider: PROVIDER,
        eventId: envelope.id,
        type: envelope.type,
        payload: event,
      })
      .onConflictDoNothing()
      .returning({ id: paymentEvents.id });
    if (!stored) return;
    if (envelope.type.startsWith("membership."))
      await upsertMembership(tx, event);
  });
  return { received: true };
}
