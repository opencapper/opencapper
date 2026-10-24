import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { Link } from "@/i18n/navigation";
import { sportGroup } from "@/lib/config/sports";
import { getTranslations } from "next-intl/server";

// Beachhead order: MMA first, then traffic leagues.
const SPORT_KEYS = [
  "mma_mixed_martial_arts",
  "americanfootball_nfl",
  "basketball_nba",
  "baseball_mlb",
  "icehockey_nhl",
  "soccer_epl",
  "tennis_atp",
  "golf_pga",
  "boxing_boxing",
  "cricket_test_match",
  "rugbyunion_six_nations",
];

const EDGE_MASK =
  "linear-gradient(to right, transparent, black 12%, black 88%, transparent)";

export async function SportsMarquee() {
  const t = await getTranslations();
  const row = SPORT_KEYS.map((sportKey) => ({
    sportKey,
    group: sportGroup(sportKey) ?? undefined,
    label: t(sportLabelKey(sportKey)),
  }));

  return (
    <div className="mb-10">
      <div className="my-4 flex items-center gap-3">
        <div className="border-border flex-1 border-t" />
        <span className="label-mono text-foreground/50 shrink-0">
          {t("LANDING.SPORTS_LABEL")}
        </span>
      </div>
      <div
        className="overflow-hidden"
        style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
      >
        <ul className="animate-marquee flex w-max hover:[animation-play-state:paused]">
          {[0, 1].map((copy) =>
            row.map((sport) => (
              <li key={`${copy}-${sport.sportKey}`} aria-hidden={copy === 1}>
                <Link
                  href={{
                    pathname: "/leaderboard",
                    query: { sport: sport.group },
                  }}
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="text-foreground/55 hover:text-foreground/85 flex items-center gap-2 px-6 py-2 text-sm whitespace-nowrap transition-colors"
                >
                  <SportIcon sportKey={sport.sportKey} className="size-4" />
                  {sport.label}
                </Link>
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}
