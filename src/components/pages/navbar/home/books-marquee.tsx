import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Link } from "@/i18n/navigation";
import type { BookStatus } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { getTranslations } from "next-intl/server";

const EDGE_MASK = "linear-gradient(to right, transparent, black 12%, black 88%, transparent)";

export async function BooksMarquee(props: { books: BookStatus[]; soft: number }) {
  const t = await getTranslations("LANDING");
  const row = props.books.toSorted((a, b) => b.quotes - a.quotes);

  return (
    <div className="mb-10">
      <div className="my-4 flex items-center gap-3">
        <div className="border-border flex-1 border-t" />
        <span className="label-mono text-foreground/50 shrink-0">
          {t("BOOKS_LABEL", { count: String(props.soft) })}
        </span>
      </div>
      <div className="overflow-hidden" style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}>
        <ul
          className="animate-marquee flex w-max hover:[animation-play-state:paused]"
          style={{ animationDuration: `${Math.max(row.length, 6) * 4}s` }}
        >
          {[0, 1].map((copy) =>
            row.map((book) => (
              <li key={`${copy}-${book.book}`} aria-hidden={copy === 1}>
                <Link
                  href="/books"
                  tabIndex={copy === 1 ? -1 : undefined}
                  className="text-foreground/55 hover:text-foreground/85 flex items-center gap-2 px-6 py-2 text-sm whitespace-nowrap transition-colors"
                >
                  <VendorLogo vendorKey={book.book} size={18} />
                  {bookName(book.book)}
                </Link>
              </li>
            )),
          )}
        </ul>
      </div>
    </div>
  );
}
