"use client";

import { ParticipantAvatar } from "@/components/elements/participant/participant-avatar";
import { isFighterGroup, sportGroup } from "@/lib/config/sports";
import type { ApiEvent } from "@/lib/types";
import { useTranslations } from "next-intl";

type MatchupEvent = Omit<ApiEvent, "id" | "commenceTime"> & {
  sportKey: string;
};

export function Matchup(props: { event: MatchupEvent }) {
  const t = useTranslations("PARTICIPANT");
  const fighters = isFighterGroup(sportGroup(props.event.sportKey));

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
      <Side
        name={props.event.away}
        imageUrl={props.event.awayImage}
        country={props.event.awayCountry}
        photo={fighters}
      />
      <span className="text-muted-foreground text-xs font-normal">
        {fighters ? t("VS") : t("AT")}
      </span>
      <Side
        name={props.event.home}
        imageUrl={props.event.homeImage}
        country={props.event.homeCountry}
        photo={fighters}
      />
    </div>
  );
}

function Side(props: {
  name: string;
  imageUrl?: string | null;
  country?: string | null;
  photo: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <ParticipantAvatar
        name={props.name}
        imageUrl={props.imageUrl}
        country={props.country}
        photo={props.photo}
      />
      {props.name}
    </span>
  );
}
