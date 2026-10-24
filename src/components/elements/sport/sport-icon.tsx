import { HockeyIcon } from "@/components/ui/local-icons";
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
import { msg } from "@/lib/config/constants";
import { sportGroup, type SportGroup } from "@/lib/config/sports";
import { BoxingGlove } from "@phosphor-icons/react/dist/ssr/BoxingGlove";
import {
  IconBallAmericanFootball,
  IconBallBaseball,
  IconBallBasketball,
  IconBallFootball,
  IconBallTennis,
  IconCricket,
  IconGolf,
  IconRugby,
  IconTrophy,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";

type SportIconComponent = ComponentType<{
  className?: string;
  size?: number | string;
  "aria-hidden"?: boolean;
}>;

const SPORT_ICONS = {
  americanfootball: IconBallAmericanFootball,
  basketball: IconBallBasketball,
  baseball: IconBallBaseball,
  icehockey: HockeyIcon,
  soccer: IconBallFootball,
  tennis: IconBallTennis,
  golf: IconGolf,
  mma: BoxingGlove,
  boxing: BoxingGlove,
  cricket: IconCricket,
  aussierules: IconRugby,
  rugby: IconRugby,
} satisfies Record<SportGroup, SportIconComponent>;

const SPORT_GLYPHS = {
  americanfootball: FootballGlyph,
  basketball: BasketballGlyph,
  baseball: BaseballGlyph,
  icehockey: HockeyGlyph,
  soccer: SoccerGlyph,
  tennis: TennisGlyph,
  golf: GolfGlyph,
  mma: GloveGlyph,
  boxing: GloveGlyph,
  cricket: CricketGlyph,
  aussierules: RugbyGlyph,
  rugby: RugbyGlyph,
} satisfies Record<SportGroup, ComponentType<{ className?: string }>>;

const SPORT_LABELS = {
  americanfootball: msg("SPORTS.AMERICANFOOTBALL"),
  basketball: msg("SPORTS.BASKETBALL"),
  baseball: msg("SPORTS.BASEBALL"),
  icehockey: msg("SPORTS.ICEHOCKEY"),
  soccer: msg("SPORTS.SOCCER"),
  tennis: msg("SPORTS.TENNIS"),
  golf: msg("SPORTS.GOLF"),
  mma: msg("SPORTS.MMA"),
  boxing: msg("SPORTS.BOXING"),
  cricket: msg("SPORTS.CRICKET"),
  aussierules: msg("SPORTS.AUSSIERULES"),
  rugby: msg("SPORTS.RUGBY"),
} satisfies Record<SportGroup, string>;

export function sportLabelKey(sportKey: string) {
  const group = sportGroup(sportKey);
  return group ? SPORT_LABELS[group] : msg("SPORTS.OTHER");
}

export function SportIcon(props: {
  sportKey: string;
  className?: string;
  variant?: "color" | "mono";
}) {
  const group = sportGroup(props.sportKey);
  if (props.variant !== "mono") {
    const Colored = group ? SPORT_GLYPHS[group] : TrophyGlyph;
    return <Colored className={cn("shrink-0", props.className ?? "size-4")} />;
  }
  const Glyph: SportIconComponent = group ? SPORT_ICONS[group] : IconTrophy;
  return <Glyph aria-hidden className={props.className ?? "size-4"} />;
}
