"use client";

import { ColorField } from "@/components/elements/theme/color-field";
import { FontNameField } from "@/components/elements/theme/font-name-field";
import { Picker, type PickerOption } from "@/components/elements/theme/picker";
import { Icon } from "@/components/ui/icon";
import { Slider } from "@/components/ui/slider";
import type { ThemeEditor } from "@/hooks/ui/use-theme-editor-hook";
import { msg } from "@/lib/config/constants";
import { customFontName, fontKindOf } from "@/lib/theme/build-css";
import {
  DEFAULT_FONTS,
  FONT_GROUPS,
  FONT_OPTIONS,
  type FontKind,
} from "@/lib/theme/fonts";
import { CUSTOM } from "@/lib/theme/presets";
import { writeToken } from "@/lib/theme/theme-types";
import {
  TOKEN_BY_ID,
  type TokenDef,
  type TokenOption,
} from "@/lib/theme/tokens";
import { useTranslations } from "next-intl";

type T = ReturnType<typeof useTranslations<never>>;

function optionLabel(t: T, opt: TokenOption): string {
  return opt.label ?? (opt.labelKey ? t(opt.labelKey) : opt.value);
}

function formatNumber(def: TokenDef, value: number): string {
  if (def.unit === "%" || def.unit === "x")
    return `${Math.round(value * 100)}%`;
  return def.unit ? `${value}${def.unit}` : String(value);
}

function toNumber(v: string | number | undefined): number | undefined {
  if (v === undefined) return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function TokenSlider(props: {
  def: TokenDef;
  value: number | undefined;
  fallback: number | undefined;
  onChange: (value: number | undefined) => void;
}) {
  const t = useTranslations();
  const def = props.def;
  const shown =
    props.value ?? props.fallback ?? def.defaultValue ?? def.min ?? 0;
  const set = props.value !== undefined;
  return (
    <div className="flex flex-col gap-1.5 px-1 pt-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{t(def.labelKey)}</span>
        <span className="text-muted-foreground tabular flex items-center gap-2 text-xs">
          {!set && <span className="opacity-60">{t("THEME.INHERITED")}</span>}
          {formatNumber(def, shown)}
          {set && (
            <button
              type="button"
              onClick={() => props.onChange(undefined)}
              className="hover:text-foreground"
              aria-label={t("THEME.RESET_FIELD")}
            >
              <Icon name="x" className="size-3.5" />
            </button>
          )}
        </span>
      </div>
      <Slider
        aria-label={t(def.labelKey)}
        min={def.min}
        max={def.max}
        step={def.step}
        value={shown}
        onValueChange={(v) => props.onChange(Array.isArray(v) ? v[0] : v)}
      />
    </div>
  );
}

const GROUP_LABEL = {
  sans: msg("THEME.FONT_GROUP.SANS"),
  display: msg("THEME.FONT_GROUP.DISPLAY"),
  mono: msg("THEME.FONT_GROUP.MONO"),
} satisfies Record<FontKind, string>;

// A heading picker offers the sans faces too, after its own display faces.
const PICKER_GROUPS: Record<FontKind, readonly FontKind[]> = {
  sans: ["sans"],
  display: ["display", "sans"],
  mono: ["mono"],
};

function fontLabel(id: string): string {
  return FONT_OPTIONS.find((f) => f.id === id)?.label ?? id;
}

function FontField(props: {
  def: TokenDef;
  value: string | undefined;
  onChange: (value: string | undefined, weight?: number) => void;
}) {
  const t = useTranslations();
  const kind = fontKindOf(props.def.id);
  const defaultLabel = t("THEME.FONT_DEFAULT_NAMED", {
    name: fontLabel(DEFAULT_FONTS[kind]),
  });
  const seen = new Set<string>();
  const grouped: PickerOption[] = [];
  for (const group of PICKER_GROUPS[kind]) {
    for (const id of FONT_GROUPS[group]) {
      const font = FONT_OPTIONS.find((f) => f.id === id);
      if (!font || seen.has(id) || !font.kinds.includes(kind)) continue;
      seen.add(id);
      grouped.push({
        value: font.id,
        label: font.label,
        fontVar: font.varName,
        group: t(GROUP_LABEL[group]),
      });
    }
  }
  const options: PickerOption[] = [
    { value: "", label: defaultLabel },
    ...grouped,
    { value: CUSTOM, label: t("THEME.FONT_CUSTOM") },
  ];
  const raw = props.value ?? "";
  const custom = raw.startsWith(`${CUSTOM}:`) || raw === CUSTOM;
  const pickerValue = custom ? CUSTOM : raw;
  const current = options.find((o) => o.value === pickerValue);
  return (
    <>
      <Picker
        label={t(props.def.labelKey)}
        value={pickerValue}
        valueLabel={
          custom
            ? (customFontName(raw) ?? t("THEME.FONT_CUSTOM"))
            : raw
              ? (current?.label ?? raw)
              : defaultLabel
        }
        options={options}
        onValueChange={(v) =>
          props.onChange(v === "" ? undefined : v === CUSTOM ? `${CUSTOM}:` : v)
        }
      />
      {custom && (
        <FontNameField
          label={t(props.def.labelKey)}
          value={customFontName(raw) ?? undefined}
          onChange={(name, weight) =>
            props.onChange(name ? `${CUSTOM}:${name}` : `${CUSTOM}:`, weight)
          }
        />
      )}
    </>
  );
}

export function TokenField(props: { def: TokenDef; editor: ThemeEditor }) {
  const t = useTranslations();
  const def = props.def;
  const editor = props.editor;
  const value = editor.read(def);
  const inherited = editor.inherited(def);

  if (def.kind === "color") {
    return (
      <ColorField
        label={t(def.labelKey)}
        value={value === undefined ? undefined : String(value)}
        placeholder={inherited === undefined ? undefined : String(inherited)}
        onChange={(hex) => editor.write(def, hex)}
      />
    );
  }
  if (def.kind === "number") {
    return (
      <TokenSlider
        def={def}
        value={toNumber(value)}
        fallback={toNumber(inherited)}
        onChange={(v) => editor.write(def, v)}
      />
    );
  }
  if (def.kind === "font") {
    const weightDef = TOKEN_BY_ID.get("font-weight");
    return (
      <FontField
        def={def}
        value={value === undefined ? undefined : String(value)}
        onChange={(v, weight) => {
          const next = writeToken(editor.theme, editor.mode, def, v);
          editor.setTheme(
            weightDef && weight !== undefined
              ? writeToken(next, editor.mode, weightDef, weight)
              : next,
          );
        }}
      />
    );
  }
  const options = def.options ?? [];
  const current = options.find((o) => o.value === String(value ?? ""));
  const fallback = options.find(
    (o) => o.value === String(inherited ?? options[0]?.value),
  );
  return (
    <Picker
      label={t(def.labelKey)}
      value={current?.value ?? fallback?.value}
      valueLabel={
        current
          ? optionLabel(t, current)
          : fallback
            ? optionLabel(t, fallback)
            : ""
      }
      options={options.map((o) => ({
        value: o.value,
        label: optionLabel(t, o),
      }))}
      onValueChange={(v) => editor.write(def, v)}
    />
  );
}
