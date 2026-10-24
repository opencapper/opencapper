import { useId, type ReactNode } from "react";

type GlyphProps = { className?: string };

// useId output carries characters that break url(#id) references.
function useGlyphId() {
  return useId().replace(/[^a-zA-Z0-9_-]/g, "");
}

function Svg(props: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={props.className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {props.children}
    </svg>
  );
}

// Key light from the upper left: lit side, core shadow, then a lifted rim for reflected light.
function SphereShade(props: {
  id: string;
  cx: number;
  cy: number;
  r: number;
  core: number;
  gloss: number;
}) {
  const r = props.r;
  return (
    <>
      <radialGradient id={`${props.id}l`} cx="0.36" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
        <stop offset="0.3" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.62" stopColor="#000" stopOpacity={0.06} />
        <stop offset="0.9" stopColor="#000" stopOpacity={props.core} />
        <stop offset="1" stopColor="#000" stopOpacity={props.core * 0.55} />
      </radialGradient>
      <radialGradient id={`${props.id}e`}>
        <stop offset="0.8" stopColor="#000" stopOpacity={0} />
        <stop offset="1" stopColor="#000" stopOpacity={0.24} />
      </radialGradient>
      <radialGradient id={`${props.id}g`}>
        <stop offset="0" stopColor="#fff" stopOpacity={props.gloss} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <circle cx={props.cx} cy={props.cy} r={r} fill={`url(#${props.id}l)`} />
      <circle cx={props.cx} cy={props.cy} r={r} fill={`url(#${props.id}e)`} />
      <ellipse
        cx={props.cx - r * 0.36}
        cy={props.cy - r * 0.42}
        rx={r * 0.36}
        ry={r * 0.2}
        transform={`rotate(-36 ${props.cx - r * 0.36} ${props.cy - r * 0.42})`}
        fill={`url(#${props.id}g)`}
      />
    </>
  );
}

function Ball(props: {
  id: string;
  base: string;
  core: number;
  gloss: number;
  children: ReactNode;
}) {
  return (
    <>
      <clipPath id={`${props.id}c`}>
        <circle cx="12" cy="12" r="10.6" />
      </clipPath>
      <circle cx="12" cy="12" r="10.6" fill={props.base} />
      <g clipPath={`url(#${props.id}c)`}>{props.children}</g>
      <SphereShade
        id={props.id}
        cx={12}
        cy={12}
        r={10.6}
        core={props.core}
        gloss={props.gloss}
      />
    </>
  );
}

export function SoccerGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} base="#f3f3f0" core={0.5} gloss={0.75}>
        <path
          d="M9.5 20.5L9.3 19.8L9.1 19.1L8.9 18.2L8.8 17.3M6.9 21L6 20.5L5.2 19.8L4.4 19.1L3.7 18.3M13.5 21.4L14.3 21L15.2 20.5L16 19.9L16.8 19.2M8.2 4.2L9.2 4.1L10.2 4.1L11.3 4.2L12.3 4.4M7.4 2.7L8.1 2.2L8.9 1.9L9.8 1.6M2.9 7.8L2.5 8.7L2.1 9.7L1.8 10.7L1.7 11.7M5.5 7.3L5.7 8.1L6 9L6.4 9.9L6.8 10.7M22.4 11.2L22.3 11.9L22 12.7L21.7 13.4L21.2 14.1M21.2 7.2L20.7 6.8L20.1 6.4L19.5 6.1L18.8 5.9M14.6 1.8L14.9 2L15.1 2.3L15.3 2.7L15.5 3.2M20 18.9L20.1 18.7L20.1 18.4L20 18M3 15.1L3.5 15.1L4.1 15L4.8 14.8L5.5 14.7M12.1 15.1L13.1 15.4L14.1 15.6L15.1 15.8L16.1 16M10.8 11L11.5 10.2L12.2 9.4L12.9 8.6L13.6 7.9M17.6 8.8L18 9.8L18.3 10.8L18.6 11.8L18.8 12.9"
          stroke="#8c8c88"
          strokeWidth="0.35"
        />
        <path
          d="M9.5 20.5L8.6 20.8L7.7 21L6.9 21L7.7 21.6L8.5 22L8.6 22.1L12.1 22.6L13.4 22.5L13.5 22.3L13.5 22L13.5 21.4L12.2 21.3L10.8 21ZM8.2 4.2L7.9 3.5L7.6 3L7.4 2.7L6.2 3.3L5.1 4.1L4.1 4.9L3.6 5.8L3.2 6.8L2.9 7.8L3.6 7.6L4.5 7.4L5.5 7.3L6.3 6.2L7.2 5.1ZM22.4 11.2L22.6 11.6L22.6 11.7L20.9 6.2L21.1 6.6L21.2 7.2L21.8 8.4L22.2 9.8ZM14.6 1.8L15.4 1.9L11.9 1.4L11.9 1.4L13.3 1.5ZM1.7 11.7L1.4 12.1L1.4 12.3L3.1 17.8L3.2 17.9L3.7 18.3L3.3 17.4L3 16.3L3 15.1L2.4 14L1.9 12.9ZM6.8 10.7L6.2 12.1L5.8 13.4L5.5 14.7L6.5 15.6L7.6 16.5L8.8 17.3L9.8 16.7L11 15.9L12.1 15.1L11.6 13.8L11.2 12.4L10.8 11L9.4 10.9L8.1 10.8ZM18.8 5.9L17.8 4.9L16.7 4L15.5 3.2L14.5 3.5L13.4 3.9L12.3 4.4L12.7 5.5L13.2 6.6L13.6 7.9L15 8.1L16.3 8.4L17.6 8.8L18.1 7.8L18.5 6.8ZM18.8 12.9L18 14L17.1 15L16.1 16L16.4 17.2L16.6 18.3L16.8 19.2L18 18.9L19 18.5L20 18L20.6 16.8L21 15.5L21.2 14.1L20.6 13.7L19.8 13.3Z"
          fill="#1c1c1f"
        />
      </Ball>
    </Svg>
  );
}

