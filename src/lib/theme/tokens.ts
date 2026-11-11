import type { PlainTranslationKey } from "@/lib/types";

// A key the typed translator accepts, so a typo in a registry fails tsc.
export type MessageKey = PlainTranslationKey;

export type ThemeMode = "light" | "dark";

export type TokenKind = "color" | "number" | "font" | "select";
export type TokenGroup =
  | "generator"
  | "surface"
  | "text"
  | "control"
  | "status"
  | "pick"
  | "chart"
  | "sidebar"
  | "typography"
  | "shape";

export type TokenDef = {
  id: string;
  cssVar?: string;
  kind: TokenKind;
  group: TokenGroup;
  // Colours carry a light and a dark value; everything else one value.
  perMode: boolean;
  labelKey: MessageKey;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  // What the app renders when the token is unset, shown greyed in the editor.
  defaultValue?: number;
  options?: readonly TokenOption[];
};

export type TokenOption = {
  value: string;
  labelKey?: MessageKey;
  label?: string;
};

function color(id: string, group: TokenGroup, labelKey: MessageKey): TokenDef {
  return {
    id,
    cssVar: `--${id}`,
    kind: "color",
    group,
    perMode: true,
    labelKey,
  };
}

function number(
  id: string,
  group: TokenGroup,
  labelKey: MessageKey,
  range: {
    min: number;
    max: number;
    step: number;
    unit?: string;
    defaultValue: number;
  },
): TokenDef {
  return {
    id,
    cssVar: `--${id}`,
    kind: "number",
    group,
    perMode: false,
    labelKey,
    ...range,
  };
}

function font(id: string, labelKey: MessageKey): TokenDef {
  return {
    id,
    cssVar: `--${id}`,
    kind: "font",
    group: "typography",
    perMode: false,
    labelKey,
  };
}

const SHADOW_OPTIONS = [
  { value: "none", labelKey: "THEME.PRESET.SHADOW_NONE" },
  { value: "soft", labelKey: "THEME.PRESET.SHADOW_SOFT" },
  { value: "medium", labelKey: "THEME.PRESET.SHADOW_MEDIUM" },
  { value: "strong", labelKey: "THEME.PRESET.SHADOW_STRONG" },
] as const;

export const TOKENS: readonly TokenDef[] = [
  // Inputs to the palette generator. Only shown when a preset is "custom".
  color("palette-base", "generator", "THEME.PRESET.PALETTE"),
  color("accent-base", "generator", "THEME.PRESET.ACCENT"),
  color("chart-base", "generator", "THEME.PRESET.CHART"),

  color("background", "surface", "THEME.TOKEN.BACKGROUND"),
  color("card", "surface", "THEME.TOKEN.CARD"),
  color("popover", "surface", "THEME.TOKEN.POPOVER"),
  color("sidebar", "surface", "THEME.TOKEN.SIDEBAR"),

  color("foreground", "text", "THEME.TOKEN.FOREGROUND"),
  color("card-foreground", "text", "THEME.TOKEN.CARD_FOREGROUND"),
  color("popover-foreground", "text", "THEME.TOKEN.POPOVER_FOREGROUND"),
  color("muted-foreground", "text", "THEME.TOKEN.MUTED_FOREGROUND"),
  color("sidebar-foreground", "text", "THEME.TOKEN.SIDEBAR_FOREGROUND"),

  color("primary", "control", "THEME.TOKEN.PRIMARY"),
  color("primary-foreground", "control", "THEME.TOKEN.PRIMARY_FOREGROUND"),
  color("secondary", "control", "THEME.TOKEN.SECONDARY"),
  color("secondary-foreground", "control", "THEME.TOKEN.SECONDARY_FOREGROUND"),
  color("accent", "control", "THEME.TOKEN.ACCENT"),
  color("accent-foreground", "control", "THEME.TOKEN.ACCENT_FOREGROUND"),
  color("muted", "control", "THEME.TOKEN.MUTED"),
  color("border", "control", "THEME.TOKEN.BORDER"),
  color("input", "control", "THEME.TOKEN.INPUT"),
  color("ring", "control", "THEME.TOKEN.RING"),

  color("destructive", "status", "THEME.TOKEN.DESTRUCTIVE"),
  color("success", "status", "THEME.TOKEN.SUCCESS"),
  color("warning", "status", "THEME.TOKEN.WARNING"),
  color("info", "status", "THEME.TOKEN.INFO"),

  color("pick-win", "pick", "THEME.TOKEN.PICK_WIN"),
  color("pick-loss", "pick", "THEME.TOKEN.PICK_LOSS"),
  color("pick-push", "pick", "THEME.TOKEN.PICK_PUSH"),
  color("pick-void", "pick", "THEME.TOKEN.PICK_VOID"),
  color("pick-pending", "pick", "THEME.TOKEN.PICK_PENDING"),

  color("chart-1", "chart", "THEME.TOKEN.CHART_1"),
  color("chart-2", "chart", "THEME.TOKEN.CHART_2"),
  color("chart-3", "chart", "THEME.TOKEN.CHART_3"),
  color("chart-4", "chart", "THEME.TOKEN.CHART_4"),
  color("chart-5", "chart", "THEME.TOKEN.CHART_5"),

  color("sidebar-primary", "sidebar", "THEME.TOKEN.SIDEBAR_PRIMARY"),
  color(
    "sidebar-primary-foreground",
    "sidebar",
    "THEME.TOKEN.SIDEBAR_PRIMARY_FOREGROUND",
  ),
  color("sidebar-accent", "sidebar", "THEME.TOKEN.SIDEBAR_ACCENT"),
  color(
    "sidebar-accent-foreground",
    "sidebar",
    "THEME.TOKEN.SIDEBAR_ACCENT_FOREGROUND",
  ),
  color("sidebar-border", "sidebar", "THEME.TOKEN.SIDEBAR_BORDER"),
  color("sidebar-ring", "sidebar", "THEME.TOKEN.SIDEBAR_RING"),

  font("font-sans", "THEME.BODY_FONT"),
  font("font-display", "THEME.HEADING_FONT"),
  font("font-mono", "THEME.MONO_FONT"),
  // Root font size: rem-based layout scales with it, so this is the whole app.
  number("font-scale", "typography", "THEME.TOKEN.FONT_SCALE", {
    min: 0.8,
    max: 1.3,
    step: 0.05,
    defaultValue: 1,
    unit: "x",
  }),
  number("font-weight", "typography", "THEME.TEXT_WEIGHT", {
    min: 400,
    max: 700,
    step: 100,
    defaultValue: 400,
  }),
  number("tracking", "typography", "THEME.LETTER_SPACING", {
    min: -0.05,
    max: 0.1,
    step: 0.005,
    defaultValue: 0,
    unit: "em",
  }),

  number("radius", "shape", "THEME.RADIUS", {
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 0,
    unit: "rem",
  }),
  number("spacing", "shape", "THEME.TOKEN.SPACING", {
    min: 0.18,
    max: 0.34,
    step: 0.01,
    defaultValue: 0.25,
    unit: "rem",
  }),
  {
    id: "shadow",
    kind: "select",
    group: "shape",
    perMode: false,
    labelKey: "THEME.TOKEN.SHADOW",
    options: SHADOW_OPTIONS,
  },
];

export const TOKEN_BY_ID: ReadonlyMap<string, TokenDef> = new Map(
  TOKENS.map((t) => [t.id, t]),
);

export function tokensIn(group: TokenGroup): readonly TokenDef[] {
  return TOKENS.filter((t) => t.group === group);
}
