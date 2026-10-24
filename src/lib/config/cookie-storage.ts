import { environmentManager } from "@tanstack/react-query";
import { deleteCookie, getCookie, setCookie } from "cookies-next/client";
import { COOKIE_MAX_AGE } from "./constants";

export const jotaiCookieStorage = {
  getItem<T>(key: string, initialValue: T): T {
    if (environmentManager.isServer()) return initialValue;
    const value = getCookie(key);
    if (!value) return initialValue;
    try {
      return JSON.parse(String(value));
    } catch {
      return initialValue;
    }
  },
  setItem(key: string, value: unknown) {
    if (environmentManager.isServer()) return;
    setCookie(key, JSON.stringify(value), { maxAge: COOKIE_MAX_AGE });
  },
  removeItem(key: string) {
    if (environmentManager.isServer()) return;
    deleteCookie(key);
  },
};