export function BasketballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} base="#d8641f" core={0.55} gloss={0.35}>
        <path
          d="M11.4 1.4L11.8 1.5L12.2 1.6L12.6 1.8L13 2.1L13.3 2.5L13.7 2.9L14.1 3.4L14.4 4L14.7 4.6L15 5.3L15.3 6L15.6 6.8L15.8 7.6L16 8.5L16.2 9.3L16.3 10.2L16.4 11.2L16.5 12.1L16.5 13L16.5 13.9L16.5 14.8L16.4 15.7L16.3 16.5L16.2 17.4L16 18.1L15.8 18.9L15.6 19.5L15.3 20.2L15.1 20.7L14.8 21.2L14.4 21.6L14.1 22L13.7 22.2L13.4 22.4L13 22.5M1.5 10.7L1.5 11.1L1.6 11.5L1.8 11.9L2.1 12.3L2.4 12.7L2.8 13.1L3.3 13.5L3.9 13.9L4.5 14.2L5.1 14.6L5.9 14.9L6.6 15.2L7.4 15.5L8.3 15.7L9.1 15.9L10 16.1L10.9 16.3L11.9 16.4L12.8 16.5L13.7 16.6L14.6 16.6L15.5 16.6L16.3 16.5L17.1 16.5L17.9 16.4L18.6 16.2L19.3 16L20 15.8L20.5 15.6L21 15.3L21.5 15L21.8 14.7L22.1 14.4L22.3 14L22.5 13.7M19.7 4.7L19.9 5L20.2 5.4L20.4 5.8L20.7 6.2L20.9 6.7L21.1 7.2L21.3 7.8L21.4 8.4L21.6 9L21.7 9.6L21.8 10.3L21.9 10.9L21.9 11.6L21.9 12.2L21.9 12.9L21.9 13.5L21.9 14.1L21.8 14.8L21.7 15.3L21.6 15.9L21.4 16.4L21.3 16.9L21.1 17.3L20.9 17.7L20.7 18.1M3.5 5.6L3.8 5.4L4 5.2L4.3 5L4.6 5L4.9 4.9L5.1 5L5.4 5.1L5.7 5.2L6 5.4L6.2 5.7L6.5 6L6.8 6.3L7 6.7L7.2 7.2L7.5 7.7L7.7 8.2L7.8 8.8L8 9.4L8.1 10L8.3 10.6L8.4 11.2L8.4 11.9L8.5 12.6L8.5 13.2L8.5 13.9L8.5 14.5L8.4 15.1L8.4 15.7L8.3 16.3L8.2 16.9L8 17.4L7.9 17.9L7.7 18.3L7.5 18.7L7.3 19.1L7 19.4L6.8 19.6L6.5 19.8L6.3 19.9L6 20L5.7 20L5.4 20L5.2 19.9L4.9 19.8L4.6 19.6"
          stroke="#2b1408"
          strokeWidth="0.6"
        />
      </Ball>
    </Svg>
  );
}

