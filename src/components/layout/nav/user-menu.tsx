"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

// Accounts move to the API (/v1/auth/*); until then this only says where sign in will live.
export function UserMenu() {
  const t = useTranslations("AUTH");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button size="sm" aria-label={t("SIGN_IN")} />}
      >
        <Icon name="log-in" />
        <span className="hidden sm:inline">{t("SIGN_IN")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t("SOON_TITLE")}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <p className="text-muted-foreground px-2 pb-2 text-xs leading-snug">
          {t("SOON_BODY")}
        </p>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/tracker" />}>
          <Icon name="wallet" />
          {t("TRACKER")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/appearance" />}>
          <Icon name="paintbrush" />
          {t("APPEARANCE")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
