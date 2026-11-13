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

export function Navbar(props: { user?: User; live?: ReactNode }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="bg-background/95 supports-[backdrop-filter]:bg-background/80 fixed inset-x-0 top-0 z-50 h-14 border-b backdrop-blur">
      <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          prefetch={false}
          aria-label="OpenEV"
          className="flex shrink-0 items-center gap-2"
        >
          <LogoImage />
          <CompanyName />
        </Link>

        <div className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {navigation.map((link) => {
            const active = isActiveLink(pathname, link.href, link.exact);
            return (
              <PrefetchLink
                key={link.name}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(link.name)}
              </PrefetchLink>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {props.live}
          <div className="hidden items-center lg:flex">
            <LanguageToggle />
            <ThemeToggle />
          </div>
          <UserMenu user={props.user} />
          <MobileNav />
        </div>
      </div>
    </nav>
  );
}
