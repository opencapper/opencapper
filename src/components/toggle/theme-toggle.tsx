"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const t = useTranslations();
  const theme = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t("THEME.TOGGLE")}
          />
        }
      >
        <Icon
          name="sun"
          className="h-4 w-4 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90"
        />
        <Icon
          name="moon"
          className="absolute h-4 w-4 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => theme.setTheme("light")}
          className="cursor-pointer"
        >
          <Icon name="sun" className="h-4 w-4" />
          {t("THEME.LIGHT")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => theme.setTheme("dark")}
          className="cursor-pointer"
        >
          <Icon name="moon" className="h-4 w-4" />
          {t("THEME.DARK")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => theme.setTheme("system")}
          className="cursor-pointer"
        >
          <Icon name="monitor" className="h-4 w-4" />
          {t("THEME.SYSTEM")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={<Link href="/settings/appearance" />}
          className="cursor-pointer"
        >
          <Icon name="paintbrush" className="h-4 w-4" />
          {t("THEME.CUSTOMIZE")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