export function BaseballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} base="#f4efe5" core={0.42} gloss={0.6}>
        <path
          d="M22.6 12.2L22.5 12.3L22.4 12.5L22.3 12.6L22.1 12.7L21.9 12.7L21.6 12.8L21.3 12.8L20.9 12.7L20.6 12.6L20.2 12.5L19.7 12.3L19.3 12.1L18.8 11.9L18.4 11.6L17.9 11.2L17.5 10.8L17 10.4L16.6 10L16.2 9.5L15.7 9L15.4 8.5L15 8L14.6 7.4L14.3 6.9L14 6.4L13.7 5.8L13.5 5.3L13.2 4.8L13 4.3L12.9 3.8L12.7 3.4L12.5 3L12.4 2.6L12.3 2.3L12.2 2L12.1 1.8L12 1.6L11.9 1.5L11.8 1.4L11.7 1.4M1.4 12.1L1.5 12.3L1.6 12.4L1.7 12.5L1.9 12.6L2.2 12.7L2.5 12.9L2.8 13L3.2 13.2L3.6 13.3L4.1 13.5L4.5 13.7L5 14L5.6 14.2L6.1 14.5L6.6 14.8L7.2 15.1L7.7 15.5L8.3 15.8L8.8 16.2L9.3 16.6L9.8 17L10.2 17.4L10.7 17.9L11.1 18.3L11.4 18.7L11.8 19.2L12 19.6L12.3 20L12.5 20.4L12.6 20.8L12.8 21.1L12.8 21.4L12.9 21.7L12.9 22L12.9 22.2L12.8 22.4L12.7 22.5L12.6 22.6"
          stroke="#bdb2a0"
          strokeWidth="0.4"
        />
        <path
          d="M22.1 12.4L22.2 11.9M22.4 12.8L22.8 13.1M21.6 12.5L21.9 11.9M21.7 13L22.1 13.5M21 12.4L21.5 11.9M20.8 13L21.1 13.7M20.2 12.1L20.8 11.7M19.9 12.8L20.1 13.6M19.4 11.7L20.1 11.3M19 12.4L19 13.2M18.6 11.2L19.4 10.9M18.1 11.9L18 12.7M17.8 10.6L18.6 10.3M17.3 11.2L17.2 12.1M17.1 9.9L17.9 9.7M16.5 10.5L16.3 11.3M16.4 9.1L17.2 9M15.7 9.6L15.4 10.5M15.7 8.3L16.6 8.2M15 8.8L14.7 9.6M15.1 7.4L16 7.4M14.4 7.8L14 8.6M14.5 6.5L15.4 6.5M13.8 6.9L13.4 7.6M14.1 5.6L14.9 5.7M13.3 5.9L12.9 6.6M13.6 4.7L14.4 4.8M12.9 5L12.5 5.7M13.2 3.8L14 4M12.6 4.1L12.1 4.7M12.9 3L13.6 3.1M12.3 3.2L11.9 3.8M12.6 2.2L13.2 2.4M12 2.4L11.7 2.9M12.2 1.6L12.6 1.6M11.8 1.8L11.6 2.1M1.7 12.8L1.2 13M1.9 12.3L1.9 11.8M2.2 13.1L1.7 13.4M2.5 12.6L2.4 11.9M2.9 13.4L2.4 13.8M3.2 12.8L3.1 12.1M3.7 13.8L3.1 14.2M4 13.1L3.9 12.4M4.5 14.2L3.9 14.6M4.8 13.5L4.7 12.7M5.4 14.6L4.7 15M5.8 13.9L5.7 13M6.3 15.1L5.5 15.5M6.7 14.4L6.6 13.5M7.2 15.6L6.4 16M7.6 14.9L7.6 14M8 16.2L7.2 16.5M8.5 15.5L8.6 14.6M8.9 16.8L8 17.1M9.4 16.1L9.5 15.3M9.7 17.5L8.8 17.7M10.2 16.8L10.4 16M10.4 18.2L9.6 18.3M11 17.6L11.2 16.8M11.1 18.9L10.3 19M11.7 18.4L11.9 17.6M11.7 19.7L10.9 19.7M12.3 19.3L12.6 18.5M12.1 20.5L11.4 20.4M12.8 20.2L13.1 19.5M12.5 21.2L11.9 21M13.1 21.1L13.5 20.6M12.6 21.9L12.2 21.6M13.1 21.9L13.6 21.6M12.6 22.4L12.6 22M12.8 22.6L13.1 22.8"
          stroke="#d0262c"
          strokeWidth="0.5"
        />
      </Ball>
    </Svg>
  );
}

