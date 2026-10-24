import {
  INITIAL_USER_THEME,
  type ModeValues,
  type TokenValues,
  type UserTheme,
} from "@/lib/theme/theme-types";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v ? v : undefined;
}

function tokenValues(v: unknown): TokenValues | undefined {
  if (!isRecord(v)) return undefined;
  const out: TokenValues = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string" || typeof val === "number") out[k] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

function modeValues(v: unknown): ModeValues {
  if (!isRecord(v)) return {};
  const out: ModeValues = {};
  const all = tokenValues(v.all);
  const light = tokenValues(v.light);
  const dark = tokenValues(v.dark);
  if (all) out.all = all;
  if (light) out.light = light;
  if (dark) out.dark = dark;
  return out;
}

// Every read goes through here: a cookie written by an older shape, or edited
// by hand, still renders instead of breaking the layout.
export function migrateTheme(raw: unknown): UserTheme {
  if (!isRecord(raw) || raw.v !== 2) return INITIAL_USER_THEME;
  const presets = isRecord(raw.presets) ? raw.presets : {};
  const initial = INITIAL_USER_THEME.presets;
  return {
    v: 2,
    presets: {
      palette: str(presets.palette) ?? initial.palette,
      accent: str(presets.accent) ?? initial.accent,
      chart: str(presets.chart) ?? initial.chart,
      style: str(presets.style) ?? initial.style,
    },
    global: modeValues(raw.global),
  };
}
