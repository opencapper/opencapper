import type { PickMarket } from "@/lib/api/typebox/picks";
import { PICK_SPORT_KEYS } from "@/lib/config/sports";

export type ParsedPotd = {
  market: PickMarket;
  side: string;
  point: number | null;
  // Totals name the matchup in the pick line, sides only one team.
  teams: string[];
  units: number;
  sportKeys: string[];
};

const SPORT_HINTS: [RegExp, string][] = [
  [/\bwnba\b/i, "basketball_wnba"],
  [/\bnba\b/i, "basketball_nba"],
  [/\b(ncaab|cbb|college basketball)\b/i, "basketball_ncaab"],
  [/\bnfl\b/i, "americanfootball_nfl"],
  [/\b(ncaaf|cfb|college football)\b/i, "americanfootball_ncaaf"],
  [/\bmlb\b/i, "baseball_mlb"],
  [/\bnhl\b/i, "icehockey_nhl"],
  [/\b(ufc|mma)\b/i, "mma_mixed_martial_arts"],
  [/\b(epl|premier league)\b/i, "soccer_epl"],
  [/\b(la ?liga)\b/i, "soccer_spain_la_liga"],
  [/\bserie a\b/i, "soccer_italy_serie_a"],
  [/\bbundesliga\b/i, "soccer_germany_bundesliga"],
  [/\bligue 1\b/i, "soccer_france_ligue_one"],
  [/\b(ucl|champions league)\b/i, "soccer_uefa_champs_league"],
  [/\b(uel|europa league)\b/i, "soccer_uefa_europa_league"],
  [/\bmls\b/i, "soccer_usa_mls"],
];

// Props, parlays and partial game markets cannot be graded from a final score.
const UNSUPPORTED =
  /parlay|teaser|\bsgp\b|\bbtts\b|both teams|double chance|draw no bet|\b(1h|2h|1st|2nd|first|second) half\b|\bq[1-4]\b|quarter|period|inning|\bf5\b|props?\b|rebounds|assists|strikeouts|\bkills\b|\bmaps?\b|\bsets?\b|\bgames\b|corners|cards|shots|double double|anytime|scorer|\bto score\b|\band\b|&|\s\/\s|\+\s*[a-z]/i;

const IGNORED_LINE = /\b(last|previous|prev|yesterday'?s?)\b/i;

function plain(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/[*_#`~\\]/g, "")
    .replace(/[^\S\n]+/g, " ");
}

function pickLine(body: string): string | null {
  for (const line of body.split("\n")) {
    if (IGNORED_LINE.test(line)) continue;
    const match = line.match(
      /\b(?:pick|potd|play|bet)\s*(?:of the day)?\s*:\s*(.+)$/i,
    );
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return null;
}

const UNITS = /(\d+(?:\.\d+)?)\s*(?:u|units?)\b/i;

// Record lines ("Net units +15.45u") also carry units, so only the pick line and stake lines count.
function unitsOf(body: string, line: string): number {
  const stake = body
    .split("\n")
    .find(
      (l) =>
        /\b(stake|wager|bet size|risk|units?)\s*:/i.test(l) &&
        !/\b(net|record|won|profit|roi|total)\b/i.test(l),
    );
  const match = line.match(UNITS) ?? stake?.match(UNITS);
  const value = match ? Number(match[1]) : 1;
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function cleanSide(raw: string): string {
  const side = raw.includes(" vs") ? (raw.split(/-\s*/).at(-1) ?? raw) : raw;
  return side.replace(/^[^\p{L}\p{N}]+/u, "").trim();
}

function stripPrice(text: string): string {
  return text
    .replace(/\([^)]*\)/g, " ")
    .replace(/@\s*[+-]?\d+(?:\.\d+)?/g, " ")
    .replace(/\s[+-]\d{3,}\b/g, " ")
    .replace(/\b\d+(?:\.\d+)?\s*(?:u|units?)\b.*$/i, " ")
    .replace(/\bto win \d.*$/i, " ")
    .replace(/[;,|].*$/, " ")
    .replace(/^\s*[a-z0-9 ]{2,12}\s*[:-]\s+/i, (prefix) =>
      SPORT_HINTS.some(([re]) => re.test(prefix)) ? " " : prefix,
    )
    .replace(/\s+/g, " ")
    .trim();
}

function matchup(text: string): string[] {
  const parts = text.split(/\s+(?:vs\.?|v\.?|@|at)\s+/i);
  return parts.length === 2
    ? parts.map((p) => p.replace(/\s*-\s*$/, "").trim())
    : [];
}

export function parsePotd(raw: string): ParsedPotd | string {
  const body = plain(raw);
  const line = pickLine(body);
  if (!line) return "no pick line";
  if (UNSUPPORTED.test(line)) return "unsupported market";
  const text = stripPrice(line);
  const hinted = SPORT_HINTS.filter(([re]) => re.test(body)).map(
    ([, key]) => key,
  );
  const sportKeys = hinted.length > 0 ? hinted : [...PICK_SPORT_KEYS];
  const units = unitsOf(body, line);

  const total = text.match(/^(.*?)\s*\b(over|under|o|u)\s?(\d+(?:\.\d+)?)\b/i);
  if (total) {
    const teams = matchup(total[1].replace(/\s*-\s*$/, ""));
    if (teams.length !== 2) return "total without both teams";
    const side = total[2].toLowerCase().startsWith("o") ? "Over" : "Under";
    return {
      market: "totals",
      side,
      point: Number(total[3]),
      teams,
      units,
      sportKeys,
    };
  }

  const ml = text.match(/^(.+?)\s+(?:ml|moneyline|to win)\b/i);
  if (ml) {
    const side = cleanSide(ml[1]);
    return {
      market: "h2h",
      side,
      point: null,
      teams: [side],
      units,
      sportKeys,
    };
  }

  const spread = text.match(/^(.+?)\s+([+-]\d{1,2}(?:\.\d)?)(?:\s|$)/);
  if (spread && Math.abs(Number(spread[2])) < 60) {
    const side = cleanSide(spread[1]);
    return {
      market: "spreads",
      side,
      point: Number(spread[2]),
      teams: [side],
      units,
      sportKeys,
    };
  }
  return "no moneyline, spread or total";
}
