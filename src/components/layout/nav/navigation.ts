import type { LinkHref } from "@/i18n/routing";
import type { IconName } from "@/lib/config/icon-map";
import type { PlainTranslationKey } from "@/lib/types";

export type NavigationItem = {
  name: PlainTranslationKey;
  href: LinkHref;
  iconName: IconName;
  exact?: boolean;
  soon?: boolean;
};

const resolveHref = (href: LinkHref) =>
  typeof href === "string" ? href : (href.pathname ?? "/");

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

export const navigation: NavigationItem[] = [
  { name: "NAV.VALUE_BETS", href: "/value-bets", iconName: "trending-up" },
  { name: "NAV.ARBS", href: "/arbs", iconName: "scale" },
  { name: "NAV.ODDS", href: "/games", iconName: "table" },
  { name: "NAV.PROOF", href: "/proof", iconName: "shield-check" },
  { name: "NAV.BOOKS", href: "/books", iconName: "store" },
  { name: "NAV.TOOLS", href: "/tools", iconName: "calculator" },
  { name: "NAV.TRACKER", href: "/tracker", iconName: "wallet", soon: true },
];