export function TennisGlyph(props: GlyphProps) {
  const id = useGlyphId();
  const seam =
    "M22.6 12.4L22.5 12.6L22.4 12.7L22.3 12.8L22.1 12.9L21.9 12.9L21.6 12.9L21.3 12.8L21 12.6L20.6 12.4L20.2 12.2L19.9 11.9L19.5 11.5L19 11.2L18.6 10.7L18.2 10.3L17.8 9.8L17.4 9.3L16.9 8.7L16.5 8.2L16.1 7.6L15.7 7L15.3 6.5L15 5.9L14.6 5.4L14.3 4.8L13.9 4.3L13.6 3.8L13.3 3.4L12.9 3L12.6 2.6L12.3 2.3L12 2L11.7 1.8L11.4 1.7L11.1 1.6L10.7 1.5L10.4 1.5M1.4 12.4L1.5 12.7L1.5 12.9L1.7 13.1L1.9 13.3L2.2 13.5L2.5 13.7L2.8 13.8L3.2 14L3.7 14.1L4.2 14.2L4.7 14.4L5.3 14.5L5.9 14.6L6.5 14.8L7.1 15L7.8 15.1L8.4 15.3L9.1 15.5L9.8 15.8L10.4 16L11.1 16.3L11.7 16.6L12.3 16.9L12.8 17.2L13.4 17.5L13.8 17.9L14.3 18.2L14.6 18.6L15 18.9L15.2 19.3L15.5 19.7L15.6 20L15.7 20.4L15.8 20.7L15.7 21L15.7 21.3L15.5 21.6L15.3 21.8L15.1 22L14.8 22.2L14.5 22.3";
  return (
    <Svg className={props.className}>
      <Ball id={id} base="#d3e53a" core={0.45} gloss={0.2}>
        <path
          d={seam}
          stroke="#6f7d10"
          strokeOpacity={0.45}
          strokeWidth="1.7"
        />
        <path d={seam} stroke="#f7f8ec" strokeWidth="0.95" />
      </Ball>
    </Svg>
  );
}

