import {
  BaseballGlyph,
  BasketballGlyph,
  CricketGlyph,
  FootballGlyph,
  GloveGlyph,
  GolfGlyph,
  HockeyGlyph,
  RugbyGlyph,
  SoccerGlyph,
  TennisGlyph,
  TrophyGlyph,
} from "@/components/elements/sport/sport-glyphs";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type Glyph = ComponentType<{ className?: string }>;

// Keys are the API's `sport` values; "football" is association football.
const SPORT_GLYPHS: Record<string, Glyph> = {
  football: SoccerGlyph,
  soccer: SoccerGlyph,
  american_football: FootballGlyph,
  basketball: BasketballGlyph,
  baseball: BaseballGlyph,
  ice_hockey: HockeyGlyph,
  tennis: TennisGlyph,
  golf: GolfGlyph,
  mma: GloveGlyph,
  boxing: GloveGlyph,
  cricket: CricketGlyph,
  rugby: RugbyGlyph,
  rugby_union: RugbyGlyph,
  rugby_league: RugbyGlyph,
  aussie_rules: RugbyGlyph,
};

export function SportIcon(props: { sport: string; className?: string }) {
  const Colored = Object.hasOwn(SPORT_GLYPHS, props.sport) ? SPORT_GLYPHS[props.sport] : TrophyGlyph;
  return <Colored className={cn("shrink-0", props.className ?? "size-4")} />;
}
