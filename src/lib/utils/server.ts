import { LOCALES } from "@/lib/config/constants";
import { hasLocale, type Locale } from "next-intl";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

// Guarded here, not in the root layout: notFound() there renders the wrong 404.
export const serverLocale = async (props: {
  params: Promise<{ locale: string }>;
}): Promise<Locale> => {
  const locale = (await props.params).locale;
  if (!hasLocale(LOCALES, locale)) notFound();
  return locale;
};

export const getCookieValue = async <T>(
  key: string,
): Promise<T | undefined> => {
  const cookieStore = await cookies();
  try {
    return JSON.parse(cookieStore.get(key)?.value ?? "");
  } catch {
    return undefined;
  }
};
