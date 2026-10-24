import { SectionTitle } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import { env } from "@/lib/config/env";
import type { IconName } from "@/lib/config/icon-map";
import type { PlainTranslationKey } from "@/lib/types";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { type VendorKey, vendorName } from "@/lib/config/vendor-registry";
import { cn } from "@/lib/utils";
import { getTranslations } from "next-intl/server";

type Glyph = IconName | { vendor: VendorKey };

type Integration = {
  key: string;
  glyphs: Glyph[];
  title: PlainTranslationKey;
  body: PlainTranslationKey;
  live: boolean;
};

type Group = {
  key: string;
  title: PlainTranslationKey;
  body: PlainTranslationKey;
  items: Integration[];
};

const GROUPS: Group[] = [
  {
    key: "post",
    title: msg("LANDING.INTEGRATIONS.GROUP_POST_TITLE"),
    body: msg("LANDING.INTEGRATIONS.GROUP_POST_BODY"),
    items: [
      {
        key: "discord",
        glyphs: [{ vendor: "discord" }],
        title: msg("LANDING.INTEGRATIONS.DISCORD_TITLE"),
        body: msg("LANDING.INTEGRATIONS.DISCORD_BODY"),
        live: true,
      },
      {
        key: "telegram",
        glyphs: [{ vendor: "telegram" }],
        title: msg("LANDING.INTEGRATIONS.TELEGRAM_TITLE"),
        body: msg("LANDING.INTEGRATIONS.TELEGRAM_BODY"),
        live: true,
      },
      {
        key: "web",
        glyphs: ["monitor"],
        title: msg("LANDING.INTEGRATIONS.WEB_TITLE"),
        body: msg("LANDING.INTEGRATIONS.WEB_BODY"),
        live: true,
      },
      {
        key: "api",
        glyphs: ["braces"],
        title: msg("LANDING.INTEGRATIONS.API_TITLE"),
        body: msg("LANDING.INTEGRATIONS.API_BODY"),
        live: true,
      },
      {
        key: "x",
        glyphs: [{ vendor: "x" }],
        title: msg("LANDING.INTEGRATIONS.X_TITLE"),
        body: msg("LANDING.INTEGRATIONS.X_BODY"),
        live: false,
      },
      {
        key: "reddit",
        glyphs: [{ vendor: "reddit" }],
        title: msg("LANDING.INTEGRATIONS.REDDIT_TITLE"),
        body: msg("LANDING.INTEGRATIONS.REDDIT_BODY"),
        live: false,
      },
      {
        key: "whatsapp",
        glyphs: [{ vendor: "whatsapp" }],
        title: msg("LANDING.INTEGRATIONS.WHATSAPP_TITLE"),
        body: msg("LANDING.INTEGRATIONS.WHATSAPP_BODY"),
        live: false,
      },
      {
        key: "youtube",
        glyphs: [{ vendor: "youtube" }],
        title: msg("LANDING.INTEGRATIONS.YOUTUBE_TITLE"),
        body: msg("LANDING.INTEGRATIONS.YOUTUBE_BODY"),
        live: false,
      },
      {
        key: "instagram",
        glyphs: [{ vendor: "instagram" }],
        title: msg("LANDING.INTEGRATIONS.INSTAGRAM_TITLE"),
        body: msg("LANDING.INTEGRATIONS.INSTAGRAM_BODY"),
        live: false,
      },
      {
        key: "tiktok",
        glyphs: [{ vendor: "tiktok" }],
        title: msg("LANDING.INTEGRATIONS.TIKTOK_TITLE"),
        body: msg("LANDING.INTEGRATIONS.TIKTOK_BODY"),
        live: false,
      },
      {
        key: "slack",
        glyphs: [{ vendor: "slack" }],
        title: msg("LANDING.INTEGRATIONS.SLACK_TITLE"),
        body: msg("LANDING.INTEGRATIONS.SLACK_BODY"),
        live: false,
      },
      {
        key: "mobile",
        glyphs: [{ vendor: "apple" }, { vendor: "android" }],
        title: msg("LANDING.INTEGRATIONS.MOBILE_TITLE"),
        body: msg("LANDING.INTEGRATIONS.MOBILE_BODY"),
        live: false,
      },
      {
        key: "webhooks",
        glyphs: [{ vendor: "zapier" }],
        title: msg("LANDING.INTEGRATIONS.WEBHOOKS_TITLE"),
        body: msg("LANDING.INTEGRATIONS.WEBHOOKS_BODY"),
        live: false,
      },
    ],
  },
  {
    key: "sell",
    title: msg("LANDING.INTEGRATIONS.GROUP_SELL_TITLE"),
    body: msg("LANDING.INTEGRATIONS.GROUP_SELL_BODY"),
    items: [
      {
        key: "whop",
        glyphs: [{ vendor: "whop" }],
        title: msg("LANDING.INTEGRATIONS.WHOP_TITLE"),
        body: msg("LANDING.INTEGRATIONS.WHOP_BODY"),
        live: false,
      },
      {
        key: "winible",
        glyphs: [{ vendor: "winible" }],
        title: msg("LANDING.INTEGRATIONS.WINIBLE_TITLE"),
        body: msg("LANDING.INTEGRATIONS.WINIBLE_BODY"),
        live: false,
      },
      {
        key: "dubclub",
        glyphs: [{ vendor: "dubclub" }],
        title: msg("LANDING.INTEGRATIONS.DUBCLUB_TITLE"),
        body: msg("LANDING.INTEGRATIONS.DUBCLUB_BODY"),
        live: false,
      },
      {
        key: "patreon",
        glyphs: [{ vendor: "patreon" }],
        title: msg("LANDING.INTEGRATIONS.PATREON_TITLE"),
        body: msg("LANDING.INTEGRATIONS.PATREON_BODY"),
        live: false,
      },
    ],
  },
  {
    key: "history",
    title: msg("LANDING.INTEGRATIONS.GROUP_HISTORY_TITLE"),
    body: msg("LANDING.INTEGRATIONS.GROUP_HISTORY_BODY"),
    items: [
      {
        key: "polymarket",
        glyphs: [{ vendor: "polymarket" }],
        title: msg("LANDING.INTEGRATIONS.POLYMARKET_TITLE"),
        body: msg("LANDING.INTEGRATIONS.POLYMARKET_BODY"),
        live: true,
      },
      {
        key: "kalshi",
        glyphs: [{ vendor: "kalshi" }],
        title: msg("LANDING.INTEGRATIONS.KALSHI_TITLE"),
        body: msg("LANDING.INTEGRATIONS.KALSHI_BODY"),
        live: false,
      },
      {
        key: "pikkit",
        glyphs: [{ vendor: "pikkit" }],
        title: msg("LANDING.INTEGRATIONS.PIKKIT_TITLE"),
        body: msg("LANDING.INTEGRATIONS.PIKKIT_BODY"),
        live: false,
      },
      {
        key: "juicereel",
        glyphs: [{ vendor: "juicereel" }],
        title: msg("LANDING.INTEGRATIONS.JUICE_REEL_TITLE"),
        body: msg("LANDING.INTEGRATIONS.JUICE_REEL_BODY"),
        live: false,
      },
      {
        key: "betmma",
        glyphs: [{ vendor: "betmma" }],
        title: msg("LANDING.INTEGRATIONS.BETMMA_TITLE"),
        body: msg("LANDING.INTEGRATIONS.BETMMA_BODY"),
        live: false,
      },
      {
        key: "tipstrr",
        glyphs: [{ vendor: "tipstrr" }],
        title: msg("LANDING.INTEGRATIONS.TIPSTRR_TITLE"),
        body: msg("LANDING.INTEGRATIONS.TIPSTRR_BODY"),
        live: false,
      },
      {
        key: "blogabet",
        glyphs: [{ vendor: "blogabet" }],
        title: msg("LANDING.INTEGRATIONS.BLOGABET_TITLE"),
        body: msg("LANDING.INTEGRATIONS.BLOGABET_BODY"),
        live: false,
      },
      {
        key: "actionnetwork",
        glyphs: [{ vendor: "actionnetwork" }],
        title: msg("LANDING.INTEGRATIONS.ACTION_NETWORK_TITLE"),
        body: msg("LANDING.INTEGRATIONS.ACTION_NETWORK_BODY"),
        live: false,
      },
    ],
  },
];

