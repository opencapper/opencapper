import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import type { BookStatus } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { WRAP } from "./landing-ui";

// A book counts as read live when its newest price is under ten minutes old.
const FRESH_MS = 10 * 60_000;

export async function BooksWall(props: { books: BookStatus[]; now: number }) {
  const t = await getTranslations("LANDING.BOOKS");
  if (props.books.length === 0) return null;
  const sharp = props.books.find((b) => b.book === "pinnacle");
  const soft = props.books
    .filter((b) => b.book !== "pinnacle")
    .sort((a, b) => b.quotes - a.quotes);
  const fresh = (b: BookStatus) =>
    !!b.newest_seen_at &&
    props.now - new Date(b.newest_seen_at).getTime() < FRESH_MS;

  return (
    <section className="border-t py-10">
      <div className={WRAP}>
        <p className="text-muted-foreground text-sm">
          {t("WALL", { count: String(soft.length) })}
        </p>
        <ul className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {sharp && (
            <li className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <VendorLogo vendorKey={sharp.book} size={20} className="rounded-sm" />
              <span className="truncate">{bookName(sharp.book)}</span>
              <span className="text-muted-foreground text-xs font-normal">
                {t("SHARP")}
              </span>
            </li>
          )}
          {soft.map((b) => (
            <li
              key={b.book}
              className="text-foreground/80 flex min-w-0 items-center gap-2 text-sm"
              title={fresh(b) ? t("FRESH") : t("STALE")}
            >
              <VendorLogo vendorKey={b.book} size={20} className="rounded-sm" />
              <span className="truncate">{bookName(b.book)}</span>
              <span
                aria-hidden
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  fresh(b) ? "bg-success" : "bg-muted-foreground/30",
                )}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
