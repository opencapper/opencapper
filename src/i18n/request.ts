import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "./routing";

// Guard belongs here: notFound() thrown from the root layout renders the wrong 404.
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  if (!hasLocale(routing.locales, requested)) notFound();

  const raw = await import(`../../public/i18n/${requested}.json`);

  return {
    locale: requested,
    messages: raw.default,
    timeZone: "UTC",
  };
});
