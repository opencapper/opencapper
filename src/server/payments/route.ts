import { PaymentsUserParams, PlanBody } from "@/lib/api/typebox/payments";
import { getAuthUser, requireAuthUser } from "@/server/auth/auth";
import {
  connectWhop,
  getCapperPlan,
  getMyPayments,
  handleWhopWebhook,
  onboardingLink,
  setPlan,
  startCheckout,
} from "@/server/payments/payments.service";
import { Elysia } from "elysia";

export const paymentsRoute = new Elysia({ prefix: "/payments" })
  .get("/me", async (ctx) =>
    getMyPayments(await requireAuthUser(ctx.request.headers)),
  )
  .post("/whop/connect", async (ctx) =>
    connectWhop(await requireAuthUser(ctx.request.headers)),
  )
  .post("/whop/onboarding-link", async (ctx) =>
    onboardingLink(await requireAuthUser(ctx.request.headers)),
  )
  .put(
    "/plan",
    async (ctx) =>
      setPlan(await requireAuthUser(ctx.request.headers), ctx.body),
    { body: PlanBody },
  )
  // The signature covers the exact bytes, so the body is read raw instead of parsed.
  .post(
    "/webhooks/whop",
    async (ctx) =>
      handleWhopWebhook(await ctx.request.text(), ctx.request.headers),
    { parse: "none" },
  )
  .get(
    "/:username/plan",
    (ctx) =>
      getCapperPlan(ctx.params.username, () =>
        getAuthUser(ctx.request.headers),
      ),
    { params: PaymentsUserParams },
  )
  .post(
    "/:username/checkout",
    async (ctx) =>
      startCheckout(
        await requireAuthUser(ctx.request.headers),
        ctx.params.username,
      ),
    { params: PaymentsUserParams },
  );
