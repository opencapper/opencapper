import { LOCALES } from "@/lib/config/constants";
import { fontsFor } from "@/lib/og/assets";
import {
  betCard,
  brandCard,
  gameCard,
  homeCard,
  OG_SECTIONS,
  sectionCard,
  type OgSection,
} from "@/lib/og/cards";
import { OG_HEIGHT, OG_WIDTH } from "@/lib/og/frame";
import { hasLocale } from "next-intl";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";

const CACHE = {
  live: "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
  fixed: "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
  fallback: "public, max-age=60, s-maxage=60",
} as const;

function isSection(value: string): value is OgSection {
  return (OG_SECTIONS as readonly string[]).includes(value);
}

async function card(
  template: string,
  locale: (typeof LOCALES)[number],
  id: string | null,
): Promise<ReactNode | null> {
  if (template === "home") return homeCard(locale);
  if (template === "game") return id ? gameCard(locale, id) : null;
  if (template === "bet") return id ? betCard(locale, id) : null;
  if (isSection(template)) return sectionCard(locale, template);
  return null;
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ template: string }> },
) {
  const template = (await ctx.params).template;
  const query = new URL(request.url).searchParams;
  const requested = query.get("locale");
  const locale = hasLocale(LOCALES, requested) ? requested : LOCALES[0];
  let node: ReactNode | null = null;
  try {
    node = await card(template, locale, query.get("id"));
  } catch (error) {
    console.error(`[og] ${template} card failed, serving brand card`, error);
  }
  const svg = await satori(node ?? (await brandCard(locale)), {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fontsFor(locale),
  });
  const png = new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
  const ttl = !node ? "fallback" : isSection(template) ? "fixed" : "live";
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": CACHE[ttl],
      "Cross-Origin-Resource-Policy": "cross-origin",
    },
  });
}
