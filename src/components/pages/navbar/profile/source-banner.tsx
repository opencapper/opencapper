"use client";

import { LoginButton } from "@/components/layout/nav/user-menu";
import {
  SOURCE_NAMES,
  SourceIcon,
} from "@/components/elements/source/source-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useAuthUser } from "@/hooks/auth/auth-hook";
import { useProfileVisibilityMutation } from "@/hooks/claims/claims-hook";
import { Link } from "@/i18n/navigation";
import { env } from "@/lib/config/env";
import type {
  ApiProfileClaimant,
  ApiProfileSource,
  ClaimMode,
} from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ClaimDialog } from "./claim-dialog";

// Without a legal inbox the Discord server is the only contact channel.
export function contactHref(subject: string): string {
  if (!env.legalEmail) return env.discordInviteUrl;
  return `mailto:${env.legalEmail}?subject=${encodeURIComponent(subject)}`;
}

const linkClass =
  "text-muted-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline";

export function SourceBanner(props: {
  username: string;
  source: ApiProfileSource;
  claimedBy: ApiProfileClaimant | null;
  claimMode: ClaimMode | null;
}) {
  const t = useTranslations("SOURCES");
  const tRoot = useTranslations();
  const user = useAuthUser();
  const dialog = useState(false);
  const visibility = useProfileVisibilityMutation(props.username);
  const claimedBy = props.claimedBy;
  const owner = claimedBy !== null && user?.username === claimedBy.username;
  const platform = props.source.platform;
  const name = SOURCE_NAMES[platform];

  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <SourceIcon
          platform={platform}
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-1.5 text-sm">
          <p className="font-medium">
            {claimedBy
              ? t("BANNER_TITLE_CLAIMED", {
                  platform: name,
                  username: claimedBy.username,
                })
              : t("BANNER_TITLE", { platform })}
          </p>
          <p className="text-muted-foreground">
            {claimedBy
              ? t("BANNER_BODY_CLAIMED", { platform: name })
              : t("BANNER_BODY", { platform })}
          </p>
          {!claimedBy && props.claimMode === "manual" && (
            <p className="text-muted-foreground">
              {t("MANUAL_CLAIM", { platform: name })}
            </p>
          )}
          {owner && <p className="text-muted-foreground">{t("OWNER_HINT")}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2">
            <a
              href={props.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              {t("BANNER_SOURCE", { platform })}
              <Icon name="external-link" className="size-3.5" />
            </a>
            {claimedBy && (
              <Link
                href={{
                  pathname: "/u/[username]",
                  params: { username: claimedBy.username },
                }}
                className={linkClass}
              >
                <Icon name="user-check" className="size-3.5" />
                {t("CLAIMANT_PROFILE", { username: claimedBy.username })}
              </Link>
            )}
            {!claimedBy && props.claimMode === "manual" && (
              <a
                href={contactHref(`Claim @${props.username}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                <Icon name="mail" className="size-3.5" />
                {t("CONTACT")}
              </a>
            )}
            {!owner && (
              <a
                href={contactHref(`Removal request @${props.username}`)}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {t("REMOVAL")}
                <Icon name="external-link" className="size-3.5" />
              </a>
            )}
          </div>
          {visibility.isError && (
            <p className="text-destructive">
              {apiErrorText(tRoot, visibility.error, t("VISIBILITY_FAILED"))}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {!claimedBy && props.claimMode === "bio" && user && (
            <Button size="sm" onClick={() => dialog[1](true)}>
              <Icon name="shield-check" />
              {t("CLAIM")}
            </Button>
          )}
          {!claimedBy && props.claimMode === "bio" && !user && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">
                {t("LOGIN_TO_CLAIM")}
              </span>
              <LoginButton label />
            </div>
          )}
          {owner && (
            <Button
              size="sm"
              variant="outline"
              disabled={visibility.isPending}
              onClick={() => visibility.mutate(true)}
            >
              <Icon name="eye-off" />
              {t("HIDE")}
            </Button>
          )}
        </div>
      </CardContent>
      {/* Stays mounted while open so the success step survives the refetch that sets the claim. */}
      {user && (dialog[0] || !claimedBy) && (
        <ClaimDialog
          username={props.username}
          platform={platform}
          open={dialog[0]}
          onOpenChange={dialog[1]}
        />
      )}
    </Card>
  );
}