export function CricketGlyph(props: GlyphProps) {
  const id = useGlyphId();
  const seam =
    "M3.2 6L3.2 6.1L3.2 6.3L3.3 6.4L3.4 6.6L3.5 6.8L3.7 7L3.9 7.3L4.1 7.6L4.4 7.8L4.7 8.1L5 8.5L5.4 8.8L5.8 9.2L6.2 9.5L6.7 9.9L7.1 10.3L7.6 10.7L8.1 11L8.6 11.4L9.2 11.8L9.7 12.2L10.3 12.6L10.9 13L11.4 13.4L12 13.8L12.6 14.2L13.1 14.6L13.7 14.9L14.3 15.3L14.8 15.6L15.4 15.9L15.9 16.2L16.4 16.5L16.9 16.8L17.3 17L17.8 17.2L18.2 17.4L18.6 17.6L19 17.8L19.3 17.9L19.6 18L19.9 18.1L20.1 18.1L20.3 18.1L20.5 18.1L20.6 18.1L20.7 18";
  return (
    <Svg className={props.className}>
      <Ball id={id} base="#a8141e" core={0.5} gloss={0.75}>
        <path d={seam} stroke="#ead9b8" strokeWidth="2.2" />
        <path d={seam} stroke="#6d0b12" strokeWidth="0.35" />
        <path
          d="M3.7 5.4L3.7 5.5L3.7 5.6L3.8 5.8L3.9 6L4 6.2L4.2 6.4L4.4 6.7L4.6 6.9L4.9 7.2L5.2 7.5L5.5 7.8L5.9 8.2L6.3 8.5L6.7 8.9L7.1 9.2L7.6 9.6L8.1 10L8.6 10.4L9.1 10.8L9.6 11.2L10.2 11.6L10.7 12L11.3 12.4L11.9 12.8L12.4 13.2L13 13.6L13.6 13.9L14.2 14.3L14.7 14.6L15.3 15L15.8 15.3L16.3 15.6L16.8 15.8L17.3 16.1L17.8 16.4L18.2 16.6L18.6 16.8L19 16.9L19.4 17.1L19.7 17.2L20 17.3L20.3 17.4L20.5 17.4L20.7 17.5L20.9 17.5L21 17.4L21.1 17.4M2.8 6.7L2.8 6.8L2.8 6.9L2.9 7.1L3 7.3L3.1 7.5L3.3 7.7L3.5 8L3.7 8.2L4 8.5L4.3 8.8L4.6 9.1L5 9.5L5.4 9.8L5.8 10.2L6.2 10.5L6.7 10.9L7.2 11.3L7.7 11.7L8.2 12.1L8.7 12.5L9.3 12.9L9.8 13.3L10.4 13.7L11 14.1L11.6 14.5L12.1 14.8L12.7 15.2L13.3 15.6L13.8 15.9L14.4 16.3L14.9 16.6L15.4 16.9L15.9 17.1L16.4 17.4L16.9 17.6L17.3 17.9L17.7 18.1L18.1 18.2L18.5 18.4L18.8 18.5L19.1 18.6L19.4 18.7L19.6 18.7L19.8 18.8L20 18.8L20.1 18.7L20.2 18.7"
          stroke="#a8141e"
          strokeWidth="0.25"
          strokeDasharray="0.3 0.5"
        />
      </Ball>
    </Svg>
  );
}

export function GolfGlyph(props: GlyphProps) {
  const id = useGlyphId();
  const dimples =
    "M14.8 16.3A4 1.6 0 0 1 9.2 16.3M16.6 15.3A5.2 2.1 0 0 1 7.4 15.3M17.8 14.1A6.1 2.5 0 0 1 6.2 14.1M18.7 12.7A6.9 2.8 0 0 1 5.3 12.7M19.3 11.2A7.4 3 0 0 1 4.7 11.2M19.6 9.6A7.6 3.1 0 0 1 4.4 9.6M19.5 8A7.5 3.1 0 1 1 4.5 8M19.1 6.5A7.2 2.9 0 1 1 4.9 6.5M18.4 5A6.6 2.7 0 1 1 5.6 5M17.3 3.7A5.7 2.3 0 1 1 6.7 3.7M15.8 2.6A4.7 1.9 0 1 1 8.2 2.6M13.7 1.8A3.5 1.4 0 1 1 10.3 1.8M9.9 2.5a2.1 .9 0 1 0 4.2 0a2.1 .9 0 1 0 -4.2 0";
  return (
    <Svg className={props.className}>
      <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#f0d2a0" />
        <stop offset="0.45" stopColor="#c6935a" />
        <stop offset="1" stopColor="#7a5226" />
      </linearGradient>
      <path
        d="M7.8 16.2H16.2C16.2 17.2 14.6 17.9 13.1 18.3L12.7 22.6Q12.6 23.3 12 23.3T11.3 22.6L10.9 18.3C9.4 17.9 7.8 17.2 7.8 16.2Z"
        fill={`url(#${id}t)`}
      />
      <ellipse cx="12" cy="16.4" rx="4" ry="0.7" fill="#3a2410" opacity={0.5} />
      <clipPath id={`${id}c`}>
        <circle cx="12" cy="9.2" r="7.6" />
      </clipPath>
      <circle cx="12" cy="9.2" r="7.6" fill="#f6f6f4" />
      <g clipPath={`url(#${id}c)`} strokeDasharray="0 1.25">
        <path
          d={dimples}
          stroke="#fff"
          strokeWidth="0.85"
          transform="translate(0.15 0.15)"
        />
        <path
          d={dimples}
          stroke="#7c828a"
          strokeOpacity={0.4}
          strokeWidth="0.8"
        />
      </g>
      <SphereShade id={id} cx={12} cy={9.2} r={7.6} core={0.42} gloss={0.8} />
    </Svg>
  );
}