const BOOKS: VendorKey[] = [
  "draftkings",
  "fanduel",
  "betmgm",
  "williamhill_us",
  "betfair",
  "tipico_de",
  "bet365",
  "pinnacle",
  "prizepicks",
  "underdog",
  "novig",
];

// Empty grid cells would show the hairline colour, so the last row is padded with background.
const FILL_MOBILE = ["hidden", "block col-span-1"];
const FILL_MD = [
  "md:hidden",
  "md:block md:col-span-1",
  "md:block md:col-span-2",
  "md:block md:col-span-3",
];

function glyphKey(glyph: Glyph) {
  return typeof glyph === "string" ? glyph : glyph.vendor;
}

function GlyphIcon(props: { glyph: Glyph; size?: number }) {
  if (typeof props.glyph === "string")
    return <Icon name={props.glyph} className="size-5" />;
  return <VendorLogo vendorKey={props.glyph.vendor} size={props.size ?? 20} />;
}

function StatusChip(props: { live: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5 font-mono text-[9px] tracking-wider uppercase",
        props.live
          ? "border-primary/25 text-foreground/80"
          : "border-input text-foreground/40",
      )}
    >
      {props.live && <span className="bg-pick-win size-1.5 rounded-full" />}
      {props.label}
    </span>
  );
}

