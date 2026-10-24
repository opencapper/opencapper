"use client";

import { buildThemeCss, googleFontHref } from "@/lib/theme/build-css";
import { userThemeAtom } from "@/lib/theme/theme-store";
import { useAtomValue } from "jotai";
import { useEffect } from "react";

const FONT_LINK_ID = "user-theme-font";

export function UserThemeProvider(props: { children: React.ReactNode }) {
  const theme = useAtomValue(userThemeAtom);

  // The layout already renders this same CSS from the cookie, so the mount pass
  // rewrites an identical string. It stays because the atom is the live source
  // for editor changes, which must repaint without a reload.
  useEffect(() => {
    const themeEl = document.getElementById("user-theme");
    if (themeEl) themeEl.textContent = buildThemeCss(theme);
  }, [theme]);

  useEffect(() => {
    const href = googleFontHref(theme);
    const existing = document.getElementById(FONT_LINK_ID);
    if (!href) {
      existing?.remove();
      return;
    }
    if (existing instanceof HTMLLinkElement) {
      if (existing.href !== href) existing.href = href;
      return;
    }
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }, [theme]);

  return <>{props.children}</>;
}
