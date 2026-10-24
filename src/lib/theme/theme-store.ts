import { jotaiCookieStorage } from "@/lib/config/cookie-storage";
import { migrateTheme } from "@/lib/theme/migrate";
import {
  INITIAL_USER_THEME,
  USER_THEME_KEY,
  type UserTheme,
} from "@/lib/theme/theme-types";
import type { ThemeMode } from "@/lib/theme/tokens";
import { atomWithStorage } from "jotai/utils";

const themeCookieStorage = {
  getItem: (key: string, initial: UserTheme): UserTheme =>
    migrateTheme(jotaiCookieStorage.getItem<unknown>(key, initial)),
  setItem: jotaiCookieStorage.setItem,
  removeItem: jotaiCookieStorage.removeItem,
};

// getOnInit is a load-bearing PAIR with UserThemeStoreProvider; neither may be
// removed alone. See CLAUDE.md "Theme".
export const userThemeAtom = atomWithStorage<UserTheme>(
  USER_THEME_KEY,
  INITIAL_USER_THEME,
  themeCookieStorage,
  { getOnInit: true },
);

export type ThemeEditorState = {
  mode: ThemeMode;
  section: string;
};

// Where the editor was left, never part of the theme itself.
export const themeEditorAtom = atomWithStorage<ThemeEditorState>(
  "theme-editor",
  { mode: "dark", section: "presets" },
);
