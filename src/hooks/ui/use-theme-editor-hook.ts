"use client";

import { resolveVars } from "@/lib/theme/build-css";
import { DEFAULT_FONTS, FONT_GROUPS } from "@/lib/theme/fonts";
import {
  ACCENTS,
  CUSTOM,
  DEFAULT,
  PALETTES,
  STYLES,
} from "@/lib/theme/presets";
import { themeEditorAtom, userThemeAtom } from "@/lib/theme/theme-store";
import {
  INITIAL_USER_THEME,
  readToken,
  writeToken,
  type ModeValues,
  type ThemePresets,
  type TokenValues,
} from "@/lib/theme/theme-types";
import type { ThemeMode, TokenDef } from "@/lib/theme/tokens";
import { useAtom } from "jotai";
import { useSyncExternalStore } from "react";

const STYLE_IDS = ["user-theme"];

const SHUFFLE_RADII: readonly [number, ...number[]] = [
  0, 0.375, 0.625, 0.875, 1.25,
];

function pick<T>(items: readonly [T, ...T[]]): T {
  return items[Math.floor(Math.random() * items.length)] ?? items[0];
}

function subscribeThemeStyles(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange);
  for (const id of STYLE_IDS) {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { childList: true, characterData: true });
  }
  return () => observer.disconnect();
}

function themeStylesSnapshot(): string {
  return STYLE_IDS.map(
    (id) => document.getElementById(id)?.textContent ?? "",
  ).join("\n");
}

// The page paints one mode, so the other mode's defaults come from the
// stylesheet rules themselves (`:root` and `.dark`), later rules winning.
function rootDeclarations(mode: ThemeMode): CSSStyleDeclaration[] {
  const selector = mode === "dark" ? ".dark" : ":root";
  const out: CSSStyleDeclaration[] = [];
  const walk = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule && rule.selectorText === selector) {
        out.push(rule.style);
      } else if (rule instanceof CSSGroupingRule) {
        walk(rule.cssRules);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      walk(sheet.cssRules);
    } catch {
      // cross-origin sheet
    }
  }
  return out;
}

function stylesheetVar(cssVar: string, mode: ThemeMode): string | undefined {
  const decls = rootDeclarations(mode);
  const lookup = (name: string): string => {
    for (let i = decls.length - 1; i >= 0; i--) {
      const v = decls[i]?.getPropertyValue(name).trim();
      if (v) return v;
    }
    return "";
  };
  let value = lookup(cssVar);
  for (let hops = 0; hops < 4; hops++) {
    const ref = /^var\((--[\w-]+)\)$/.exec(value);
    if (!ref?.[1]) break;
    value = lookup(ref[1]);
  }
  return value || undefined;
}

export function useThemeEditor() {
  const themeState = useAtom(userThemeAtom);
  const theme = themeState[0];
  const setTheme = themeState[1];
  const editorState = useAtom(themeEditorAtom);
  const editor = editorState[0];
  const setEditor = editorState[1];
  // `inherited` reads computed vars off the page, which the provider only
  // rewrites after this render; re-render once the style tag really changed.
  useSyncExternalStore(subscribeThemeStyles, themeStylesSnapshot, () => "");

  const mode = editor.mode;
  // What the theme renders for this mode, so a preset-driven colour reads as
  // a real value.
  const effective: TokenValues = resolveVars(theme, mode);

  const read = (def: TokenDef) => readToken(theme, mode, def);
  const write = (def: TokenDef, value: string | number | undefined) =>
    setTheme(writeToken(theme, mode, def, value));
  // What is in force when the token is unset: the presets, else whatever
  // globals.css paints, read off the live page. The page only shows one mode,
  // so the DOM answer is used when the editor's mode tab matches it.
  const inherited = (def: TokenDef): string | number | undefined => {
    const derived = def.cssVar ? effective[def.cssVar.slice(2)] : undefined;
    if (derived !== undefined || typeof document === "undefined")
      return derived;
    if (!def.cssVar) return undefined;
    const pageMode: ThemeMode = document.documentElement.classList.contains(
      "dark",
    )
      ? "dark"
      : "light";
    if (def.perMode && pageMode !== mode) {
      return stylesheetVar(def.cssVar, mode);
    }
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue(def.cssVar)
      .trim();
    if (!raw) return undefined;
    if (def.kind === "number") {
      const n = parseFloat(raw);
      return Number.isFinite(n) ? n : undefined;
    }
    return raw;
  };

  // Every per-mode value, copied over the other mode.
  const copyModeToOther = () => {
    const values = theme.global;
    const other: ThemeMode = mode === "light" ? "dark" : "light";
    const next: ModeValues = {
      ...values,
      [other]: { ...(values[mode] ?? {}) },
    };
    setTheme({ ...theme, global: next });
  };

  const presets = theme.presets;
  const setPreset = (key: keyof ThemePresets, id: string) =>
    setTheme({ ...theme, presets: { ...presets, [key]: id } });

  const reset = () => setTheme(INITIAL_USER_THEME);
  const isDefault =
    JSON.stringify(theme.presets) ===
      JSON.stringify(INITIAL_USER_THEME.presets) &&
    Object.keys(theme.global).length === 0;

  // Presets, fonts and radius only; pick status colours stay meaningful.
  const shuffle = () => {
    const all: TokenValues = {
      ...(theme.global.all ?? {}),
      radius: pick(SHUFFLE_RADII),
      "font-sans": pick([DEFAULT_FONTS.sans, ...FONT_GROUPS.sans]),
      "font-display": pick([DEFAULT_FONTS.display, ...FONT_GROUPS.display]),
    };
    setTheme({
      ...theme,
      presets: {
        style: pick([DEFAULT, ...STYLES.map((s) => s.id)]),
        palette: pick([DEFAULT, ...PALETTES.map((p) => p.id)]),
        accent: pick([DEFAULT, ...ACCENTS.map((a) => a.id)]),
        chart: pick([DEFAULT, ...ACCENTS.map((a) => a.id)]),
      },
      global: { ...theme.global, all },
    });
  };

  const isCustom = (key: keyof ThemePresets) => presets[key] === CUSTOM;

  return {
    theme,
    setTheme,
    editor,
    setEditor,
    mode,
    effective,
    read,
    write,
    inherited,
    presets,
    setPreset,
    isCustom,
    copyModeToOther,
    shuffle,
    reset,
    isDefault,
  };
}

export type ThemeEditor = ReturnType<typeof useThemeEditor>;
