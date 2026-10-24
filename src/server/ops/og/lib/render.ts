import type { Locale } from "next-intl";
import type { ReactNode } from "react";
import satori from "satori";
import sharp from "sharp";
import { fontsFor } from "./assets";
import { OG_HEIGHT, OG_WIDTH } from "./theme";

export async function renderPng(
  node: ReactNode,
  locale: Locale,
): Promise<Uint8Array<ArrayBuffer>> {
  const svg = await satori(node, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: fontsFor(locale),
  });
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer());
}
