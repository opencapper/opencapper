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

function Ball(props: {
  id: string;
  fill: string;
  ring?: string;
  children: ReactNode;
}) {
  return (
    <>
      <clipPath id={props.id}>
        <circle cx="12" cy="12" r="10" />
      </clipPath>
      <circle cx="12" cy="12" r="10" fill={props.fill} />
      <g clipPath={`url(#${props.id})`}>{props.children}</g>
      {props.ring && (
        <circle
          cx="12"
          cy="12"
          r="9.3"
          stroke={props.ring}
          strokeWidth="1.4"
        />
      )}
    </>
  );
}

export function SoccerGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} fill="#e4e4e7" ring="#52525b">
        <path
          d="M12 8.6L12 5.8M15.23 10.95L17.9 10.08M14 14.75L15.65 17.02M10 14.75L8.35 17.02M8.77 10.95L6.1 10.08M15.61 3.17L19.28 5.84M21.51 12.71L20.11 17.02M14.27 21.26L9.73 21.26M3.89 17.02L2.49 12.71M4.72 5.84L8.39 3.17"
          stroke="#52525b"
          strokeWidth="1"
        />
        <path
          d="M12 8.6L15.23 10.95L14 14.75L10 14.75L8.77 10.95ZM12 5.8L8.39 3.17L9.77 -1.07L14.23 -1.07L15.61 3.17ZM17.9 10.08L19.28 5.84L23.74 5.84L25.12 10.08L21.51 12.71ZM15.65 17.02L20.11 17.02L21.49 21.26L17.88 23.89L14.27 21.26ZM8.35 17.02L9.73 21.26L6.12 23.89L2.51 21.26L3.89 17.02ZM6.1 10.08L2.49 12.71L-1.12 10.08L0.26 5.84L4.72 5.84Z"
          fill="#52525b"
        />
      </Ball>
    </Svg>
  );
}

export function BasketballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} fill="#f58a2a">
        <path
          d="M12 1V23M1 12H23M5.2 4.2C8.6 7.8 8.6 16.2 5.2 19.8M18.8 4.2C15.4 7.8 15.4 16.2 18.8 19.8"
          stroke="#9a4108"
          strokeWidth="1.3"
        />
      </Ball>
    </Svg>
  );
}

export function BaseballGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} fill="#fde4e2" ring="#d92d2d">
        <path
          d="M5.4 4.6C8.6 8 8.6 16 5.4 19.4M18.6 4.6C15.4 8 15.4 16 18.6 19.4"
          stroke="#d92d2d"
          strokeWidth="1.3"
        />
        <path
          d="M6.6 7.6L8.4 7M7.4 11.1H9.3M7.4 14.4L9.3 14.9M17.4 7.6L15.6 7M16.6 11.1H14.7M16.6 14.4L14.7 14.9"
          stroke="#d92d2d"
          strokeWidth="1"
        />
      </Ball>
    </Svg>
  );
}

export function TennisGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} fill="#b5d327">
        <path
          d="M22.4 13C16.6 13.2 11.2 8 11 1.6M1.6 11C7.4 10.8 12.8 16 13 22.4"
          stroke="#f6fbdc"
          strokeWidth="1.6"
        />
      </Ball>
    </Svg>
  );
}

export function CricketGlyph(props: GlyphProps) {
  const id = useGlyphId();
  return (
    <Svg className={props.className}>
      <Ball id={id} fill="#c21d36">
        <path
          d="M3.2 5.4C8 10.4 13.4 15.2 19.6 18.6"
          stroke="#f9d2d8"
          strokeWidth="3"
        />
        <path
          d="M4.2 5.4L3.2 6.4M6.4 7.6L5.4 8.6M8.6 9.8L7.6 10.8M10.9 11.9L9.9 12.9M13.3 13.9L12.3 14.9M15.8 15.7L14.8 16.7M18.4 17.3L17.4 18.3"
          stroke="#c21d36"
          strokeWidth="0.8"
        />
      </Ball>
    </Svg>
  );
}

export function GolfGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <ellipse cx="12" cy="19.6" rx="10" ry="3" fill="#7ad48f" />
      <ellipse cx="9" cy="19.6" rx="2.2" ry="0.9" fill="#16803c" />
      <path d="M9 19.4V2.2" stroke="#16803c" strokeWidth="1.5" />
      <path d="M9.6 2L19.4 5.9L9.6 9.8Z" fill="#16803c" />
    </Svg>
  );
}