export function FootballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  const laces =
    "M8.4 8.6V10.6M9.8 8.3V10.3M11.2 8.2V10.2M12.6 8.2V10.2M14 8.3V10.3M15.4 8.6V10.6M8 9.6C10.4 9 13.4 9 15.8 9.6";
  const shape =
    "M.8 12C3.4 6.9 7.4 5.6 12 5.6S20.6 6.9 23.2 12C20.6 17.1 16.6 18.4 12 18.4S3.4 17.1.8 12Z";
  return (
    <Svg className={props.className}>
      <radialGradient id={`${id}b`} cx="0.42" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#b8642e" />
        <stop offset="0.55" stopColor="#874015" />
        <stop offset="1" stopColor="#4a1f08" />
      </radialGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.22} />
        <stop offset="0.3" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.72" stopColor="#000" stopOpacity={0.2} />
        <stop offset="0.92" stopColor="#000" stopOpacity={0.42} />
        <stop offset="1" stopColor="#000" stopOpacity={0.3} />
      </linearGradient>
      <clipPath id={`${id}c`}>
        <path d={shape} />
      </clipPath>
      <g transform="rotate(-40 12 12)">
        <path d={shape} fill={`url(#${id}b)`} />
        <g clipPath={`url(#${id}c)`}>
          <path
            d="M4.6 4Q6 12 4.6 20M19.4 4Q18 12 19.4 20"
            stroke="#f3eee4"
            strokeWidth="1.2"
          />
          <path
            d="M1 12.4C6 15.6 18 15.6 23 12.4"
            stroke="#2a1206"
            strokeOpacity={0.5}
            strokeWidth="0.35"
          />
          <path
            d="M2.2 8.6C7 7 17 7 21.8 8.6"
            stroke="#2a1206"
            strokeOpacity={0.6}
            strokeWidth="0.35"
          />
          <path d={shape} fill={`url(#${id}s)`} />
        </g>
        <path
          d={laces}
          stroke="#2a1206"
          strokeOpacity={0.45}
          strokeWidth="0.9"
          transform="translate(0.15 0.25)"
        />
        <path d={laces} stroke="#f6f2ea" strokeWidth="0.7" />
        <ellipse cx="10.6" cy="7.4" rx="5" ry="0.9" fill={`url(#${id}g)`} />
      </g>
      <radialGradient id={`${id}g`}>
        <stop offset="0" stopColor="#fff" stopOpacity={0.35} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
    </Svg>
  );
}

export function RugbyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  const shape =
    "M1.1 12C1.6 7.5 6.4 4.9 12 4.9S22.4 7.5 22.9 12C22.4 16.5 17.6 19.1 12 19.1S1.6 16.5 1.1 12Z";
  return (
    <Svg className={props.className}>
      <radialGradient id={`${id}b`} cx="0.42" cy="0.3" r="0.75">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#ecebe6" />
        <stop offset="1" stopColor="#b9b8b2" />
      </radialGradient>
      <linearGradient id={`${id}s`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity={0.3} />
        <stop offset="0.3" stopColor="#fff" stopOpacity={0} />
        <stop offset="0.72" stopColor="#000" stopOpacity={0.12} />
        <stop offset="0.92" stopColor="#000" stopOpacity={0.32} />
        <stop offset="1" stopColor="#000" stopOpacity={0.22} />
      </linearGradient>
      <clipPath id={`${id}c`}>
        <path d={shape} />
      </clipPath>
      <g transform="rotate(35 12 12)">
        <path d={shape} fill={`url(#${id}b)`} />
        <g clipPath={`url(#${id}c)`}>
          <path d="M10.4 3Q12 12 10.4 21H13.8Q15.4 12 13.8 3Z" fill="#1f3a7a" />
          <path
            d="M9.4 3Q11 12 9.4 21M14.8 3Q16.4 12 14.8 21"
            stroke="#c8202b"
            strokeWidth="0.7"
          />
          <path
            d="M1.4 12.6C6 15.8 18 15.8 22.6 12.6M2 8.8C7 7.2 17 7.2 22 8.8"
            stroke="#77766f"
            strokeWidth="0.3"
            strokeDasharray="0.4 0.35"
          />
          <path d={shape} fill={`url(#${id}s)`} />
        </g>
      </g>
    </Svg>
  );
}

