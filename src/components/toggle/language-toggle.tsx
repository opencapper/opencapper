"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { RouterPush } from "@/i18n/routing";
import { LANGUAGES } from "@/lib/config/constants";
import type { Locale } from "next-intl";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";

export function LanguageToggle() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const transition = useTransition();
  const isPending = transition[0];
  const startTransition = transition[1];
  const currentLanguage = LANGUAGES.find((lang) => lang.locale === locale);

  const currentHref = (): RouterPush =>
    pathname === "/u/[username]"
      ? { pathname, params: { username: String(params.username ?? "") } }
      : pathname;

  const handleLanguageChange = (newLocale: Locale) => {
    startTransition(() => {
      router.replace(currentHref(), { locale: newLocale });
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className={isPending ? "opacity-30 transition-opacity" : ""}
            aria-label={t("LANGUAGE.SWITCH")}
          />
        }
      >
        {currentLanguage && (
          <currentLanguage.Flag className="h-3.5 w-5 rounded-sm" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.locale}
            onClick={() => handleLanguageChange(lang.locale)}
            className="flex cursor-pointer items-center gap-2 px-3 py-2 text-sm"
          >
            <lang.Flag className="h-3.5 w-5 rounded-sm" />
            {t(`LANGUAGE.${lang.code}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
