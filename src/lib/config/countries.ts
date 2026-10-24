import { FLAG_LOADERS } from "@/lib/config/flag-loaders";

// TheSportsDB names that differ from the English Intl.DisplayNames spelling.
const ALIASES: Record<string, string> = {
  usa: "US",
  "united states of america": "US",
  america: "US",
  england: "GB-ENG",
  scotland: "GB-SCT",
  wales: "GB-WLS",
  "northern ireland": "GB-NIR",
  "great britain": "GB",
  uk: "GB",
  "republic of ireland": "IE",
  "czech republic": "CZ",
  russia: "RU",
  korea: "KR",
  "south korea": "KR",
  "north korea": "KP",
  "ivory coast": "CI",
  holland: "NL",
  "dr congo": "CD",
  "democratic republic of the congo": "CD",
  "republic of the congo": "CG",
  bosnia: "BA",
  "bosnia and herzegovina": "BA",
  "cape verde": "CV",
  macedonia: "MK",
  turkey: "TR",
  swaziland: "SZ",
  "east timor": "TL",
  burma: "MM",
};

function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replaceAll("&", "and")
    .trim();
}

let byName: Map<string, string> | null = null;

function nameIndex(): Map<string, string> {
  if (byName) return byName;
  const index = new Map<string, string>();
  const display = new Intl.DisplayNames(["en"], { type: "region" });
  for (const code of Object.keys(FLAG_LOADERS)) {
    if (code.length !== 2) continue;
    try {
      const name = display.of(code);
      if (name && name !== code) index.set(normalise(name), code);
    } catch {
      // Some flag codes (XO) are not regions Intl can name.
    }
  }
  byName = index;
  return index;
}

export function countryCode(country: string): string | null {
  const key = normalise(country);
  return ALIASES[key] ?? nameIndex().get(key) ?? null;
}
