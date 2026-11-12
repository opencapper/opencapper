import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import type { BookStatus } from "@/lib/api/client";
import { bookName } from "@/lib/config/vendor-registry";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import { LiveDot, WRAP } from "./landing-ui";

// A book counts as read live when its newest price is under ten minutes old.
const FRESH_MS = 10 * 60_000;

export async function BooksWall(props: { books: BookStatus[]; now: number }) {
  const t = await getTranslations("LANDING.BOOKS");
  const soft = props.books.filter((b) => b.book !== "pinnacle");
  const sharp = props.books.find((b) => b.book === "pinnacle");
  if (props.books.length === 0) return null;
  const sorted = soft.slice().sort((a, b) => b.quotes - a.quotes);

  return (
    <section className="border-foreground bg-background border-y-2">
      <div
        className={`${WRAP} grid grid-cols-1 items-center gap-5 py-7 lg:grid-cols-[250px_1fr] lg:gap-8`}
      >
        <div>
          <h2 className="headline text-[34px] leading-[0.95]">
            {t("TITLE_A", { count: String(soft.length) })}
            <span className="serif-accent text-vermilion block text-[30px]">
              {t("TITLE_B")}
            </span>
          </h2>
          <p className="text-foreground/70 mt-2 font-mono text-[11px] tracking-[0.06em] uppercase">
            {t("LINE")}
          </p>
        </div>
        <ul className="flex flex-wrap gap-2.5">
          {sharp && (
            <li className="bg-foreground text-background flex items-center gap-2 rounded-full border-[1.5px] border-current py-[5px] pr-3.5 pl-[5px] text-[13px] font-bold">
              <VendorLogo
                vendorKey={sharp.book}
                size={26}
                className="rounded-full"
              />
              {bookName(sharp.book)}
              <span className="text-background/60 font-mono text-[10px] font-medium tracking-[0.1em] uppercase">
                {t("SHARP")}
              </span>
            </li>
          )}
          {sorted.map((b) => {
            const fresh =
              b.newest_seen_at !== null &&
              b.newest_seen_at !== undefined &&
              props.now - new Date(b.newest_seen_at).getTime() < FRESH_MS;
            return (
              <li
                key={b.book}
                className="border-foreground bg-card flex items-center gap-2 rounded-full border-[1.5px] py-[5px] pr-3.5 pl-[5px] text-[13px] font-bold"
              >
                <VendorLogo
                  vendorKey={b.book}
                  size={26}
                  className="rounded-full"
                />
                {bookName(b.book)}
                <LiveDot className={cn("size-1.5", !fresh && "invisible")} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
