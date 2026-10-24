import { FONT_OPTIONS, type FontKind } from "@/lib/theme/fonts";
import {
  accentVars,
  chartShades,
  generatePalette,
  normHex,
} from "@/lib/theme/palette";
import {
  CUSTOM,
  SHADOWS,
  findAccent,
  findPalette,
  findStyle,
  type StylePreset,
} from "@/lib/theme/presets";
import type { TokenValues, UserTheme } from "@/lib/theme/theme-types";
import { TOKEN_BY_ID, type ThemeMode, type TokenDef } from "@/lib/theme/tokens";

// A theme arrives from the cookie with no validation and is compiled into a
// server-rendered <style>, so the stored name must never reach the CSS as
// typed. Anchored allowlist, and the emitted string is rebuilt from the match.
const FAMILY_RE = /^[A-Za-z0-9]+(?: [A-Za-z0-9]+)*$/;
const FAMILY_MAX = 50;

export function normFontFamily(v: string | undefined): string | null {
  const name = (v ?? "").trim().replace(/[+_]/g, " ").replace(/\s+/g, " ");
  if (!name || name.length > FAMILY_MAX || !FAMILY_RE.test(name)) return null;
  return name;
}

export function customFontName(
  value: string | number | undefined,
): string | null {
  const s = String(value ?? "");
  if (!s.startsWith(`${CUSTOM}:`)) return null;
  return normFontFamily(s.slice(CUSTOM.length + 1));
}

const FONT_IDS = ["font-sans", "font-display", "font-mono"];

// We build the URL, so only fonts.googleapis.com is ever reachable. The weight
// list is the point: a family loaded at 400 alone leaves every bold synthetic.
export function googleFontHref(theme: UserTheme): string | null {
  const names: string[] = [];
  const all = theme.global.all ?? {};
  for (const id of FONT_IDS) {
    const name = customFontName(all[id]);
    if (name && !names.includes(name)) names.push(name);
  }
  if (names.length === 0) return null;
  const query = names
    .map(
      (n) =>
        `family=${encodeURIComponent(n)}:ital,wght@0,400;0,500;0,600;0,700;1,400;1,700`,
    )
    .join("&");
  return `https://fonts.googleapis.com/css2?${query}&display=swap`;
}

function fontFamilyFor(
  value: string | number | undefined,
  kind: FontKind,
): string | null {
  if (value === undefined) return null;
  const fallback =
    kind === "mono" ? "ui-monospace, monospace" : "ui-sans-serif, system-ui";
  const custom = customFontName(value);
  if (custom) return `"${custom}", ${fallback}`;
  const opt = FONT_OPTIONS.find(
    (f) => f.id === value && f.kinds.includes(kind),
  );
  return opt ? `var(${opt.varName}), ${fallback}` : null;
}

export function fontKindOf(id: string): FontKind {
  if (id === "font-mono") return "mono";
  if (id === "font-display") return "display";
  return "sans";
}

// Values come from the cookie and land in a server-rendered <style>: keys must
// be token names and values may not leave the declaration or pull a resource.
const SAFE_KEY_RE = /^[a-z0-9-]+$/;
const UNSAFE_VALUE_RE = /[<>{};\\@]|url\(|expression\(/i;

function emitBlock(selector: string, vars: TokenValues): string {
  const entries = Object.entries(vars)
    .filter(([, v]) => v !== "" && v !== undefined)
    .filter(([k, v]) => SAFE_KEY_RE.test(k) && !UNSAFE_VALUE_RE.test(String(v)))
    .map(([k, v]) => `--${k}: ${v};`)
    .join("");
  return entries ? `${selector}{${entries}}` : "";
}

function styleVars(style: StylePreset): TokenValues {
  return {
    radius: style.radius,
    spacing: style.spacing,
    shadow: style.shadow,
    tracking: style.tracking,
  };
}

function hexOf(values: TokenValues | undefined, id: string): string | null {
  return normHex(values?.[id]);
}

// Presets and custom inputs share one path: a base colour becomes the surface
// set, an accent becomes the control set, a chart colour becomes the shades.
function generatorVars(
  presets: UserTheme["presets"],
  explicit: TokenValues,
  mode: ThemeMode,
): TokenValues {
  const light = mode === "light";
  const out: TokenValues = {};
  const palette = findPalette(presets.palette);
  const paletteBase = hexOf(explicit, "palette-base") ?? palette?.base[mode];
  if (paletteBase) Object.assign(out, generatePalette(paletteBase));
  if (palette?.overrides && !hexOf(explicit, "palette-base"))
    Object.assign(out, palette.overrides[mode]);

  const accent = findAccent(presets.accent);
  const accentHex =
    hexOf(explicit, "accent-base") ??
    accent?.hex[mode] ??
    palette?.accent?.[mode];
  if (accentHex) Object.assign(out, accentVars(accentHex));

  const chart = findAccent(presets.chart);
  const chartHex =
    hexOf(explicit, "chart-base") ?? chart?.hex[mode] ?? accentHex;
  if (chartHex) Object.assign(out, chartShades(chartHex, light));
  return out;
}

function tokenCss(def: TokenDef, value: string | number): string {
  if (
    def.kind === "number" &&
    def.unit &&
    def.unit !== "x" &&
    def.unit !== "%"
  ) {
    return `${value}${def.unit}`;
  }
  return String(value);
}

function isShadow(value: string): value is keyof typeof SHADOWS {
  return value in SHADOWS;
}

export function resolveVars(theme: UserTheme, mode: ThemeMode): TokenValues {
  const explicit: TokenValues = {
    ...(theme.global.all ?? {}),
    ...(theme.global[mode] ?? {}),
  };
  const out: TokenValues = {};
  const style = findStyle(theme.presets.style);
  if (style) Object.assign(out, styleVars(style));
  Object.assign(out, generatorVars(theme.presets, explicit, mode));
  Object.assign(out, explicit);

  const vars: TokenValues = {};
  for (const [id, raw] of Object.entries(out)) {
    const def = TOKEN_BY_ID.get(id);
    if (!def) continue;
    if (def.id === "shadow") {
      const shadow = String(raw);
      if (isShadow(shadow)) {
        for (const size of ["xs", "sm", "md", "lg"])
          vars[`theme-shadow-${size}`] = SHADOWS[shadow];
      }
      continue;
    }
    if (def.kind === "font") {
      const family = fontFamilyFor(raw, fontKindOf(def.id));
      if (family && def.cssVar) vars[def.cssVar.slice(2)] = family;
      continue;
    }
    if (!def.cssVar || def.group === "generator") continue;
    vars[def.cssVar.slice(2)] = tokenCss(def, raw);
  }
  return vars;
}

export function buildThemeCss(theme: UserTheme): string {
  const blocks: string[] = [];
  for (const mode of ["light", "dark"] as const) {
    const vars = resolveVars(theme, mode);
    // Mode-less tokens already sit in the light block, which .dark inherits.
    if (mode === "dark") {
      for (const key of Object.keys(vars)) {
        if (!TOKEN_BY_ID.get(key)?.perMode) delete vars[key];
      }
    }
    const fonts: TokenValues = {};
    for (const id of FONT_IDS) {
      if (vars[id] === undefined) continue;
      fonts[id] = `${vars[id]} !important`;
      delete vars[id];
    }
    blocks.push(emitBlock(mode === "light" ? ":root" : ".dark", vars));
    // globals.css sets the font defaults on <body>, so the override lands there.
    if (mode === "light") blocks.push(emitBlock("body", fonts));
  }
  return blocks.filter(Boolean).join("\n");
}
