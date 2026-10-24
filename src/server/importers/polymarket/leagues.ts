// Polymarket league code (event slug prefix, gamma /sports `sport`) to Odds API sport key.
// `oddsApi: false` keeps the key only for grouping and icons; those picks are always priced by the fill.
// `ordering` is gamma /sports `ordering`: which side the event title lists first.
export type PolymarketLeague = {
  sportKey: string;
  oddsApi: boolean;
  ordering: "home" | "away";
};

export const POLYMARKET_LEAGUES: Record<string, PolymarketLeague> = {
  nfl: { sportKey: "americanfootball_nfl", oddsApi: true, ordering: "away" },
  cfb: { sportKey: "americanfootball_ncaaf", oddsApi: true, ordering: "away" },
  nba: { sportKey: "basketball_nba", oddsApi: true, ordering: "away" },
  wnba: { sportKey: "basketball_wnba", oddsApi: true, ordering: "away" },
  cbb: { sportKey: "basketball_ncaab", oddsApi: true, ordering: "away" },
  euroleague: {
    sportKey: "basketball_euroleague",
    oddsApi: true,
    ordering: "home",
  },
  mlb: { sportKey: "baseball_mlb", oddsApi: true, ordering: "away" },
  kbo: { sportKey: "baseball_kbo", oddsApi: true, ordering: "away" },
  npb: { sportKey: "baseball_npb", oddsApi: true, ordering: "home" },
  nhl: { sportKey: "icehockey_nhl", oddsApi: true, ordering: "away" },
  ufc: { sportKey: "mma_mixed_martial_arts", oddsApi: true, ordering: "home" },
  boxing: { sportKey: "boxing_boxing", oddsApi: true, ordering: "home" },
  epl: { sportKey: "soccer_epl", oddsApi: true, ordering: "home" },
  elc: { sportKey: "soccer_efl_champ", oddsApi: true, ordering: "home" },
  ucl: {
    sportKey: "soccer_uefa_champs_league",
    oddsApi: true,
    ordering: "home",
  },
  uel: {
    sportKey: "soccer_uefa_europa_league",
    oddsApi: true,
    ordering: "home",
  },
  lal: { sportKey: "soccer_spain_la_liga", oddsApi: true, ordering: "home" },
  bun: {
    sportKey: "soccer_germany_bundesliga",
    oddsApi: true,
    ordering: "home",
  },
  sea: { sportKey: "soccer_italy_serie_a", oddsApi: true, ordering: "home" },
  fl1: { sportKey: "soccer_france_ligue_one", oddsApi: true, ordering: "home" },
  ere: {
    sportKey: "soccer_netherlands_eredivisie",
    oddsApi: true,
    ordering: "home",
  },
  por: {
    sportKey: "soccer_portugal_primeira_liga",
    oddsApi: true,
    ordering: "home",
  },
  tur: {
    sportKey: "soccer_turkey_super_league",
    oddsApi: true,
    ordering: "home",
  },
  mls: { sportKey: "soccer_usa_mls", oddsApi: true, ordering: "home" },
  mex: { sportKey: "soccer_mexico_ligamx", oddsApi: true, ordering: "home" },
  bra: {
    sportKey: "soccer_brazil_campeonato",
    oddsApi: true,
    ordering: "home",
  },
  arg: {
    sportKey: "soccer_argentina_primera_division",
    oddsApi: true,
    ordering: "home",
  },
  spl: {
    sportKey: "soccer_saudi_arabia_pro_league",
    oddsApi: true,
    ordering: "home",
  },
  // Odds API keys tennis per tournament, so tour level markets cannot be matched to one key.
  atp: { sportKey: "tennis_atp", oddsApi: false, ordering: "home" },
  wta: { sportKey: "tennis_wta", oddsApi: false, ordering: "home" },
};
