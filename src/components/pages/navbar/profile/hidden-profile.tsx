"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useAuthUser } from "@/hooks/auth/auth-hook";
import {
  useMyClaimsQuery,
  useProfileVisibilityMutation,
} from "@/hooks/claims/claims-hook";
import { Link } from "@/i18n/navigation";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";

export function HiddenProfile(props: { username: string }) {
  const t = useTranslations("PROFILE.HIDDEN");
  const tRoot = useTranslations();
  const user = useAuthUser();
  const claims = useMyClaimsQuery(user !== null);
  const visibility = useProfileVisibilityMutation(props.username);
  const owner = (claims.data ?? []).some(
    (claim) => claim.username === props.username.toLowerCase(),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <Icon name="eye-off" className="text-muted-foreground size-6" />
          <h1 className="text-xl font-medium tracking-tight">{t("HEADING")}</h1>
          <p className="text-muted-foreground text-sm">{t("BODY")}</p>
          <Link
            href="/verify"
            className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            {t("VERIFY_LINK")}
            <Icon name="arrow-right" className="size-3.5" />
          </Link>
          {owner && (
            <div className="border-border/60 flex w-full flex-col gap-3 border-t pt-4">
              <p className="text-muted-foreground text-sm">{t("OWNER_HINT")}</p>
              <Button
                className="self-start"
                variant="outline"
                disabled={visibility.isPending}
                onClick={() => visibility.mutate(false)}
              >
                <Icon name="eye" />
                {t("UNHIDE")}
              </Button>
              {visibility.isError && (
                <p className="text-destructive text-sm">
                  {apiErrorText(tRoot, visibility.error, t("FAILED"))}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
