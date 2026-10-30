import type {
  PayoutAccountStatus,
  PlanInterval,
} from "@/lib/api/typebox/payments";
import { ApiError } from "@/server/errors";
import { serverEnv } from "@/server/env";
import { WhopClient, WhopError, type Whop } from "@whop/sdk";
import { unwrapWebhook } from "@whop/sdk/helpers";

// The version SDK 2.7.0 ships with; pinned so a server side default cannot change request shapes.
const WHOP_API_VERSION = "2026-10-28";

let client: WhopClient | null = null;
let clientKey = "";

function whop(): WhopClient {
  const payments = serverEnv.payments;
  if (!payments.enabled) throw new ApiError(503, "ERRORS.PAYMENTS_DISABLED");
  if (client && clientKey === payments.whopApiKey) return client;
  client = new WhopClient({
    token: payments.whopApiKey,
    apiVersionDate: WHOP_API_VERSION,
    maxRetries: 1,
  });
  clientKey = payments.whopApiKey;
  return client;
}

// Never the error message: it carries the response body, which can echo bearer links or personal data.
async function call<T>(label: string, request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    const whopError = error instanceof WhopError ? error : null;
    console.error(
      `whop ${label} failed`,
      whopError?.statusCode ?? "no status",
      whopError?.requestId ?? "no request id",
    );
    throw new ApiError(502, "ERRORS.PAYMENTS_PROVIDER_FAILED");
  }
}

// Idempotent on email plus external_id, so a retry returns the same account.
export async function createConnectedAccount(input: {
  email: string;
  title: string;
  userId: number;
}): Promise<string> {
  const account = await call("accounts.create", () =>
    whop().accounts.create(
      {
        email: input.email,
        title: input.title,
        metadata: { external_id: String(input.userId) },
      },
      { idempotencyKey: `opencapper-account-${input.userId}` },
    ),
  );
  return account.id;
}

// A bearer link to identity verification: hand it to the owner only, never log or store it.
export async function createOnboardingLink(input: {
  accountId: string;
  returnUrl: string;
}): Promise<string> {
  const link = await call("accountLinks.create", () =>
    whop().accountLinks.create({
      account_id: input.accountId,
      refresh_url: input.returnUrl,
      return_url: input.returnUrl,
      use_case: "account_onboarding",
    }),
  );
  return link.url;
}

export async function fetchAccountStatus(
  accountId: string,
): Promise<PayoutAccountStatus> {
  const account = await call("accounts.retrieve", () =>
    whop().accounts.retrieve({ id: accountId }),
  );
  if (account.status === "suspended") return "restricted";
  return account.capabilities?.accept_card_payments === "active"
    ? "active"
    : "pending";
}

// Whop refuses a renewal variant without a product, so every capper gets one to hang plans on.
export async function createProduct(input: {
  accountId: string;
  title: string;
  userId: number;
}): Promise<string> {
  const product = await call("products.create", () =>
    whop().products.create(
      {
        account_id: input.accountId,
        title: input.title,
        metadata: { opencapper_user_id: String(input.userId) },
      },
      { idempotencyKey: `opencapper-product-${input.userId}` },
    ),
  );
  return product.id;
}

const BILLING: Record<
  PlanInterval,
  Pick<
    Whop.CreateCheckoutConfigurationsRequest.Variant,
    "billing_type" | "billing_period"
  >
> = {
  week: { billing_type: "renewal", billing_period: 7 },
  month: { billing_type: "renewal", billing_period: 30 },
  one_time: { billing_type: "one_time" },
};

function dollars(cents: number): number {
  return Math.round(cents) / 100;
}

// The live API takes application_fee_amount on the variant; the SDK types do not list it yet.
type FeeVariant = Whop.CreateCheckoutConfigurationsRequest.Variant & {
  application_fee_amount?: number;
};

export async function createCheckout(input: {
  accountId: string;
  productId: string;
  priceCents: number;
  feeCents: number;
  interval: PlanInterval;
  title: string;
  metadata: Record<string, string>;
  redirectUrl: string;
}): Promise<string> {
  const price = dollars(input.priceCents);
  const billing = BILLING[input.interval];
  const variant: FeeVariant = {
    ...billing,
    product_id: input.productId,
    // A renewal variant charges renewal_price each period; initial_price would be charged on top.
    ...(billing.billing_type === "renewal"
      ? { renewal_price: price }
      : { initial_price: price }),
    currency: "usd",
    title: input.title,
    // Hidden and free of per buyer metadata, so Whop reuses one matching variant instead of listing a new one per checkout.
    visibility: "hidden",
    ...(input.feeCents > 0
      ? { application_fee_amount: dollars(input.feeCents) }
      : {}),
  };
  const checkout = await call("checkoutConfigurations.create", () =>
    whop().checkoutConfigurations.create({
      account_id: input.accountId,
      currency: "usd",
      variant,
      metadata: input.metadata,
      redirect_url: input.redirectUrl,
    }),
  );
  if (!checkout.purchase_url)
    throw new ApiError(502, "ERRORS.PAYMENTS_PROVIDER_FAILED");
  return checkout.purchase_url;
}

// Throws on a missing or wrong signature; the caller answers 401.
export function verifyWhopWebhook(
  rawBody: string,
  headers: Headers,
): Record<string, unknown> {
  const plain: Record<string, string> = {};
  headers.forEach((value, key) => {
    plain[key] = value;
  });
  return unwrapWebhook(rawBody, {
    headers: plain,
    key: serverEnv.payments.whopWebhookSecret,
  });
}
