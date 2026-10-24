"use client";

import { userThemeAtom } from "@/lib/theme/theme-store";
import { INITIAL_USER_THEME, type UserTheme } from "@/lib/theme/theme-types";
import { environmentManager } from "@tanstack/react-query";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";

// Load-bearing half of the userThemeAtom getOnInit pair (see CLAUDE.md "Theme").
// The layout bakes this theme into <style id="user-theme">; without the seed the
// first client render holds INITIAL_USER_THEME and UserThemeProvider's effect
// overwrites that style tag with default CSS until the user edits the theme.
export function UserThemeStoreProvider(props: {
  children: ReactNode;
  data?: UserTheme;
}) {
  // The store is a module singleton, so on the server only the first request
  // of a process would seed without forcing.
  useHydrateAtoms([[userThemeAtom, props.data ?? INITIAL_USER_THEME]], {
    dangerouslyForceHydrate: environmentManager.isServer(),
  });

  return <>{props.children}</>;
}