export function HockeyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0.7">
        <stop offset="0" stopColor="#f2d29a" />
        <stop offset="0.5" stopColor="#c98f4a" />
        <stop offset="1" stopColor="#7e5022" />
      </linearGradient>
      <linearGradient id={`${id}p`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#2c2c30" />
        <stop offset="0.35" stopColor="#0e0e10" />
        <stop offset="0.8" stopColor="#151517" />
        <stop offset="1" stopColor="#3a3a40" />
      </linearGradient>
      <radialGradient id={`${id}t`} cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#62626a" />
        <stop offset="1" stopColor="#1a1a1d" />
      </radialGradient>
      <path
        d="M19.2 1.2L21.4 2.6L10.4 17.6Q9.6 18.8 8.2 19L3.2 19.9Q1.6 20.1 1.5 18.8Q1.5 17.6 2.9 17.4L8 16.6Z"
        fill={`url(#${id}w)`}
      />
      <path
        d="M10.9 16.9L10.4 17.6Q9.6 18.8 8.2 19L3.2 19.9Q1.6 20.1 1.5 18.8Q1.5 17.6 2.9 17.4L8 16.6L8.6 15.8Z"
        fill="#17171a"
      />
      <path
        d="M3 17.9L3.6 19.4M4.6 17.6L5.2 19.2M6.2 17.4L6.8 18.9M7.8 17.1L8.4 18.6"
        stroke="#fff"
        strokeOpacity={0.14}
        strokeWidth="0.3"
      />
      <path d="M19.2 1.2L21.4 2.6L20.2 4.2L18 2.8Z" fill="#17171a" />
      <path
        d="M10.6 18.4V20.6A5.6 2.2 0 0 0 21.8 20.6V18.4Z"
        fill={`url(#${id}p)`}
      />
      <ellipse cx="16.2" cy="18.4" rx="5.6" ry="2.2" fill={`url(#${id}t)`} />
      <path
        d="M10.6 18.4A5.6 2.2 0 0 0 21.8 18.4"
        stroke="#c4c4cc"
        strokeOpacity={0.8}
        strokeWidth="0.3"
      />
      <path
        d="M10.8 19.6A5.4 2.2 0 0 0 21.6 19.6"
        stroke="#000"
        strokeOpacity={0.6}
        strokeWidth="1.2"
        strokeDasharray="0.2 0.35"
        strokeLinecap="butt"
      />
    </Svg>
  );
}

