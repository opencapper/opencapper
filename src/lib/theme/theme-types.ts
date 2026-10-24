import { USER_THEME_COOKIE } from "@/lib/config/constants";
import type { ThemeMode, TokenDef } from "@/lib/theme/tokens";

export type TokenValues = Record<string, string | number>;
export type ModeValues = {
  all?: TokenValues;
  light?: TokenValues;
  dark?: TokenValues;
};
export type ThemePresets = {
  palette?: string;
  accent?: string;
  chart?: string;
  style?: string;
};

// Layers, lowest first: globals.css, presets, global tokens.
export type UserTheme = {
  v: 2;
  presets: ThemePresets;
  global: ModeValues;
};

export const USER_THEME_KEY = USER_THEME_COOKIE;

export const INITIAL_USER_THEME: UserTheme = {
  v: 2,
  presets: {
    palette: "cinematic",
    accent: "default",
    chart: "default",
    style: "cinematic",
  },
  global: {},
};

type Slot = "all" | "light" | "dark";

function slot(def: TokenDef, mode: ThemeMode): Slot {
  return def.perMode ? mode : "all";
}

export function readToken(
  theme: UserTheme,
  mode: ThemeMode,
  def: TokenDef,
): string | number | undefined {
  return theme.global[slot(def, mode)]?.[def.id];
}

export function writeToken(
  theme: UserTheme,
  mode: ThemeMode,
  def: TokenDef,
  value: string | number | undefined,
): UserTheme {
  const values = theme.global;
  const key = slot(def, mode);
  const next: TokenValues = { ...(values[key] ?? {}) };
  if (value === undefined) delete next[def.id];
  else next[def.id] = value;
  const nextValues: ModeValues = { ...values, [key]: next };
  if (Object.keys(next).length === 0) delete nextValues[key];
  return { ...theme, global: nextValues };
}
