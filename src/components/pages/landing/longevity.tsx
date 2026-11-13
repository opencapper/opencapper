import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { BookStatus } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { count, prob } from "@/lib/format";
import { getLocale, getTranslations } from "next-intl/server";

const HABITS = [
  "HABIT_ROUND",
  "HABIT_MIX",
  "HABIT_SPREAD",
  "HABIT_THIN",
  "HABIT_WITHDRAW",
] as const;

const ROWS = 6;

export async function Longevity(props: {
  books: BookStatus[];
  alertsByBook: Record<string, number>;
}) {
  const t = await getTranslations("LANDING.LONGEVITY");
  const locale = await getLocale();
  const rows = props.books
    .filter((b) => b.book !== "pinnacle" && (props.alertsByBook[b.book] ?? 0) > 0)
    .sort((a, b) => (props.alertsByBook[b.book] ?? 0) - (props.alertsByBook[a.book] ?? 0))
    .slice(0, ROWS);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="bg-card rounded-lg border p-5">
        <h3 className="text-sm font-semibold">{t("HABITS")}</h3>
        <ol className="mt-4 flex flex-col gap-3">
          {HABITS.map((h, i) => (
            <li key={h} className="flex items-start gap-3 text-sm">
              <span className="bg-muted tabular grid size-5 shrink-0 place-items-center rounded text-[11px] font-medium">
                {i + 1}
              </span>
              {t(h)}
            </li>
          ))}
        </ol>
        <Link
          href="/tracker/health"
          className="text-primary mt-5 inline-flex items-center gap-1 text-sm font-medium hover:underline"
        >
          {t("HEALTH_LINK")}
          <Icon name="arrow-right" className="size-3.5" />
        </Link>
      </div>

      <div className="bg-card overflow-hidden rounded-lg border">
        <div className="bg-subtle eyebrow grid grid-cols-[minmax(0,1fr)_72px_96px] gap-4 border-b px-4 py-2">
          <span>{t("BOOK")}</span>
          <span className="text-right">{t("ALERTS")}</span>
          <span className="text-right">{t("GAP")}</span>
        </div>
        <ul>
          {rows.map((b) => (
            <li
              key={b.book}
              className="grid grid-cols-[minmax(0,1fr)_72px_96px] items-center gap-4 border-b px-4 py-2.5 text-sm last:border-b-0"
            >
              <span className="flex min-w-0 items-center gap-2">
                <VendorLogo vendorKey={b.book} size={18} className="rounded-sm" />
                <span className="truncate">{bookName(b.book)}</span>
              </span>
              <span className="tabular text-right">
                {count(props.alertsByBook[b.book] ?? 0, locale)}
              </span>
              <span className="tabular text-muted-foreground text-right">
                {b.median_implied_gap === null || b.median_implied_gap === undefined
                  ? ""
                  : prob(b.median_implied_gap)}
              </span>
            </li>
          ))}
        </ul>
        <p className="text-muted-foreground border-t px-4 py-2.5 text-xs">
          {t("GAP_NOTE")}
        </p>
      </div>
    </div>
  );
}
