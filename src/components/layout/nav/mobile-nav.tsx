"use client";

import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { LanguageToggle } from "@/components/toggle/language-toggle";
import { ThemeToggle } from "@/components/toggle/theme-toggle";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { isActiveLink, navigation } from "./navigation";
import { PrefetchLink } from "./prefetch-link";

const ROW =
  "border-foreground/6 flex items-center gap-3 border-b px-5 py-3 transition-colors";

export function MobileNav() {
  const t = useTranslations();
  const pathname = usePathname();
  const sheet = useState(false);
  const setOpen = sheet[1];

  return (
    <Sheet open={sheet[0]} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button className="text-foreground/60 hover:text-foreground flex size-9 items-center justify-center transition-colors lg:hidden" />
        }
      >
        <Icon name="menu" className="size-5" />
        <span className="sr-only">{t("NAV.MENU")}</span>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="bg-background flex w-full flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-foreground/6 h-12 justify-center border-b px-5 py-0">
          <SheetTitle>
            <Link
              href="/"
              prefetch={false}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2"
            >
              <LogoImage />
              <CompanyName className="text-[15px]" />
            </Link>
          </SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col">
          {navigation.map((item, index) => {
            const active = isActiveLink(pathname, item.href, item.exact);
            return (
              <PrefetchLink
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  ROW,
                  active
                    ? "text-foreground"
                    : "text-foreground/50 hover:text-foreground/80",
                )}
              >
                <span className="text-foreground/30 font-mono text-[10px] tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="label-mono">{t(item.name)}</span>
              </PrefetchLink>
            );
          })}
        </nav>

        <div className="border-foreground/6 mt-auto flex items-center gap-2 border-t px-4 py-3">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}
