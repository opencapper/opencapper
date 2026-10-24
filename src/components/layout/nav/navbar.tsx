"use client";

import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { LanguageToggle } from "@/components/toggle/language-toggle";
import { ThemeToggle } from "@/components/toggle/theme-toggle";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname } from "@/i18n/navigation";
import { env } from "@/lib/config/env";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { MobileNav } from "./mobile-nav";
import { isActiveLink, navigation } from "./navigation";
import { PrefetchLink } from "./prefetch-link";
import { UserMenu } from "./user-menu";

const TAB =
  "group/tab relative flex h-full flex-1 items-center justify-center gap-1.5 border-r border-foreground/6 px-2 transition-colors xl:px-4";

export function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-12 items-stretch">
      <Link
        href="/"
        prefetch={false}
        className={cn(
          "group flex shrink-0 items-center gap-2 px-4 lg:px-7",
          isHome
            ? "bg-background border-foreground/6 flex-1 border-b lg:w-[40%] lg:flex-none lg:border-b-0 lg:bg-transparent"
            : "bg-background border-foreground/6 flex-1 border-b lg:flex-none lg:border-r",
        )}
      >
        <LogoImage />
        <CompanyName className="text-foreground group-hover:text-foreground/70 text-[15px] transition-colors" />
      </Link>

      <div className="bg-background border-foreground/6 hidden min-w-0 flex-1 items-stretch border-b lg:flex">
        {navigation.map((link) => {
          const active = isActiveLink(pathname, link.href, link.exact);
          return (
            <PrefetchLink
              key={link.name}
              href={link.href}
              className={cn(
                TAB,
                active
                  ? "border-b-foreground/60 border-b-2"
                  : "hover:bg-foreground/3",
              )}
            >
              <span
                className={cn(
                  "label-mono text-xs whitespace-nowrap transition-colors",
                  active
                    ? "text-foreground"
                    : "text-foreground/50 group-hover/tab:text-foreground/80",
                )}
              >
                {t(link.name)}
              </span>
            </PrefetchLink>
          );
        })}
        <a
          href={env.githubUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(TAB, "hover:bg-foreground/3")}
        >
          <span className="label-mono text-foreground/50 group-hover/tab:text-foreground/80 text-xs whitespace-nowrap transition-colors">
            {t("NAV.GITHUB")}
          </span>
          <Icon
            name="arrow-up-right"
            className="text-foreground/40 size-3 transition-transform group-hover/tab:translate-x-0.5 group-hover/tab:-translate-y-0.5"
          />
        </a>
        <div className="border-foreground/6 flex items-center gap-1 border-r px-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="flex items-stretch [&>a]:h-full [&>a]:rounded-none [&>a]:px-5 [&>a]:font-mono [&>a]:text-xs [&>a]:tracking-wider [&>a]:uppercase [&>button]:mx-3 [&>button]:my-auto">
          <UserMenu />
        </div>
      </div>

      <div className="bg-background border-foreground/6 flex items-center gap-1 border-b pr-2 lg:hidden">
        <UserMenu />
        <MobileNav />
      </div>
    </nav>
  );
}
