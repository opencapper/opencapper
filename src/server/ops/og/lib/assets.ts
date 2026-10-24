import { getVendor } from "@/lib/config/vendor-registry";
import { readFile } from "node:fs/promises";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "next-intl";
import type { SatoriOptions } from "satori";
import sharp from "sharp";

export const FONT_SANS = "Geist";
export const FONT_MONO = "Geist Mono";

// Satori reads woff but not woff2; both subsets so accented names keep the brand face.
const SUBSETS = ["latin", "latin-ext"];
// The compiled binary extracts traced packages under .next/node_modules.
const fontsourceRoots = [
  join(process.cwd(), "node_modules", "@fontsource"),
  join(process.cwd(), ".next", "node_modules", "@fontsource"),
];
const fontsourceDir =
  fontsourceRoots.find((dir) => existsSync(dir)) ?? fontsourceRoots[0];

function fonts(
  name: string,
  pkg: "geist" | "geist-mono",
  weight: 400 | 500 | 600,
): SatoriOptions["fonts"] {
  return SUBSETS.map((subset) => ({
    name,
    data: readFileSync(
      join(
        fontsourceDir,
        pkg,
        "files",
        `${pkg}-${subset}-${weight}-normal.woff`,
      ),
    ),
    weight,
    style: "normal",
  }));
}

export const FONTS: SatoriOptions["fonts"] = [
  ...fonts(FONT_SANS, "geist", 400),
  ...fonts(FONT_SANS, "geist", 500),
  ...fonts(FONT_SANS, "geist", 600),
  ...fonts(FONT_MONO, "geist-mono", 400),
  ...fonts(FONT_MONO, "geist-mono", 500),
];

let japaneseFonts: SatoriOptions["fonts"] | null = null;

// Satori has no system fallback and Geist has no kana or kanji; the fontsource subsets load only for ja.
export function fontsFor(locale: Locale): SatoriOptions["fonts"] {
  if (locale !== "ja") return FONTS;
  const dir = join(fontsourceDir, "noto-sans-jp", "files");
  japaneseFonts ??= [
    ...FONTS,
    ...readdirSync(dir)
      .filter((file) => file.endsWith("-400-normal.woff"))
      .map(
        // Satori keeps one font per name and weight, so each unicode range subset needs its own name.
        (file): SatoriOptions["fonts"][number] => ({
          name: `Noto Sans JP ${file}`,
          data: readFileSync(join(dir, file)),
          weight: 400,
          style: "normal",
        }),
      ),
  ];
  return japaneseFonts;
}

// Remote hosts whose images we already store; nothing else is fetched.
const REMOTE_HOSTS = new Set([
  "r2.thesportsdb.com",
  "www.thesportsdb.com",
  "cdn.discordapp.com",
]);
const REMOTE_TIMEOUT_MS = 2_500;
const CACHE_MAX = 400;

const cache = new Map<string, Promise<string | null>>();

function cached(
  key: string,
  load: () => Promise<string | null>,
): Promise<string | null> {
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size >= CACHE_MAX) cache.clear();
  const value = load().catch(() => null);
  cache.set(key, value);
  return value;
}

// Satori and librsvg both handle a PNG reliably; a nested SVG image they do not.
async function toPng(
  input: Buffer,
  size: number,
  tint?: string,
): Promise<string> {
  const scaled = sharp(input, { density: 300 })
    .resize(size * 2, size * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha();
  let png: Buffer;
  if (tint) {
    const alpha = await scaled.extractChannel(3).toBuffer();
    png = await sharp({
      create: {
        width: size * 2,
        height: size * 2,
        channels: 3,
        background: tint,
      },
    })
      .joinChannel(alpha)
      .png()
      .toBuffer();
  } else {
    png = await scaled.png().toBuffer();
  }
  return `data:image/png;base64,${png.toString("base64")}`;
}

export function vendorImage(
  key: string,
  size: number,
  tint?: string,
): Promise<string | null> {
  const vendor = getVendor(key);
  const logo = vendor?.logo;
  if (!logo) return Promise.resolve(null);
  const color = tint ?? (vendor.shape === "mono" ? "#ffffff" : undefined);
  return cached(`vendor:${logo}:${size}:${color ?? ""}`, async () =>
    toPng(await readFile(join(process.cwd(), "public", logo)), size, color),
  );
}

export function remoteImage(
  url: string | null | undefined,
  size: number,
): Promise<string | null> {
  if (!url) return Promise.resolve(null);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return Promise.resolve(null);
  }
  if (parsed.protocol !== "https:" || !REMOTE_HOSTS.has(parsed.hostname))
    return Promise.resolve(null);
  return cached(`remote:${url}:${size}`, async () => {
    const res = await fetch(parsed, {
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return toPng(Buffer.from(await res.arrayBuffer()), size);
  });
}

export function svgImage(svg: string, size: number): Promise<string | null> {
  return cached(`svg:${size}:${svg}`, () => toPng(Buffer.from(svg), size));
}
