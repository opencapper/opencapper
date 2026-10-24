import { sportGroup, type SportGroup } from "@/lib/config/sports";
import { svgImage } from "./assets";

// Paths of the site's Tabler (MIT), Lucide (ISC) and Phosphor (MIT) icons; app routes may not import react-dom/server.
type IconDef = { viewBox: number; fill?: boolean; paths: string[] };

const TROPHY: IconDef = {
  viewBox: 24,
  paths: [
    "M8 21l8 0",
    "M12 17l0 4",
    "M7 4l10 0",
    "M17 4v8a5 5 0 0 1 -10 0v-8",
    "M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
    "M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
  ],
};

const RUGBY: IconDef = {
  viewBox: 24,
  paths: ["M14 15h-4v6h4v-6", "M12 15v-4", "M8 21h8", "M19 3v8h-14v-8"],
};

const GLOVE: IconDef = {
  viewBox: 256,
  fill: true,
  paths: [
    "M168,16H120A56.06,56.06,0,0,0,64,72H56a32,32,0,0,0-32,32v29.19a16.09,16.09,0,0,0,3.51,10,8,8,0,0,0,.62.69L64,179.34V216a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V177.12l15.38-53.85a15.89,15.89,0,0,0,.62-4.39V72A56.06,56.06,0,0,0,168,16Zm40,102.88L192.31,173.8A7.85,7.85,0,0,0,192,176v40H80V176a8,8,0,0,0-2.38-5.69L40,133.12V104A16,16,0,0,1,56,88h8v16a8,8,0,0,0,16,0V72a40,40,0,0,1,40-40h48a40,40,0,0,1,40,40Zm-36.42,48.28L153.89,176l17.69,8.84a8,8,0,0,1-7.16,14.32L136,184.94l-28.42,14.22a8,8,0,1,1-7.16-14.32L118.11,176l-17.69-8.84a8,8,0,1,1,7.16-14.32L136,167.06l28.42-14.22a8,8,0,1,1,7.16,14.32Z",
  ],
};

const SPORTS = {
  americanfootball: {
    viewBox: 24,
    paths: [
      "M15 9l-6 6",
      "M10 12l2 2",
      "M12 10l2 2",
      "M8 21a5 5 0 0 0 -5 -5",
      "M16 3c-7.18 0 -13 5.82 -13 13a5 5 0 0 0 5 5c7.18 0 13 -5.82 13 -13a5 5 0 0 0 -5 -5",
      "M16 3a5 5 0 0 0 5 5",
    ],
  },
  basketball: {
    viewBox: 24,
    paths: [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M5.65 5.65l12.7 12.7",
      "M5.65 18.35l12.7 -12.7",
      "M12 3a9 9 0 0 0 9 9",
      "M3 12a9 9 0 0 1 9 9",
    ],
  },
  baseball: {
    viewBox: 24,
    paths: [
      "M5.636 18.364a9 9 0 1 0 12.728 -12.728a9 9 0 0 0 -12.728 12.728",
      "M12.495 3.02a9 9 0 0 1 -9.475 9.475",
      "M20.98 11.505a9 9 0 0 0 -9.475 9.475",
      "M9 9l2 2",
      "M13 13l2 2",
      "M11 7l2 1",
      "M7 11l1 2",
      "M16 11l1 2",
      "M11 16l2 1",
    ],
  },
  icehockey: {
    viewBox: 24,
    paths: [
      "M17 3l-7.4 14.2a2 2 0 0 1 -1.8 1.1h-4.8v-2.6h4",
      "M14 17a3.5 1.5 0 1 0 7 0a3.5 1.5 0 1 0 -7 0",
      "M14 17v2c0 .8 1.6 1.5 3.5 1.5s3.5 -.7 3.5 -1.5v-2",
    ],
  },
  soccer: {
    viewBox: 24,
    paths: [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M12 7l4.76 3.45l-1.76 5.55h-6l-1.76 -5.55l4.76 -3.45",
      "M12 7v-4m3 13l2.5 3m-.74 -8.55l3.74 -1.45m-11.44 7.05l-2.56 2.95m.74 -8.55l-3.74 -1.45",
    ],
  },
  tennis: {
    viewBox: 24,
    paths: [
      "M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
      "M6 5.3a9 9 0 0 1 0 13.4",
      "M18 5.3a9 9 0 0 0 0 13.4",
    ],
  },
  golf: {
    viewBox: 24,
    paths: [
      "M12 18v-15l7 4l-7 4",
      "M9 17.67c-.62 .36 -1 .82 -1 1.33c0 1.1 1.8 2 4 2s4 -.9 4 -2c0 -.5 -.38 -.97 -1 -1.33",
    ],
  },
  mma: GLOVE,
  boxing: GLOVE,
  cricket: {
    viewBox: 24,
    paths: [
      "M11.105 18.79l-1 .992a4.159 4.159 0 0 1 -6.038 -5.715l.157 -.166l8.282 -8.401l1.5 1.5l3.45 -3.391a2.08 2.08 0 0 1 3.057 2.815l-.116 .126l-3.391 3.45l1.5 1.5l-3.668 3.617",
      "M10.5 7.5l6 6",
      "M11 18a3 3 0 1 0 6 0a3 3 0 1 0 -6 0",
    ],
  },
  aussierules: RUGBY,
  rugby: RUGBY,
} satisfies Record<SportGroup, IconDef>;

const UI = {
  monitor: {
    viewBox: 24,
    paths: [
      "M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1 -2 2h-16a2 2 0 0 1 -2 -2v-10a2 2 0 0 1 2 -2z",
      "M8 21h8",
      "M12 17v4",
    ],
  },
  braces: {
    viewBox: 24,
    paths: [
      "M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1",
      "M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1",
    ],
  },
  bitcoin: {
    viewBox: 24,
    paths: [
      "M11.767 19.089c4.924.868 6.14-6.025 1.216-6.894m-1.216 6.894L5.86 18.047m5.908 1.042-.347 1.97m1.563-8.864c4.924.869 6.14-6.025 1.215-6.893m-1.215 6.893-3.94-.694m5.155-6.2L8.29 4.26m5.908 1.042.348-1.97M7.48 20.364l3.126-17.727",
    ],
  },
} satisfies Record<string, IconDef>;

export type UiIcon = keyof typeof UI;

function iconSvg(def: IconDef, color: string): string {
  const paint = def.fill
    ? `fill="${color}"`
    : `fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const paths = def.paths.map((d) => `<path d="${d}"/>`).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${def.viewBox} ${def.viewBox}" ${paint}>${paths}</svg>`;
}

export function sportIcon(
  sportKey: string,
  size: number,
  color: string,
): Promise<string | null> {
  const group = sportGroup(sportKey);
  const def = group ? SPORTS[group] : TROPHY;
  return svgImage(iconSvg(def, color), size);
}

export function uiIcon(
  name: UiIcon,
  size: number,
  color: string,
): Promise<string | null> {
  return svgImage(iconSvg(UI[name], color), size);
}
