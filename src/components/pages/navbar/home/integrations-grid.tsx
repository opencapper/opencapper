import { SectionTitle } from "@/components/elements/page/page-heading";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { BookStatus } from "@/lib/api/client";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import type { IconName } from "@/lib/config/icon-map";
import { bookName, getVendor } from "@/lib/config/vendor-registry";
import { ago, count, fractionLabel } from "@/lib/format";
import type { PlainTranslationKey } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

// Empty grid cells would show the hairline colour, so the last row is padded with background.
const FILL_MOBILE = ["hidden", "block col-span-1"];
const FILL_MD = ["md:hidden", "md:block md:col-span-1", "md:block md:col-span-2", "md:block md:col-span-3"];

const CELL = "group/card bg-card relative flex min-h-[132px] flex-col p-4 lg:p-5";

const GRID =
  "border-input/80 bg-input/80 grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4";

const HOVER = "group-hover/card:bg-muted/50 pointer-events-none absolute inset-0 transition-colors duration-200";

// A price is dropped when it cannot be reconfirmed within five minutes, so older than that means the feed is idle.
const FRESH_MS = 5 * 60 * 1000;

const UK_BRANDS = new Set(["coral", "ladbrokes", "williamhill", "skybet", "paddypower", "betfred", "betvictor"]);
const US_BRANDS = new Set(["fanduel", "draftkings", "caesars", "espnbet", "fanatics", "hardrock"]);

type Region = "uk" | "us" | "eu";

const REGION_LABEL = {
  uk: msg("LANDING.COVERAGE.REGION_UK"),
  us: msg("LANDING.COVERAGE.REGION_US"),
  eu: msg("LANDING.COVERAGE.REGION_EU"),
} satisfies Record<Region, PlainTranslationKey>;

function region(code: string): Region {
  if (code.endsWith("uk") || UK_BRANDS.has(code)) return "uk";
  if (/us[a-z]{2}$/.test(code) || US_BRANDS.has(code)) return "us";
  return "eu";
}

function isReference(book: BookStatus): boolean {
  const kind = getVendor(book.book)?.kind;
  return book.book === "pinnacle" || Boolean(book.commission || book.taker_fee) || kind === "exchange" || kind === "prediction";
}

function StatusChip(props: { live: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-[9px] tracking-wider uppercase",
        props.live ? "border-primary/25 text-foreground/80" : "border-input text-foreground/40",
      )}
    >
      {props.live && <span className="bg-success size-1.5 rounded-full" />}
      {props.label}
    </span>
  );
}

function GroupHeading(props: { title: string; body: string }) {
  return (
    <div className="mt-6 mb-3">
      <h3 className="text-foreground/90 text-[14px] font-medium">{props.title}</h3>
      <p className="text-foreground/55 mt-0.5 text-[12px] leading-relaxed">{props.body}</p>
    </div>
  );
}

function Fill(props: { items: number; cols?: 3 | 4 }) {
  const md = props.cols === 3 ? FILL_MD.slice(0, 3) : FILL_MD;
  const mdCols = props.cols ?? 4;
  return (
    <span
      aria-hidden
      className={cn(
        "bg-card",
        FILL_MOBILE[(2 - (props.items % 2)) % 2],
        md[(mdCols - (props.items % mdCols)) % mdCols],
      )}
    />
  );
}

function BookCell(props: { book: BookStatus; index: number; now: number; children: ReactNode; live: string; idle: string }) {
  const seen = props.book.newest_seen_at;
  const fresh = seen !== null && seen !== undefined && props.now - new Date(seen).getTime() < FRESH_MS;
  return (
    <Link href="/books" className={CELL}>
      <span aria-hidden className={HOVER} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="text-foreground/30 group-hover/card:text-foreground/50 font-mono text-[11px] tracking-wider transition-colors">
          {String(props.index).padStart(2, "0")}
        </span>
        <StatusChip live={fresh} label={fresh ? props.live : props.idle} />
      </div>
      <div className="text-foreground/80 relative mt-3 flex items-center gap-2">
        <VendorLogo vendorKey={props.book.book} size={22} />
      </div>
      <h4 className="text-foreground/90 relative mt-2.5 text-[13px] font-medium">{bookName(props.book.book)}</h4>
      <div className="text-foreground/55 relative mt-1 flex flex-col gap-0.5 font-mono text-[10px]">{props.children}</div>
    </Link>
  );
}

