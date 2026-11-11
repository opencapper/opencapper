"use client";

import { CompanyName, LogoImage } from "@/components/elements/brand/brand";
import { LanguageToggle } from "@/components/toggle/language-toggle";
import { ThemeToggle } from "@/components/toggle/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { MobileNav } from "./mobile-nav";
import { isActiveLink, navigation } from "./navigation";
import { PrefetchLink } from "./prefetch-link";
import { UserMenu } from "./user-menu";

const TAB =
  "group/tab relative flex h-full flex-1 items-center justify-center gap-1.5 border-r border-foreground/6 px-2 transition-colors 2xl:px-4";

export function Navbar(props: { email?: string }) {
  const t = useTranslations();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 right-0 left-0 z-50 flex h-12 items-stretch">
      <Link
        href="/"
        prefetch={false}
        className="group bg-background border-foreground/6 flex flex-1 shrink-0 items-center gap-2 border-b px-4 xl:flex-none xl:border-r xl:px-7"
      >
        <LogoImage />
        <CompanyName className="text-foreground group-hover:text-foreground/70 text-[15px] transition-colors" />
      </Link>

      <div className="bg-background border-foreground/6 hidden min-w-0 flex-1 items-stretch border-b xl:flex">
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
        <div className="border-foreground/6 flex items-center gap-1 border-r px-2">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="flex items-stretch [&>a]:h-full [&>a]:rounded-none [&>a]:px-5 [&>a]:font-mono [&>a]:text-xs [&>a]:tracking-wider [&>a]:uppercase [&>button]:mx-2 [&>button]:my-auto">
          <UserMenu email={props.email} />
        </div>
      </div>

      <div className="bg-background border-foreground/6 flex items-center gap-1 border-b pr-2 xl:hidden">
        <UserMenu email={props.email} />
        <MobileNav />
      </div>
    </nav>
  );
}
