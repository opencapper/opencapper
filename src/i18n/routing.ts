import { LOCALES } from "@/lib/config/constants";
import { defineRouting } from "next-intl/routing";
import { ComponentProps } from "react";
import type { Link, useRouter } from "./navigation";

export type LinkHref = ComponentProps<typeof Link>["href"];
export type RouterPush = Parameters<ReturnType<typeof useRouter>["push"]>[0];

// Ids from the API are opaque and carry characters a localized path template would have to re-encode, so paths stay the same in every locale.
export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: LOCALES[0],
  localePrefix: "always",
  localeDetection: true,
  // A Set-Cookie on anonymous pages makes them uncacheable at the edge.
  localeCookie: false,
});