export async function CoverageGrid(props: { books: BookStatus[]; now: number }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const byQuotes = props.books.toSorted((a, b) => b.quotes - a.quotes);
  const books = byQuotes.filter((b) => !isReference(b));
  const reference = byQuotes.filter(isReference);
  const live = t("LANDING.COVERAGE.LIVE");
  const idle = t("LANDING.COVERAGE.IDLE");

  const lines = (book: BookStatus) => (
    <>
      <span className="tabular">{t("LANDING.COVERAGE.PRICES", { count: book.quotes })}</span>
      {book.book !== "pinnacle" && (
        <span className="tabular">{t("LANDING.COVERAGE.MATCHED", { count: book.matched_events })}</span>
      )}
      {book.newest_seen_at && (
        <span className="text-foreground/40">{t("LANDING.COVERAGE.SEEN", { ago: ago(book.newest_seen_at, props.now, locale) })}</span>
      )}
    </>
  );

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.COVERAGE.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 text-sm leading-relaxed sm:text-[15px]">{t("LANDING.COVERAGE.BODY")}</p>

      <GroupHeading title={t("LANDING.COVERAGE.REFERENCE_TITLE")} body={t("LANDING.COVERAGE.REFERENCE_BODY")} />
      <div className={GRID}>
        {reference.map((book, i) => (
          <BookCell key={book.book} book={book} index={i + 1} now={props.now} live={live} idle={idle}>
            <span className="text-foreground/75">
              {book.book === "pinnacle"
                ? t("LANDING.COVERAGE.ROLE_SHARP")
                : book.commission
                  ? t("LANDING.COVERAGE.ROLE_COMMISSION", { fee: fractionLabel(book.commission) })
                  : book.taker_fee
                    ? t("LANDING.COVERAGE.ROLE_TAKER", { fee: fractionLabel(book.taker_fee) })
                    : t("LANDING.COVERAGE.ROLE_EXCHANGE")}
            </span>
            {lines(book)}
          </BookCell>
        ))}
        <Fill items={reference.length} />
      </div>

      <GroupHeading title={t("LANDING.COVERAGE.BOOKS_TITLE")} body={t("LANDING.COVERAGE.BOOKS_BODY")} />
      <div className={cn(GRID, books.length % 3 === 0 && "md:grid-cols-3")}>
        {books.map((book, i) => (
          <BookCell
            key={book.book}
            book={book}
            index={reference.length + i + 1}
            now={props.now}
            live={live}
            idle={idle}
          >
            <span className="text-foreground/75">{t(REGION_LABEL[region(book.book)])}</span>
            {lines(book)}
          </BookCell>
        ))}
        <Fill items={books.length} cols={books.length % 3 === 0 ? 3 : 4} />
      </div>
      <p className="text-foreground/40 mt-3 text-[11px] leading-relaxed">
        {t("LANDING.COVERAGE.FOOTNOTE", { total: count(props.books.length, locale) })}
      </p>
    </section>
  );
}

type Tool = {
  key: string;
  icon: IconName;
  title: PlainTranslationKey;
  body: PlainTranslationKey;
  href: string;
  live: boolean;
};

const TOOLS: Tool[] = [
  { key: "value", icon: "trending-up", title: msg("NAV.VALUE_BETS"), body: msg("LANDING.TOOLS.VALUE_BODY"), href: "/value-bets", live: true },
  { key: "arbs", icon: "scale", title: msg("NAV.ARBS"), body: msg("LANDING.TOOLS.ARBS_BODY"), href: "/arbs", live: true },
  { key: "odds", icon: "table", title: msg("NAV.ODDS"), body: msg("LANDING.TOOLS.ODDS_BODY"), href: "/games", live: true },
  { key: "tracker", icon: "wallet", title: msg("NAV.TRACKER"), body: msg("LANDING.TOOLS.TRACKER_BODY"), href: "/tracker", live: true },
  { key: "calc", icon: "calculator", title: msg("NAV.TOOLS"), body: msg("LANDING.TOOLS.CALC_BODY"), href: "/tools", live: true },
  { key: "discord", icon: "brand-discord", title: msg("LANDING.TOOLS.DISCORD_TITLE"), body: msg("LANDING.TOOLS.DISCORD_BODY"), href: "discord", live: false },
];

function ToolLink(props: { href: string; children: ReactNode }) {
  if (props.href === "discord") {
    return (
      <a href={env.discordInviteUrl} target="_blank" rel="noopener noreferrer" className={CELL}>
        {props.children}
      </a>
    );
  }
  return (
    <Link href={props.href} className={CELL}>
      {props.children}
    </Link>
  );
}

export async function ToolsGrid() {
  const t = await getTranslations();

  return (
    <section className="mb-12">
      <SectionTitle>{t("LANDING.TOOLS.TITLE")}</SectionTitle>
      <p className="text-foreground/65 mt-3 mb-6 text-sm leading-relaxed sm:text-[15px]">{t("LANDING.TOOLS.BODY")}</p>
      <div className={cn(GRID, "md:grid-cols-3")}>
        {TOOLS.map((tool, i) => (
          <ToolLink key={tool.key} href={tool.href}>
            <span aria-hidden className={HOVER} />
            <div className="relative flex items-center justify-between gap-2">
              <span className="text-foreground/30 group-hover/card:text-foreground/50 font-mono text-[11px] tracking-wider transition-colors">
                {String(i + 1).padStart(2, "0")}
              </span>
              <StatusChip live={tool.live} label={tool.live ? t("LANDING.TOOLS.LIVE") : t("LANDING.SOON")} />
            </div>
            <div className={cn("relative mt-3 flex items-center gap-2", tool.live ? "text-foreground/80" : "text-foreground/50")}>
              <Icon name={tool.icon} className="size-5" />
            </div>
            <h4 className="text-foreground/90 relative mt-2.5 text-[13px] font-medium">{t(tool.title)}</h4>
            <p className="text-foreground/55 relative mt-1 text-[12px] leading-relaxed">{t(tool.body)}</p>
          </ToolLink>
        ))}
        <Fill items={TOOLS.length} cols={3} />
      </div>
    </section>
  );
}