function GroupHeading(props: { title: string; body: string }) {
  return (
    <div className="mt-6 mb-3">
      <h3 className="text-foreground/90 text-[14px] font-medium">
        {props.title}
      </h3>
      <p className="text-foreground/55 mt-0.5 text-[12px] leading-relaxed">
        {props.body}
      </p>
    </div>
  );
}

const CELL =
  "group/card bg-card relative flex min-h-[132px] flex-col p-4 lg:p-5";

const GRID =
  "border-input/80 bg-input/80 grid grid-cols-2 gap-px overflow-hidden rounded-lg border md:grid-cols-4";

const HOVER =
  "group-hover/card:bg-muted/50 pointer-events-none absolute inset-0 transition-colors duration-200";

export async function IntegrationsGrid() {
  const t = await getTranslations();
  const live = t("LANDING.INTEGRATIONS.LIVE");
  const soon = t("LANDING.INTEGRATIONS.SOON");
  const offsets = GROUPS.map((_, g) =>
    GROUPS.slice(0, g).reduce((sum, group) => sum + group.items.length, 0),
  );

  return (
    <section className="mb-12">
      <div>
        <SectionTitle>{t("LANDING.INTEGRATIONS.TITLE")}</SectionTitle>
      </div>
      {GROUPS.map((group, g) => (
        <div key={group.key}>
          <GroupHeading title={t(group.title)} body={t(group.body)} />
          <div className={GRID}>
            {group.items.map((item, i) => (
              <div key={item.key} className={CELL}>
                <span aria-hidden className={HOVER} />
                <div className="relative flex items-center justify-between gap-2">
                  <span className="text-foreground/30 group-hover/card:text-foreground/50 font-mono text-[11px] tracking-wider transition-colors">
                    {String(offsets[g] + i + 1).padStart(2, "0")}
                  </span>
                  <StatusChip
                    live={item.live}
                    label={item.live ? live : soon}
                  />
                </div>
                <div
                  className={cn(
                    "relative mt-3 flex items-center gap-2",
                    item.live ? "text-foreground/80" : "text-foreground/50",
                  )}
                >
                  {item.glyphs.map((glyph) => (
                    <GlyphIcon key={glyphKey(glyph)} glyph={glyph} />
                  ))}
                </div>
                <h4 className="text-foreground/90 relative mt-2.5 text-[13px] font-medium">
                  {t(item.title)}
                </h4>
                <p className="text-foreground/55 relative mt-1 text-[12px] leading-relaxed">
                  {t(item.body)}
                </p>
              </div>
            ))}
            <span
              aria-hidden
              className={cn(
                "bg-card",
                FILL_MOBILE[(2 - (group.items.length % 2)) % 2],
                FILL_MD[(4 - (group.items.length % 4)) % 4],
              )}
            />
          </div>
        </div>
      ))}
      <GroupHeading
        title={t("LANDING.INTEGRATIONS.GROUP_BOOKS_TITLE")}
        body={t("LANDING.INTEGRATIONS.GROUP_BOOKS_BODY")}
      />
      <div className="border-input/80 bg-input/80 grid gap-px overflow-hidden rounded-lg border">
        <div className="group/card bg-card relative flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
          <span aria-hidden className={HOVER} />
          <ul className="text-foreground/50 relative flex flex-wrap items-center gap-x-4 gap-y-2">
            {BOOKS.map((book) => (
              <li key={book} className="flex items-center gap-1.5">
                <VendorLogo vendorKey={book} size={18} />
                <span className="font-mono text-[10px] tracking-wider">
                  {vendorName(book)}
                </span>
              </li>
            ))}
          </ul>
          <div className="relative flex items-center gap-3 md:max-w-[46%]">
            <p className="text-foreground/55 text-[12px] leading-relaxed">
              {t("LANDING.INTEGRATIONS.BOOKS_BODY")}
            </p>
            <StatusChip live={false} label={soon} />
          </div>
        </div>
        <a
          href={`${env.githubUrl}/issues/new`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(CELL, "min-h-0 justify-center")}
        >
          <span aria-hidden className={HOVER} />
          <span className="text-foreground/90 relative text-[13px] font-medium">
            {t("LANDING.INTEGRATIONS.REQUEST_TITLE")}
          </span>
          <span className="text-foreground/55 relative mt-1 text-[12px] leading-relaxed">
            {t("LANDING.INTEGRATIONS.REQUEST_BODY")}
          </span>
          <span className="label-mono text-foreground/75 group-hover/card:text-foreground relative mt-3 inline-flex items-center gap-1.5 text-[10px] transition-colors">
            <Icon name="brand-github" className="size-3" />
            {t("LANDING.INTEGRATIONS.REQUEST_LINK")}
            <Icon
              name="arrow-up-right"
              className="size-3 transition-transform group-hover/card:translate-x-0.5"
            />
          </span>
        </a>
      </div>
      <p className="text-foreground/40 mt-3 text-[11px] leading-relaxed">
        {t("LANDING.INTEGRATIONS.FOOTNOTE")}
      </p>
    </section>
  );
}
