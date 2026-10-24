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

function Shine(props: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <ellipse
      cx={props.cx}
      cy={props.cy}
      rx={props.rx}
      ry={props.ry}
      fill="#fff"
      opacity={0.35}
    />
  );
}

function Radial(props: { id: string; light: string; dark: string }) {
  return (
    <radialGradient id={props.id} cx="0.35" cy="0.3" r="0.8">
      <stop offset="0" stopColor={props.light} />
      <stop offset="1" stopColor={props.dark} />
    </radialGradient>
  );
}

export function FootballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#c97638" dark="#73381a" />
      </defs>
      <g transform="rotate(-45 12 12)">
        <ellipse
          cx="12"
          cy="12"
          rx="10.6"
          ry="6.4"
          fill={`url(#${id}b)`}
          stroke="#2e1406"
        />
        <path
          d="M5.6 7.6V16.4M18.4 7.6V16.4"
          stroke="#fff"
          strokeWidth="1.1"
          opacity={0.9}
        />
        <path d="M8.6 12H15.4" stroke="#fff" strokeWidth="1.1" />
        <path
          d="M9.6 10.8V13.2M11.2 10.8V13.2M12.8 10.8V13.2M14.4 10.8V13.2"
          stroke="#fff"
          strokeWidth="0.9"
        />
        <ellipse cx="11" cy="8.2" rx="5" ry="1.1" fill="#fff" opacity={0.25} />
      </g>
    </Svg>
  );
}

export function BasketballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ffa552" dark="#d4560f" />
        <clipPath id={`${id}c`}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} stroke="#3a1606" strokeWidth="1.1">
        <path d="M12 2V22M2 12H22" />
        <path d="M5.2 4.6C8.8 8 8.8 16 5.2 19.4M18.8 4.6C15.2 8 15.2 16 18.8 19.4" />
      </g>
      <Shine cx={8.4} cy={6.8} rx={2.4} ry={1.3} />
      <circle cx="12" cy="12" r="9.5" stroke="#3a1606" />
    </Svg>
  );
}

export function BaseballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ffffff" dark="#cfd3da" />
        <clipPath id={`${id}c`}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} stroke="#dc2626">
        <path
          d="M5.4 3.6C9.4 7.4 9.4 16.6 5.4 20.4M18.6 3.6C14.6 7.4 14.6 16.6 18.6 20.4"
          strokeWidth="0.7"
        />
        <path
          d="M5.4 3.6C9.4 7.4 9.4 16.6 5.4 20.4M18.6 3.6C14.6 7.4 14.6 16.6 18.6 20.4"
          strokeWidth="2.4"
          strokeDasharray="0.55 1.25"
          strokeLinecap="butt"
        />
      </g>
      <circle cx="12" cy="12" r="9.5" stroke="#374151" />
    </Svg>
  );
}