export function FootballGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <g transform="rotate(-45 12 12)">
        <path
          d="M.2 12C3.2 6.5 7.4 5.2 12 5.2S20.8 6.5 23.8 12C20.8 17.5 16.6 18.8 12 18.8S3.2 17.5.2 12Z"
          fill="#9a5226"
        />
        <path
          d="M5 7.2Q6.4 12 5 16.8M19 7.2Q17.6 12 19 16.8"
          stroke="#f5dfc7"
          strokeWidth="1.2"
        />
        <path
          d="M8 10H16M9.4 8.2V11.8M12 8.2V11.8M14.6 8.2V11.8"
          stroke="#f5dfc7"
          strokeWidth="1.2"
        />
      </g>
    </Svg>
  );
}

export function RugbyGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <g transform="rotate(45 12 12)">
        <path
          d="M1 12C1.5 7.4 6.2 4.8 12 4.8S22.5 7.4 23 12C22.5 16.6 17.8 19.2 12 19.2S1.5 16.6 1 12Z"
          fill="#2f6bd8"
        />
        <path
          d="M8.8 5.6Q10.6 12 8.8 18.4M13.6 5.2Q15.4 12 13.6 18.8"
          stroke="#c9dbff"
          strokeWidth="1.6"
        />
      </g>
    </Svg>
  );
}

export function HockeyGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <path
        d="M18.6 1.4L21.2 3L10.6 17.6Q9.8 18.8 8.4 19L3.6 19.8Q1.8 20.1 1.7 18.7Q1.6 17.4 3.2 17.2L8.2 16.4Z"
        fill="#6d8fc4"
      />
      <path
        d="M4.4 17L4.8 19.6M6.6 16.7L7 19.2"
        stroke="#2f4a78"
        strokeWidth="1"
      />
      <path d="M10.6 19.6V21.2A5.6 2.2 0 0 0 21.8 21.2V19.6Z" fill="#2f4a78" />
      <ellipse cx="16.2" cy="19.6" rx="5.6" ry="2.2" fill="#2f4a78" />
      <ellipse cx="16.2" cy="19.4" rx="4.2" ry="1.3" fill="#6d8fc4" />
    </Svg>
  );
}

export function GloveGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <path d="M7.2 16.4H17.6L17.2 22.4Q12.4 23.2 7.6 22.4Z" fill="#a8161f" />
      <path
        d="M7 16.6C5.2 14.8 4.8 11.6 5.4 8.6C6.2 4.8 9 2.2 13 2.2C17.4 2.2 20.6 5.2 20.6 9.6C20.6 12.8 19.3 15.4 17.6 16.6Z"
        fill="#e0303a"
      />
      <path
        d="M10.4 15.4C7.8 15.8 5.2 14.6 4.6 12.2C4.1 10.2 4.8 8.2 6.4 7.6C7.6 7.2 8.4 8.2 8.4 9.6C8.4 11.6 8.8 13.6 10.4 15.4Z"
        fill="#a8161f"
      />
      <path d="M10.2 19.4H14.6" stroke="#f9c7ca" strokeWidth="1.2" />
    </Svg>
  );
}

export function TrophyGlyph(props: GlyphProps) {
  return (
    <Svg className={props.className}>
      <path
        d="M6.6 4.6H4.6C3.5 4.6 3.1 5.5 3.4 6.6C4 9 5.7 10.6 7.8 11.1M17.4 4.6H19.4C20.5 4.6 20.9 5.5 20.6 6.6C20 9 18.3 10.6 16.2 11.1"
        stroke="#f2a516"
        strokeWidth="1.6"
      />
      <path
        d="M5.8 2.6H18.2V7.6C18.2 11.6 15.6 14.6 12 14.6S5.8 11.6 5.8 7.6Z"
        fill="#f2a516"
      />
      <path d="M10.8 14.2H13.2L13.6 17.6H10.4Z" fill="#f2a516" />
      <path d="M6.8 18.4H17.2L17.6 22.6H6.4Z" fill="#b8700a" />
      <path d="M10.6 6.2L12 5.2V10.6" stroke="#fde8b4" strokeWidth="1.3" />
    </Svg>
  );
}
