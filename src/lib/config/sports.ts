export const SPORT_GROUPS = [
  "americanfootball",
  "basketball",
  "baseball",
  "icehockey",
  "soccer",
  "tennis",
  "golf",
  "mma",
  "boxing",
  "cricket",
  "aussierules",
  "rugby",
] as const;
export type SportGroup = (typeof SPORT_GROUPS)[number];

function isSportGroup(value: string): value is SportGroup {
  return SPORT_GROUPS.some((group) => group === value);
}

// Odds API keys are `<group>_<league>`; rugby splits into rugbyleague and rugbyunion.
export function sportGroup(sportKey: string): SportGroup | null {
  const prefix = sportKey.split("_")[0];
  if (prefix.startsWith("rugby")) return "rugby";
  return isSportGroup(prefix) ? prefix : null;
}

export function isFighterGroup(group: SportGroup | null): boolean {
  return group === "mma" || group === "boxing";
}

// Sports offered on the web pick form, beachhead first.
export const PICK_SPORT_KEYS = [
  "mma_mixed_martial_arts",
  "americanfootball_nfl",
  "basketball_nba",
  "baseball_mlb",
  "icehockey_nhl",
  "soccer_epl",
] as const;

// League chips on the web pick form: the bot sports plus every league already mapped for importers.
// A null label falls back to the translated sport name.
export const PICK_LEAGUES = [
  { sportKey: "americanfootball_nfl", label: "NFL" },
  { sportKey: "americanfootball_ncaaf", label: "NCAAF" },
  { sportKey: "basketball_nba", label: "NBA" },
  { sportKey: "basketball_ncaab", label: "NCAAB" },
  { sportKey: "basketball_wnba", label: "WNBA" },
  { sportKey: "basketball_euroleague", label: "EuroLeague" },
  { sportKey: "icehockey_nhl", label: "NHL" },
  { sportKey: "baseball_mlb", label: "MLB" },
  { sportKey: "baseball_kbo", label: "KBO" },
  { sportKey: "baseball_npb", label: "NPB" },
  { sportKey: "mma_mixed_martial_arts", label: "UFC" },
  { sportKey: "boxing_boxing", label: null },
  { sportKey: "soccer_epl", label: "EPL" },
  { sportKey: "soccer_uefa_champs_league", label: "UCL" },
  { sportKey: "soccer_uefa_europa_league", label: "UEL" },
  { sportKey: "soccer_spain_la_liga", label: "La Liga" },
  { sportKey: "soccer_germany_bundesliga", label: "Bundesliga" },
  { sportKey: "soccer_italy_serie_a", label: "Serie A" },
  { sportKey: "soccer_france_ligue_one", label: "Ligue 1" },
  { sportKey: "soccer_efl_champ", label: "Championship" },
  { sportKey: "soccer_netherlands_eredivisie", label: "Eredivisie" },
  { sportKey: "soccer_portugal_primeira_liga", label: "Primeira Liga" },
  { sportKey: "soccer_usa_mls", label: "MLS" },
  { sportKey: "soccer_mexico_ligamx", label: "Liga MX" },
] as const satisfies readonly { sportKey: string; label: string | null }[];

export type PickLeagueKey = (typeof PICK_LEAGUES)[number]["sportKey"];

export const PICK_LEAGUE_KEYS = PICK_LEAGUES.map((league) => league.sportKey);

export function isPickLeague(value: string): value is PickLeagueKey {
  return PICK_LEAGUE_KEYS.some((key) => key === value);
}