export function SoccerGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ffffff" dark="#d4d8de" />
        <clipPath id={`${id}c`}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`}>
        <path
          d="M12 8.7L15.14 10.98L13.94 14.67L10.06 14.67L8.86 10.98ZM12 6L8.77 3.65L10 -0.15L14 -0.15L15.23 3.65ZM17.71 10.15L18.94 6.35L22.94 6.35L24.17 10.15L20.94 12.5ZM15.53 16.85L19.53 16.85L20.76 20.65L17.53 23L14.3 20.65ZM8.47 16.85L9.7 20.65L6.47 23L3.24 20.65L4.47 16.85ZM6.29 10.15L3.06 12.5L-0.17 10.15L1.06 6.35L5.06 6.35Z"
          fill="#111827"
        />
        <path
          d="M12 8.7L12 6M15.23 3.65L18.94 6.35M15.14 10.98L17.71 10.15M20.94 12.5L19.53 16.85M13.94 14.67L15.53 16.85M14.3 20.65L9.7 20.65M10.06 14.67L8.47 16.85M4.47 16.85L3.06 12.5M8.86 10.98L6.29 10.15M5.06 6.35L8.77 3.65"
          stroke="#4b5563"
          strokeWidth="0.8"
        />
      </g>
      <circle cx="12" cy="12" r="9.5" stroke="#374151" />
    </Svg>
  );
}

export function TennisGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ecfb6a" dark="#9cbc12" />
        <clipPath id={`${id}c`}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} stroke="#fff" strokeWidth="1.4">
        <path d="M2.6 7.2C8.6 8.6 8.6 15.4 2.6 16.8M21.4 7.2C15.4 8.6 15.4 15.4 21.4 16.8" />
      </g>
      <Shine cx={8.6} cy={6.6} rx={2.2} ry={1.1} />
      <circle cx="12" cy="12" r="9.5" stroke="#4a5a06" />
    </Svg>
  );
}

export function HockeyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#e8b56a" />
          <stop offset="1" stopColor="#a8682a" />
        </linearGradient>
      </defs>
      <path
        d="M16.9 1.8L19.5 3.2L10.6 18.6Q9.9 19.8 8.5 20L3.5 20.6Q2.2 20.7 2.3 19.5L2.5 18.6Q2.7 17.8 3.6 17.7L8 17.3Z"
        fill={`url(#${id}w)`}
        stroke="#3d2208"
      />
      <path
        d="M2.4 19.2L2.5 18.6Q2.7 17.8 3.6 17.7L8 17.3L9.1 18.1Q8.6 19.3 7.6 19.4L3.4 19.9Z"
        fill="#111827"
      />
      <path d="M16.4 2.7L19 4.1L18 5.8L15.4 4.4Z" fill="#111827" />
      <path
        d="M12.6 18.9V20.2C12.6 21.3 14.5 22.1 16.9 22.1C19.3 22.1 21.2 21.3 21.2 20.2V18.9"
        fill="#111827"
        stroke="#9ca3af"
        strokeWidth="0.8"
      />
      <ellipse
        cx="16.9"
        cy="18.9"
        rx="4.3"
        ry="1.9"
        fill="#2d3748"
        stroke="#9ca3af"
        strokeWidth="0.8"
      />
      <ellipse
        cx="15.6"
        cy="18.5"
        rx="1.8"
        ry="0.5"
        fill="#fff"
        opacity={0.3}
      />
    </Svg>
  );
}

export function GloveGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}r`} light="#f87171" dark="#b91c1c" />
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <path
        d="M7 15.2C4.4 15.4 2.6 13.4 3.2 11C3.7 9.2 5.4 8.4 7.2 8.8"
        fill={`url(#${id}r)`}
        stroke="#4c0a0a"
      />
      <path
        d="M7.2 16.4C6 15 5.4 12.8 5.6 10.4C5.9 6 8.6 2.6 13 2.6C17.4 2.6 20.2 5.4 20.2 9.6C20.2 12.6 19.2 15 17.4 16.4Z"
        fill={`url(#${id}r)`}
        stroke="#4c0a0a"
      />
      <path d="M9.2 7.4C11.6 6.4 15.2 6.6 17.6 8.2" stroke="#7f1d1d" />
      <path d="M6.4 9.6C8.2 10 9.2 11.4 9 13.2" stroke="#7f1d1d" />
      <ellipse cx="11.6" cy="4.6" rx="2.6" ry="1" fill="#fff" opacity={0.35} />
      <rect
        x="6.8"
        y="16"
        width="11"
        height="5.4"
        rx="1.2"
        fill={`url(#${id}w)`}
        stroke="#374151"
      />
      <path d="M7.4 18.7H17.2" stroke="#dc2626" strokeWidth="1.1" />
    </Svg>
  );
}

export function GolfGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ffffff" dark="#cdd2d9" />
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <path
        d="M8.4 16.6H15.6L13 18.4L12.6 22.2Q12 22.8 11.4 22.2L11 18.4Z"
        fill={`url(#${id}t)`}
        stroke="#5c2c05"
      />
      <circle cx="12" cy="9.6" r="7" fill={`url(#${id}b)`} />
      <g fill="#9ca3af" opacity={0.75}>
        <circle cx="12" cy="9.6" r="0.75" />
        <circle cx="9.4" cy="8.4" r="0.7" />
        <circle cx="14.6" cy="8.4" r="0.7" />
        <circle cx="10.4" cy="11.8" r="0.7" />
        <circle cx="13.6" cy="11.8" r="0.7" />
        <circle cx="12" cy="6.4" r="0.65" />
        <circle cx="7.6" cy="11" r="0.6" />
        <circle cx="16.4" cy="11" r="0.6" />
        <circle cx="12" cy="13.9" r="0.6" />
      </g>
      <circle cx="12" cy="9.6" r="7" stroke="#374151" />
    </Svg>
  );
}

