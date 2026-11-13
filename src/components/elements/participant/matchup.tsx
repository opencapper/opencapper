"use client";

import { ParticipantAvatar, type ParticipantSize } from "@/components/elements/participant/participant-avatar";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

// Images arrive with the API's participant fields; older payloads omit them and the avatars show initials.
export type MatchupEvent = {
  home: string;
  away: string;
  home_image?: string | null;
  away_image?: string | null;
};

// Table rows get one plain line: badges there cost a request each and add nothing to the price.
export function Matchup(props: { event: MatchupEvent; size?: ParticipantSize; className?: string }) {
  const t = useTranslations("FORMAT");
  if (!props.size || props.size === "xs") {
    return (
      <span className={cn("block truncate", props.className)}>
        {t("MATCHUP", { home: props.event.home, away: props.event.away })}
      </span>
    );
  }
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-x-2 gap-y-1", props.className)}>
      <Side name={props.event.home} imageUrl={props.event.home_image} size={props.size} />
      <span className="text-muted-foreground text-xs font-normal">{t("VS")}</span>
      <Side name={props.event.away} imageUrl={props.event.away_image} size={props.size} />
    </span>
  );
}

function Side(props: { name: string; imageUrl?: string | null; size?: ParticipantSize }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1.5">
      <ParticipantAvatar name={props.name} imageUrl={props.imageUrl} size={props.size} />
      <span className="min-w-0 truncate">{props.name}</span>
    </span>
  );
}
