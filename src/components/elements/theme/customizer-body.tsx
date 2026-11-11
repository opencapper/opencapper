"use client";

import { FieldGroup } from "@/components/elements/theme/field";
import {
  ChartPresetSection,
  PresetsSection,
} from "@/components/elements/theme/presets-section";
import { TokenField } from "@/components/elements/theme/token-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useThemeEditor } from "@/hooks/ui/use-theme-editor-hook";
import {
  tokensIn,
  type MessageKey,
  type ThemeMode,
  type TokenGroup,
} from "@/lib/theme/tokens";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

const COLOR_GROUPS: readonly {
  group: TokenGroup;
  labelKey: MessageKey;
  hintKey: MessageKey;
}[] = [
  {
    group: "surface",
    labelKey: "THEME.GROUP.SURFACE",
    hintKey: "THEME.GROUP.SURFACE_HINT",
  },
  {
    group: "text",
    labelKey: "THEME.GROUP.TEXT",
    hintKey: "THEME.GROUP.TEXT_HINT",
  },
  {
    group: "control",
    labelKey: "THEME.GROUP.CONTROL",
    hintKey: "THEME.GROUP.CONTROL_HINT",
  },
  {
    group: "status",
    labelKey: "THEME.GROUP.STATUS",
    hintKey: "THEME.GROUP.STATUS_HINT",
  },
  {
    group: "sidebar",
    labelKey: "THEME.GROUP.SIDEBAR",
    hintKey: "THEME.GROUP.SIDEBAR_HINT",
  },
];

const SECTIONS: readonly { id: string; labelKey: MessageKey }[] = [
  { id: "presets", labelKey: "THEME.CATEGORY.PRESETS" },
  { id: "picks", labelKey: "THEME.CATEGORY.PICKS" },
  { id: "typography", labelKey: "THEME.CATEGORY.TYPOGRAPHY" },
  { id: "shape", labelKey: "THEME.CATEGORY.SHAPE" },
  { id: "colors", labelKey: "THEME.CATEGORY.COLORS" },
  { id: "charts", labelKey: "THEME.CATEGORY.CHARTS" },
];

function Section(props: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="ring-foreground/10 rounded-lg ring-1">
      <button
        type="button"
        onClick={props.onToggle}
        aria-expanded={props.open}
        className="text-foreground flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
      >
        {props.label}
        <Icon
          name="chevron-down"
          className={`size-4 transition-transform ${props.open ? "rotate-180" : ""}`}
        />
      </button>
      {props.open && (
        <div className="flex flex-col gap-2.5 border-t p-2.5">
          {props.children}
        </div>
      )}
    </div>
  );
}

export function ThemeCustomizerBody() {
  const t = useTranslations();
  const editor = useThemeEditor();
  const mode = editor.mode;

  const setMode = (next: ThemeMode) =>
    editor.setEditor({ ...editor.editor, mode: next });
  const toggleSection = (id: string) =>
    editor.setEditor({
      ...editor.editor,
      section: editor.editor.section === id ? "" : id,
    });

  const fields = (group: TokenGroup) =>
    tokensIn(group).map((def) => (
      <TokenField key={def.id} def={def} editor={editor} />
    ));

  const colorTabs = (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1">
      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v === "light" ? "light" : "dark")}
      >
        <TabsList className="h-7">
          <TabsTrigger value="light" className="text-xs">
            {t("THEME.LIGHT")}
          </TabsTrigger>
          <TabsTrigger value="dark" className="text-xs">
            {t("THEME.DARK")}
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={editor.copyModeToOther}
      >
        <Icon name="copy" className="mr-1 size-3.5" />
        {t(mode === "light" ? "THEME.COPY_TO_DARK" : "THEME.COPY_TO_LIGHT")}
      </Button>
    </div>
  );

  const content: Record<string, ReactNode> = {
    presets: <PresetsSection editor={editor} />,
    picks: (
      <>
        {colorTabs}
        <p className="text-muted-foreground px-1 text-[11px]">
          {t("THEME.GROUP.PICK_HINT")}
        </p>
        {fields("pick")}
      </>
    ),
    typography: fields("typography"),
    shape: fields("shape"),
    colors: (
      <>
        {colorTabs}
        {COLOR_GROUPS.map((g) => (
          <div key={g.group} className="flex flex-col gap-2.5">
            <div className="px-1 pt-2">
              <div className="text-foreground text-xs font-medium">
                {t(g.labelKey)}
              </div>
              <div className="text-muted-foreground text-[11px]">
                {t(g.hintKey)}
              </div>
            </div>
            {fields(g.group)}
          </div>
        ))}
      </>
    ),
    charts: (
      <>
        <ChartPresetSection editor={editor} />
        {fields("chart")}
      </>
    ),
  };

  return (
    <Card data-theme-editor className="flex flex-col gap-0">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <CardTitle className="text-base">{t("THEME.TITLE")}</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={editor.shuffle}
          >
            <Icon name="shuffle" />
            {t("THEME.SHUFFLE")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={editor.isDefault}
            onClick={editor.reset}
          >
            <Icon name="refresh-ccw" />
            {t("THEME.RESET_ALL")}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-4 py-4">
        <FieldGroup>
          {SECTIONS.map((s) => (
            <Section
              key={s.id}
              label={t(s.labelKey)}
              open={editor.editor.section === s.id}
              onToggle={() => toggleSection(s.id)}
            >
              {content[s.id]}
            </Section>
          ))}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}
