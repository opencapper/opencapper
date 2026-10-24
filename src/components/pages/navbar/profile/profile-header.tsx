import { SectionLabel } from "@/components/elements/page/page-heading";
import { PublicBadge } from "@/components/elements/source/source-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { ProofMarkerStyle } from "@/lib/config/ranking";
import type { ApiProfileSource } from "@/lib/types";
import { useTranslations } from "next-intl";

export function ProfileHeader(props: {
  username: string;
  verified: boolean;
  source: ApiProfileSource | null;
  marker: ProofMarkerStyle;
  own: boolean;
}) {
  const t = useTranslations("PROFILE");

  return (
    <header>
      <SectionLabel as="p">{t("LABEL")}</SectionLabel>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar className="size-14">
          <AvatarFallback className="bg-foreground/5 text-foreground/80 font-display text-xl font-medium">
            {props.username.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
            {props.source && <PublicBadge platform={props.source.platform} />}
          </div>
          <p className="text-foreground/60 mt-1 text-sm">
            {props.source ? t("SUBHEADING_PUBLIC") : t("SUBHEADING")}
          </p>
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
