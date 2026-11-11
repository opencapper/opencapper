import { CountryFlag } from "@/components/elements/flag/country-flag";
import { SportIcon } from "@/components/elements/sport/sport-icon";
import { cn } from "@/lib/utils";

export type LeagueEvent = {
  league: string;
  sport?: string;
  league_country?: string | null;
};

export function LeagueLabel(props: { event: LeagueEvent; className?: string }) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", props.className)}>
      {props.event.sport && <SportIcon sport={props.event.sport} className="size-3.5" />}
      {props.event.league_country && <CountryFlag country={props.event.league_country} />}
      <span className="min-w-0 truncate">{props.event.league}</span>
    </span>
  );
}
