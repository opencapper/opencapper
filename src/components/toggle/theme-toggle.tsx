"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

export function ThemeToggle(props: { className?: string }) {
  const t = useTranslations();
  const theme = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      className={cn("relative", props.className)}
      aria-label={t("THEME.TOGGLE")}
      title={t("THEME.TOGGLE")}
      onClick={() =>
        theme.setTheme(theme.resolvedTheme === "dark" ? "light" : "dark")
      }
    >
      <Icon name="sun" className="size-4 dark:hidden" />
      <Icon name="moon" className="hidden size-4 dark:block" />
    </Button>
  );
}

const MODES = ["light", "dark", "system"] as const;

const MODE_ICON = { light: "sun", dark: "moon", system: "monitor" } as const;

const MODE_LABEL = {
  light: "THEME.LIGHT",
  dark: "THEME.DARK",
  system: "THEME.SYSTEM",
} as const;

// Settings control: the choice lives in localStorage, so it holds across visits on this device.
export function ThemeSegments() {
  const t = useTranslations();
  const theme = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label={t("THEME.TOGGLE")}
      className="bg-muted inline-flex rounded-md p-0.5"
    >
      {MODES.map((mode) => (
        <button
          key={mode}
          type="button"
          role="radio"
          aria-checked={theme.theme === mode}
          onClick={() => theme.setTheme(mode)}
          className={cn(
            "inline-flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-xs font-medium transition-colors",
            theme.theme === mode
              ? "bg-background text-foreground shadow-xs"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon name={MODE_ICON[mode]} className="size-3.5" />
          {t(MODE_LABEL[mode])}
        </button>
      ))}
    </div>
  );
}
