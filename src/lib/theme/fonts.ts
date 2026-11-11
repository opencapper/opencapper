import {
  Anton,
  Barlow_Condensed,
  Bebas_Neue,
  Geist,
  Geist_Mono,
  Geist_Pixel,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Inter,
  Inter_Tight,
  JetBrains_Mono,
  Manrope,
  Oswald,
  Plus_Jakarta_Sans,
  Roboto_Mono,
  Space_Grotesk,
} from "next/font/google";

// The two defaults paint first load; preload only them.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "optional",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "optional",
});
// Weight 400 at the default ELSH axis is the Square cut.
const geistPixel = Geist_Pixel({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-geist-pixel",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "fallback",
  preload: false,
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "fallback",
  preload: false,
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "fallback",
  preload: false,
});
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "fallback",
  preload: false,
});
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "fallback",
  preload: false,
});
const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-ibm-plex-sans",
  display: "fallback",
  preload: false,
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "fallback",
  preload: false,
});
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow-condensed",
  display: "fallback",
  preload: false,
});
const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "fallback",
  preload: false,
});
const bebasNeue = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-bebas-neue",
  display: "fallback",
  preload: false,
});
const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "fallback",
  preload: false,
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex-mono",
  display: "fallback",
  preload: false,
});
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "fallback",
  preload: false,
});

export type FontKind = "sans" | "mono" | "display";

export type FontOption = {
  id: string;
  label: string;
  cssVar: string;
  varName: string;
  kinds: FontKind[];
};

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "geist",
    label: "Geist",
    cssVar: geist.variable,
    varName: "--font-geist",
    kinds: ["sans", "display"],
  },
  {
    id: "geist-mono",
    label: "Geist Mono",
    cssVar: geistMono.variable,
    varName: "--font-geist-mono",
    kinds: ["mono"],
  },
  {
    id: "geist-pixel-square",
    label: "Geist Pixel",
    cssVar: geistPixel.variable,
    varName: "--font-geist-pixel",
    kinds: ["display", "mono"],
  },
  {
    id: "inter",
    label: "Inter",
    cssVar: inter.variable,
    varName: "--font-inter",
    kinds: ["sans", "display"],
  },
  {
    id: "manrope",
    label: "Manrope",
    cssVar: manrope.variable,
    varName: "--font-manrope",
    kinds: ["sans", "display"],
  },
  {
    id: "plus-jakarta",
    label: "Plus Jakarta Sans",
    cssVar: plusJakarta.variable,
    varName: "--font-plus-jakarta",
    kinds: ["sans", "display"],
  },
  {
    id: "ibm-plex-sans",
    label: "IBM Plex Sans",
    cssVar: ibmPlexSans.variable,
    varName: "--font-ibm-plex-sans",
    kinds: ["sans", "display"],
  },
  {
    id: "space-grotesk",
    label: "Space Grotesk",
    cssVar: spaceGrotesk.variable,
    varName: "--font-space-grotesk",
    kinds: ["sans", "display"],
  },
  {
    id: "inter-tight",
    label: "Inter Tight",
    cssVar: interTight.variable,
    varName: "--font-inter-tight",
    kinds: ["display"],
  },
  {
    id: "barlow-condensed",
    label: "Barlow Condensed",
    cssVar: barlowCondensed.variable,
    varName: "--font-barlow-condensed",
    kinds: ["display"],
  },
  {
    id: "oswald",
    label: "Oswald",
    cssVar: oswald.variable,
    varName: "--font-oswald",
    kinds: ["display"],
  },
  {
    id: "bebas-neue",
    label: "Bebas Neue",
    cssVar: bebasNeue.variable,
    varName: "--font-bebas-neue",
    kinds: ["display"],
  },
  {
    id: "anton",
    label: "Anton",
    cssVar: anton.variable,
    varName: "--font-anton",
    kinds: ["display"],
  },
  {
    id: "jetbrains-mono",
    label: "JetBrains Mono",
    cssVar: jetbrainsMono.variable,
    varName: "--font-jetbrains-mono",
    kinds: ["mono"],
  },
  {
    id: "ibm-plex-mono",
    label: "IBM Plex Mono",
    cssVar: ibmPlexMono.variable,
    varName: "--font-ibm-plex-mono",
    kinds: ["mono"],
  },
  {
    id: "roboto-mono",
    label: "Roboto Mono",
    cssVar: robotoMono.variable,
    varName: "--font-roboto-mono",
    kinds: ["mono"],
  },
];

// Picker sections, in order; a font may sit in more than one.
export const FONT_GROUPS: Record<FontKind, readonly string[]> = {
  sans: [
    "geist",
    "inter",
    "manrope",
    "plus-jakarta",
    "ibm-plex-sans",
    "space-grotesk",
  ],
  display: [
    "geist",
    "inter-tight",
    "geist-pixel-square",
    "barlow-condensed",
    "oswald",
    "bebas-neue",
    "anton",
    "manrope",
  ],
  mono: [
    "geist-mono",
    "jetbrains-mono",
    "ibm-plex-mono",
    "roboto-mono",
    "geist-pixel-square",
  ],
};

// What globals.css paints when the theme leaves a font token unset.
export const DEFAULT_FONTS: Record<FontKind, string> = {
  sans: "geist",
  display: "geist",
  mono: "geist-mono",
};

export const allFontVariablesClass = FONT_OPTIONS.map((f) => f.cssVar).join(
  " ",
);
