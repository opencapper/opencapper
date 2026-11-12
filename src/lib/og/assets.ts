import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Locale } from "next-intl";
import type { SatoriOptions } from "satori";
import sharp from "sharp";

export const FONT_SANS = "Manrope";
export const FONT_MONO = "DM Mono";
export const FONT_DISPLAY = "Anton";
export const FONT_SERIF = "Instrument Serif";
export const FONT_NUM = "Barlow Condensed";

// Satori reads woff but not woff2; both subsets so accented names keep the brand face.
const SUBSETS = ["latin", "latin-ext"];
// The compiled binary extracts traced packages under .next/node_modules.
const fontsourceRoots = [
  join(process.cwd(), "node_modules", "@fontsource"),
  join(process.cwd(), ".next", "node_modules", "@fontsource"),
];
const fontsourceDir =
  fontsourceRoots.find((dir) => existsSync(dir)) ?? fontsourceRoots[0];

type Weight = 400 | 500 | 700 | 800;

function fonts(
  name: string,
  pkg: string,
  weight: Weight,
  style: "normal" | "italic" = "normal",
): SatoriOptions["fonts"] {
  return SUBSETS.map((subset) => ({
    name,
    data: readFileSync(
      join(
        fontsourceDir,
        pkg,
        "files",
        `${pkg}-${subset}-${weight}-${style}.woff`,
      ),
    ),
    weight,
    style,
  }));
}

let baseFonts: SatoriOptions["fonts"] | null = null;
let japaneseFonts: SatoriOptions["fonts"] | null = null;

// Satori has no system fallback and the brand faces have no kana or kanji; the fontsource subsets load only for ja.
export function fontsFor(locale: Locale): SatoriOptions["fonts"] {
  baseFonts ??= [
    ...fonts(FONT_SANS, "manrope", 500),
    ...fonts(FONT_SANS, "manrope", 800),
    ...fonts(FONT_MONO, "dm-mono", 400),
    ...fonts(FONT_MONO, "dm-mono", 500),
    ...fonts(FONT_DISPLAY, "anton", 400),
    ...fonts(FONT_SERIF, "instrument-serif", 400, "italic"),
    ...fonts(FONT_NUM, "barlow-condensed", 700),
  ];
  if (locale !== "ja") return baseFonts;
  const dir = join(fontsourceDir, "noto-sans-jp", "files");
  japaneseFonts ??= [
    ...baseFonts,
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

// Only the hosts next.config already allows for team images; nothing else is fetched.
const REMOTE_HOSTS = new Set(["r2.thesportsdb.com", "www.thesportsdb.com"]);
const REMOTE_TIMEOUT_MS = 2_500;
const CACHE_MAX = 400;

const cache = new Map<string, Promise<string | null>>();

// Satori and librsvg both handle a PNG reliably; a remote webp or a nested SVG they do not.
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
  const key = `${url}:${size}`;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size >= CACHE_MAX) cache.clear();
  const value = (async () => {
    const res = await fetch(parsed, {
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const png = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(size * 2, size * 2, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  })().catch(() => null);
  cache.set(key, value);
  return value;
}
