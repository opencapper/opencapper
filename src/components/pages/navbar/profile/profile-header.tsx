import { SectionLabel } from "@/components/elements/page/page-heading";
import { CapperAvatar } from "@/components/elements/capper/capper-avatar";
import {
  PublicBadge,
  SourceIcon,
} from "@/components/elements/source/source-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { ProofMarkerStyle } from "@/lib/config/ranking";
import type {
  ApiClaimedProfile,
  ApiProfileClaimant,
  ApiProfileSource,
} from "@/lib/types";
import { useTranslations } from "next-intl";

export function ProfileHeader(props: {
  username: string;
  avatarUrl: string | null | undefined;
  verified: boolean;
  source: ApiProfileSource | null;
  marker: ProofMarkerStyle;
  own: boolean;
  claimedBy: ApiProfileClaimant | null;
  claimed: ApiClaimedProfile[];
}) {
  const t = useTranslations("PROFILE");

  return (
    <header>
      <SectionLabel as="p">{t("LABEL")}</SectionLabel>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <CapperAvatar
          username={props.username}
          imageUrl={props.avatarUrl}
          className="size-14"
        />
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-medium tracking-tight sm:text-3xl">
              {t("HEADING", { username: props.username })}
            </h1>
            {props.verified && (
              <Badge
                variant={props.marker === "filled" ? "default" : "outline"}
                className={
                  props.marker === "filled"
                    ? undefined
                    : "text-primary border-primary/40"
                }
              >
                <Icon name="shield-check" />
                {t("VERIFIED")}
              </Badge>
            )}
            {props.source && (
              <PublicBadge
                platform={props.source.platform}
                claimed={props.claimedBy !== null}
              />
            )}
            {props.claimedBy && (
              <Link
                href={{
                  pathname: "/u/[username]",
                  params: { username: props.claimedBy.username },
                }}
                className="text-muted-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
              >
                <Icon name="user-check" className="size-3.5" />
                {t("CLAIMED_BY", { username: props.claimedBy.username })}
              </Link>
            )}
          </div>
          <p className="text-foreground/60 mt-1 text-sm">
            {props.source ? t("SUBHEADING_PUBLIC") : t("SUBHEADING")}
          </p>
          {props.claimed.length > 0 && (
            <p className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
              <span>{t("CLAIMED_PROFILES")}</span>
              {props.claimed.map((profile) => (
                <Link
                  key={profile.username}
                  href={{
                    pathname: "/u/[username]",
                    params: { username: profile.username },
                  }}
                  className="text-foreground/80 inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  <SourceIcon platform={profile.platform} className="size-3" />@
                  {profile.username}
                </Link>
              ))}
            </p>
          )}
        </div>
        {props.own && (
          <Button
            className="sm:ml-auto"
            nativeButton={false}
            render={<Link href="/picks/new" />}
          >
            <Icon name="plus" />
            {t("LOG_PICK")}
          </Button>
        )}
      </div>
    </header>
  );
}
