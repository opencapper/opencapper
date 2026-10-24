import dayjs from "dayjs";
import "dayjs/locale/de";
import "dayjs/locale/es";
import "dayjs/locale/fr";
import "dayjs/locale/it";
import "dayjs/locale/ja";
import "dayjs/locale/nl";
import "dayjs/locale/pl";
import "dayjs/locale/pt-br";
import "dayjs/locale/tr";
import localizedFormat from "dayjs/plugin/localizedFormat";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export type { Dayjs } from "dayjs";
export { dayjs };

export function formatDateTime(value: string | Date, locale: string): string {
  return dayjs(value).locale(locale).format("YYYY-MM-DD HH:mm");
}

export function formatUtcDateTime(
  value: string | Date,
  locale: string,
): string {
  return `${dayjs.utc(value).locale(locale).format("YYYY-MM-DD HH:mm")} UTC`;
}

export function formatUtcDate(value: string | Date, locale: string): string {
  return dayjs.utc(value).locale(locale).format("YYYY-MM-DD");
}

// Intl knows each locale's month and day order ("Oct 24", "24 oct", "10月24日"); dayjs only has full formats.
export function formatShortDate(value: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
  }).format(dayjs(value).toDate());
}

export function formatUtcShortDateTime(
  value: string | Date,
  locale: string,
): string {
  const text = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "UTC",
  }).format(dayjs(value).toDate());
  return `${text} UTC`;
}

export function formatRelative(value: string | Date, locale: string): string {
  return dayjs(value).locale(locale).fromNow();
}

export function formatDate(value: string | Date, locale: string): string {
  return dayjs(value).locale(locale).format("LL");
}

export function formatTime(value: string | Date, locale: string): string {
  return dayjs(value).locale(locale).format("LT");
}

export function dayKey(value: string | Date): string {
  return dayjs(value).format("YYYY-MM-DD");
}

// Days from today in local time: 0 today, 1 tomorrow.
export function daysFromToday(value: string | Date): number {
  return dayjs(value).startOf("day").diff(dayjs().startOf("day"), "day");
}

export function formatDayHeading(value: string | Date, locale: string): string {
  return dayjs(value).toDate().toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
