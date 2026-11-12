"use client";

import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { LanguageToggle } from "@/components/toggle/language-toggle";
import { ThemeToggle } from "@/components/toggle/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import type { User } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { MobileNav } from "./mobile-nav";
import { isActiveLink, navigation } from "./navigation";
import { PrefetchLink } from "./prefetch-link";
import { UserMenu } from "./user-menu";

const TAB =
  "group/tab relative flex h-full items-center justify-center px-2.5 transition-colors 2xl:px-4";

export function Navbar(props: { user?: User; live?: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="bg-background border-foreground fixed top-0 right-0 left-0 z-50 flex h-14 items-stretch border-b-2">
      <Link
        href="/"
        prefetch={false}
        aria-label="OpenEV"
        className="group flex shrink-0 items-center gap-2.5 px-4 xl:px-7"
      >
        <LogoImage className="transition-transform duration-500 group-hover:rotate-45 motion-reduce:transition-none" />
        <CompanyName />
      </Link>

      <div className="hidden min-w-0 flex-1 items-stretch justify-end xl:flex">
        {navigation.map((link) => {
          const active = isActiveLink(pathname, link.href, link.exact);
          return (
            <PrefetchLink key={link.name} href={link.href} className={TAB}>
              <span
                className={cn(
                  "label-mono text-[12px] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "text-foreground"
                    : "text-foreground/55 group-hover/tab:text-foreground",
                )}
              >
                {t(link.name)}
              </span>
              <span
                aria-hidden
                className={cn(
                  "bg-vermilion absolute inset-x-2.5 -bottom-0.5 h-[3px] origin-left transition-transform duration-300 2xl:inset-x-4",
                  active
                    ? "scale-x-100"
                    : "scale-x-0 group-hover/tab:scale-x-50",
                )}
              />
            </PrefetchLink>
          );
        })}
      </div>

      <div className="ml-auto flex items-center gap-1.5 pr-2 xl:ml-0 xl:pr-4 xl:pl-3">
        {props.live}
        <div className="hidden items-center gap-0.5 xl:flex">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <UserMenu user={props.user} />
        <MobileNav />
      </div>
    </nav>
  );
}
