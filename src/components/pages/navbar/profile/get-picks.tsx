"use client";

import { LoginButton } from "@/components/layout/nav/user-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useAuthUser } from "@/hooks/auth/auth-hook";
import {
  useCapperPlanQuery,
  useCheckoutMutation,
} from "@/hooks/payments/payments-hook";
import { env } from "@/lib/config/env";
import { apiErrorText } from "@/lib/utils/api-error";
import { useLocale, useTranslations } from "next-intl";
import { PRICE_LABELS, formatFeeShare, formatUsd } from "./payment-labels";

export function GetPicks(props: { username: string }) {
  const t = useTranslations("PAYMENTS");
  const tRoot = useTranslations();
  const locale = useLocale();
  const user = useAuthUser();
  const offer = useCapperPlanQuery(props.username);
  const checkout = useCheckoutMutation(props.username);
  const plan = offer.data?.plan;
  if (!offer.data || !plan) return null;
  const price = tRoot(PRICE_LABELS[plan.interval], {
    price: formatUsd(plan.priceCents, locale),
  });

  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1 text-sm">
          <p className="font-medium">{t("GET.TITLE")}</p>
          <p className="text-muted-foreground">
            {t("GET.BODY", { username: props.username })}
          </p>
          <p className="text-muted-foreground text-xs">
            {t("FEE", {
              appName: env.appName,
              percent: formatFeeShare(offer.data.feeBps, locale),
            })}
          </p>
          {checkout.isError && (
            <p className="text-destructive">
              {apiErrorText(tRoot, checkout.error, t("GET.FAILED"))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span className="tabular text-sm font-medium">{price}</span>
          {offer.data.subscribed && (
            <Badge variant="outline">
              <Icon name="circle-check" />
              {t("GET.SUBSCRIBED")}
            </Badge>
          )}
          {!offer.data.subscribed && user && (
            <Button
              size="sm"
              disabled={checkout.isPending || checkout.isSuccess}
              onClick={() => checkout.mutate()}
            >
              <Icon name={checkout.isPending ? "loader" : "lock"} />
              {t("GET.BUTTON")}
            </Button>
          )}
          {!offer.data.subscribed && !user && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {t("GET.LOGIN")}
              </span>
              <LoginButton label />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