export function CricketGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#e5483e" dark="#8a1212" />
        <clipPath id={`${id}c`}>
          <circle cx="12" cy="12" r="9.5" />
        </clipPath>
      </defs>
      <circle cx="12" cy="12" r="9.5" fill={`url(#${id}b)`} />
      <g clipPath={`url(#${id}c)`} stroke="#fde8c8">
        <path d="M2 9.6C8 13.4 16 13.4 22 9.6" strokeWidth="0.6" />
        <path d="M2 12.4C8 16.2 16 16.2 22 12.4" strokeWidth="0.6" />
        <path
          d="M2 9.6C8 13.4 16 13.4 22 9.6M2 12.4C8 16.2 16 16.2 22 12.4"
          strokeWidth="1.8"
          strokeDasharray="0.5 1.1"
          strokeLinecap="butt"
        />
      </g>
      <Shine cx={8.4} cy={6.4} rx={2.4} ry={1.2} />
      <circle cx="12" cy="12" r="9.5" stroke="#3b0606" />
    </Svg>
  );
}

export function RugbyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <Radial id={`${id}b`} light="#ffffff" dark="#cfd4db" />
        <clipPath id={`${id}c`}>
          <ellipse cx="12" cy="12" rx="10.4" ry="7.2" />
        </clipPath>
      </defs>
      <g transform="rotate(-35 12 12)">
        <ellipse cx="12" cy="12" rx="10.4" ry="7.2" fill={`url(#${id}b)`} />
        <g clipPath={`url(#${id}c)`}>
          <path d="M9.8 3H14.2V21H9.8Z" fill="#1d4ed8" />
          <path d="M10.8 3H13.2V21H10.8Z" fill="#dc2626" />
          <path
            d="M1.6 12C6 8.6 18 8.6 22.4 12M1.6 12C6 15.4 18 15.4 22.4 12"
            stroke="#6b7280"
            strokeWidth="0.8"
          />
        </g>
        <ellipse cx="12" cy="12" rx="10.4" ry="7.2" stroke="#1f2937" />
      </g>
    </Svg>
  );
}

export function TrophyGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fde68a" />
          <stop offset="0.45" stopColor="#f5b301" />
          <stop offset="1" stopColor="#b45309" />
        </linearGradient>
      </defs>
      <path
        d="M7 5H4.6C3.8 5 3.4 5.7 3.6 6.6C4 8.8 5.6 10.4 7.6 10.8M17 5H19.4C20.2 5 20.6 5.7 20.4 6.6C20 8.8 18.4 10.4 16.4 10.8"
        stroke="#b45309"
        strokeWidth="1.6"
      />
      <path
        d="M6.6 3H17.4V8.6C17.4 12 15 14.4 12 14.4C9 14.4 6.6 12 6.6 8.6Z"
        fill={`url(#${id}g)`}
        stroke="#5c2a04"
      />
      <path
        d="M10.8 14.2H13.2L13.6 17.4H10.4Z"
        fill={`url(#${id}g)`}
        stroke="#5c2a04"
      />
      <rect
        x="7.6"
        y="17.4"
        width="8.8"
        height="3.8"
        rx="0.8"
        fill="#8a4a12"
        stroke="#3d1d04"
      />
      <rect x="9.8" y="18.6" width="4.4" height="1.4" rx="0.3" fill="#f5b301" />
      <path
        d="M8.6 4.6V8.4C8.6 9.6 9 10.6 9.8 11.4"
        stroke="#fff"
        strokeWidth="1"
        opacity={0.55}
      />
    </Svg>
  );
}
