"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMyPaymentsQuery,
  useSavePlanMutation,
  useWhopOnboardingMutation,
} from "@/hooks/payments/payments-hook";
import {
  PLAN_INTERVALS,
  PLAN_MAX_CENTS,
  PLAN_MIN_CENTS,
  type PlanInterval,
} from "@/lib/api/typebox/payments";
import type { ApiCapperPlan, MyPayments } from "@/lib/types";
import { env } from "@/lib/config/env";
import { apiErrorText } from "@/lib/utils/api-error";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  ACCOUNT_STATUS_LABELS,
  INTERVAL_LABELS,
  formatFeeShare,
  formatUsd,
} from "./payment-labels";

export function SellPicks(props: { username: string }) {
  const t = useTranslations("PAYMENTS");
  const locale = useLocale();
  const payments = useMyPaymentsQuery(true);
  const data = payments.data;
  if (!data?.enabled) return null;

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("SELL.TITLE")}</CardTitle>
        <CardDescription>{t("SELL.DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!data.eligible && <Progress data={data} />}
        {data.eligible && <PayoutAccount data={data} />}
        {data.eligible && data.account && (
          <PlanForm
            key={JSON.stringify(data.plan)}
            username={props.username}
            plan={data.plan}
            accountActive={data.account.status === "active"}
          />
        )}
        <p className="text-muted-foreground text-xs">
          {t("FEE", {
            appName: env.appName,
            percent: formatFeeShare(data.feeBps, locale),
          })}
        </p>
      </CardContent>
    </Card>
  );
}

function Progress(props: { data: MyPayments }) {
  const t = useTranslations("PAYMENTS.SELL");
  const graded = Math.min(props.data.gradedPicks, props.data.minGradedPicks);
  const share = props.data.minGradedPicks
    ? (graded / props.data.minGradedPicks) * 100
    : 0;
  return (
    <div className="space-y-2">
      <p className="tabular text-sm font-medium">
        {t("PROGRESS", {
          graded: props.data.gradedPicks,
          min: props.data.minGradedPicks,
        })}
      </p>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          className="bg-foreground/70 h-full rounded-full"
          style={{ width: `${share}%` }}
        />
      </div>
      <p className="text-muted-foreground text-sm">
        {t("NOT_ELIGIBLE", { min: props.data.minGradedPicks })}
      </p>
    </div>
  );
}

function PayoutAccount(props: { data: MyPayments }) {
  const t = useTranslations("PAYMENTS.SELL");
  const tRoot = useTranslations();
  const onboarding = useWhopOnboardingMutation();
  const account = props.data.account;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">{t("ACCOUNT")}</span>
          {account && (
            <Badge
              variant={
                account.status === "restricted" ? "destructive" : "outline"
              }
            >
              {tRoot(ACCOUNT_STATUS_LABELS[account.status])}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground">
          {!account && t("CONNECT_BODY")}
          {account?.status === "pending" && t("PENDING_BODY")}
          {account?.status === "restricted" && t("RESTRICTED_BODY")}
        </p>
        {onboarding.isError && (
          <p className="text-destructive">
            {apiErrorText(tRoot, onboarding.error, t("FAILED"))}
          </p>
        )}
      </div>
      {account?.status !== "active" && (
        <Button
          size="sm"
          className="shrink-0"
          disabled={onboarding.isPending}
          onClick={() => onboarding.mutate(account !== null)}
        >
          <Icon name={onboarding.isPending ? "loader" : "store"} />
          {account ? t("CONTINUE") : t("CONNECT")}
        </Button>
      )}
    </div>
  );
}

function PlanForm(props: {
  username: string;
  plan: ApiCapperPlan | null;
  accountActive: boolean;
}) {
  const t = useTranslations("PAYMENTS.SELL");
  const tRoot = useTranslations();
  const locale = useLocale();
  const save = useSavePlanMutation(props.username);
  const price = useState(
    props.plan ? (props.plan.priceCents / 100).toFixed(2) : "",
  );
  const interval = useState<PlanInterval>(props.plan?.interval ?? "month");
  const visible = useState(props.plan?.active ?? true);
  const cents = Math.round(Number(price[0]) * 100);
  const valid =
    price[0].trim() !== "" &&
    Number.isFinite(cents) &&
    cents >= PLAN_MIN_CENTS &&
    cents <= PLAN_MAX_CENTS;
  const status = !props.plan
    ? null
    : !props.plan.active
      ? t("PLAN_HIDDEN")
      : props.accountActive
        ? t("PLAN_LIVE")
        : t("PLAN_WAITING");

  return (
    <form
      className="border-border/60 space-y-4 border-t pt-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!valid) return;
        save.mutate(
          { priceCents: cents, interval: interval[0], active: visible[0] },
          { onSuccess: () => toast.success(t("SAVED")) },
        );
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{t("PLAN")}</span>
        {status && (
          <span className="text-muted-foreground text-xs">{status}</span>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="plan-price" className="label-mono text-[10px]">
            {t("PRICE")}
          </Label>
          <Input
            id="plan-price"
            type="number"
            inputMode="decimal"
            min={PLAN_MIN_CENTS / 100}
            max={PLAN_MAX_CENTS / 100}
            step="0.01"
            value={price[0]}
            aria-invalid={price[0] !== "" && !valid}
            onChange={(event) => price[1](event.target.value)}
            className="tabular"
          />
          <p className="text-muted-foreground text-xs">
            {t("PRICE_RANGE", {
              min: formatUsd(PLAN_MIN_CENTS, locale),
              max: formatUsd(PLAN_MAX_CENTS, locale),
            })}
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="plan-interval" className="label-mono text-[10px]">
            {t("INTERVAL")}
          </Label>
          <Select
            value={interval[0]}
            onValueChange={(value) => {
              const next = PLAN_INTERVALS.find((i) => i === value);
              if (next) interval[1](next);
            }}
          >
            <SelectTrigger id="plan-interval" className="w-full">
              <SelectValue>
                {(value) => {
                  const next = PLAN_INTERVALS.find((i) => i === value);
                  return next ? tRoot(INTERVAL_LABELS[next]) : null;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {PLAN_INTERVALS.map((option) => (
                <SelectItem key={option} value={option}>
                  {tRoot(INTERVAL_LABELS[option])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={visible[0]}
          onChange={(event) => visible[1](event.target.checked)}
          className="accent-foreground size-4"
        />
        {t("VISIBLE")}
      </label>
      {save.isError && (
        <p className="text-destructive text-sm">
          {apiErrorText(tRoot, save.error, t("FAILED"))}
        </p>
      )}
      <Button type="submit" size="sm" disabled={!valid || save.isPending}>
        <Icon name={save.isPending ? "loader" : "check"} />
        {t("SAVE")}
      </Button>
    </form>
  );
}
