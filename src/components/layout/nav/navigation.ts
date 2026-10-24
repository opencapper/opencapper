import type { LinkHref } from "@/i18n/routing";
import type { IconName } from "@/lib/config/icon-map";
import type { TranslationKey } from "@/lib/types";

export type NavigationItem = {
  name: TranslationKey;
  href: LinkHref;
  iconName: IconName;
  exact?: boolean;
};

const resolveHref = (href: LinkHref) =>
  typeof href === "string" ? href : href.pathname;

export const isActiveLink = (
  pathname: string,
  href: LinkHref,
  exact?: boolean,
) => {
  const cleanPathname = pathname.replace(/\/$/, "") || "/";
  const cleanHref = resolveHref(href).replace(/\/$/, "") || "/";

  if (exact || cleanHref === "/") {
    return cleanPathname === cleanHref;
  }

  return (
    cleanPathname === cleanHref || cleanPathname.startsWith(cleanHref + "/")
  );
};

export const navigation = [
  { name: "NAV.HOME", href: "/", iconName: "house", exact: true },
  { name: "NAV.LEADERBOARD", href: "/leaderboard", iconName: "trophy" },
  { name: "NAV.CHECK", href: "/check", iconName: "user-search" },
  { name: "NAV.VERIFY", href: "/verify", iconName: "shield-check" },
] satisfies NavigationItem[];