export function GloveGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <radialGradient id={`${id}r`} cx="0.38" cy="0.22" r="0.85">
        <stop offset="0" stopColor="#ff7466" />
        <stop offset="0.4" stopColor="#df2a2e" />
        <stop offset="0.8" stopColor="#9c1119" />
        <stop offset="1" stopColor="#6e0a10" />
      </radialGradient>
      <radialGradient id={`${id}h`} cx="0.3" cy="0.3" r="0.8">
        <stop offset="0" stopColor="#f2554e" />
        <stop offset="0.6" stopColor="#c11d24" />
        <stop offset="1" stopColor="#7a0b12" />
      </radialGradient>
      <linearGradient id={`${id}k`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8e0f17" />
        <stop offset="0.35" stopColor="#c81f27" />
        <stop offset="1" stopColor="#6a0910" />
      </linearGradient>
      <radialGradient id={`${id}g`}>
        <stop offset="0" stopColor="#fff" stopOpacity={0.7} />
        <stop offset="1" stopColor="#fff" stopOpacity={0} />
      </radialGradient>
      <path
        d="M7.2 15.6L17.8 15.8L17.4 22.4Q12.4 23.2 7.6 22.4Z"
        fill={`url(#${id}k)`}
      />
      <path
        d="M12.6 16.6V22.6"
        stroke="#3a0507"
        strokeOpacity={0.6}
        strokeWidth="0.5"
      />
      <path
        d="M11.6 17.2L13.6 18.2M13.6 17.2L11.6 18.2M11.6 18.9L13.6 19.9M13.6 18.9L11.6 19.9M11.6 20.6L13.6 21.6M13.6 20.6L11.6 21.6"
        stroke="#f4efe6"
        strokeWidth="0.4"
      />
      <path
        d="M7 16C5.2 14.4 4.8 11.4 5.4 8.6C6.2 4.8 9 2.2 13 2.2C17.4 2.2 20.6 5.2 20.6 9.6C20.6 12.8 19.3 15.2 17.6 16.4Z"
        fill={`url(#${id}r)`}
      />
      <path
        d="M7.2 16.2Q12.4 17.4 17.6 16.4"
        stroke="#3a0507"
        strokeOpacity={0.5}
        strokeWidth="0.8"
      />
      <path
        d="M9.4 7.4C11.8 6.2 15.6 6.4 18.6 8.2"
        stroke="#5c070c"
        strokeOpacity={0.5}
        strokeWidth="0.6"
      />
      <path
        d="M10 15.6C7.4 15.9 5 14.6 4.4 12.2C3.9 10.2 4.6 8.2 6.2 7.6C7.4 7.2 8.2 8.2 8.2 9.6C8.2 11.6 8.6 13.6 10.2 15Z"
        fill="#3a0507"
        opacity={0.4}
        transform="translate(0.6 0.2)"
      />
      <path
        d="M10 15.6C7.4 15.9 5 14.6 4.4 12.2C3.9 10.2 4.6 8.2 6.2 7.6C7.4 7.2 8.2 8.2 8.2 9.6C8.2 11.6 8.6 13.6 10.2 15Z"
        fill={`url(#${id}h)`}
      />
      <ellipse
        cx="11.6"
        cy="4.6"
        rx="3.8"
        ry="1.3"
        transform="rotate(-14 11.6 4.6)"
        fill={`url(#${id}g)`}
      />
      <ellipse
        cx="5.6"
        cy="10"
        rx="1.4"
        ry="0.5"
        transform="rotate(-70 5.6 10)"
        fill={`url(#${id}g)`}
      />
    </Svg>
  );
}

export function TrophyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#8a5a12" />
        <stop offset="0.14" stopColor="#e9b949" />
        <stop offset="0.3" stopColor="#fff1b8" />
        <stop offset="0.46" stopColor="#f2c24e" />
        <stop offset="0.72" stopColor="#b47a17" />
        <stop offset="0.9" stopColor="#734709" />
        <stop offset="1" stopColor="#c99636" />
      </linearGradient>
      <linearGradient
        id={`${id}h`}
        x1="3"
        y1="0"
        x2="21"
        y2="0"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0" stopColor="#f5d470" />
        <stop offset="0.5" stopColor="#c48a20" />
        <stop offset="1" stopColor="#8a5a12" />
      </linearGradient>
      <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a2a14" />
        <stop offset="0.3" stopColor="#6e4223" />
        <stop offset="1" stopColor="#2a160a" />
      </linearGradient>
      <path
        d="M6.4 4.4H4.4C3.4 4.4 3 5.3 3.3 6.4C3.9 8.8 5.6 10.4 7.6 10.9M17.6 4.4H19.6C20.6 4.4 21 5.3 20.7 6.4C20.1 8.8 18.4 10.4 16.4 10.9"
        stroke={`url(#${id}h)`}
        strokeWidth="1.5"
      />
      <path d="M10.9 14.2H13.1L13.5 17.6H10.5Z" fill={`url(#${id}m)`} />
      <ellipse cx="12" cy="15.6" rx="1.5" ry="0.5" fill={`url(#${id}m)`} />
      <path
        d="M5.8 2.8H18.2V7.6C18.2 11.6 15.6 14.6 12 14.6S5.8 11.6 5.8 7.6Z"
        fill={`url(#${id}m)`}
      />
      <ellipse cx="12" cy="2.8" rx="6.2" ry="0.9" fill="#7a4c0c" />
      <ellipse cx="12" cy="3" rx="5.6" ry="0.6" fill="#4a2c06" />
      <path d="M8.4 17.4H15.6V18.8H8.4Z" fill={`url(#${id}m)`} />
      <path d="M6.8 18.8H17.2L17.6 22.8H6.4Z" fill={`url(#${id}w)`} />
      <path
        d="M6.8 18.8H17.2"
        stroke="#c9945a"
        strokeOpacity={0.6}
        strokeWidth="0.3"
      />
      <path d="M9.8 20.2H14.2V21.6H9.8Z" fill={`url(#${id}m)`} />
    </Svg>
  );
}
