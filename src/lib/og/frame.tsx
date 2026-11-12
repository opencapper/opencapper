import { CREST_SLICE } from "@/components/elements/brand/brand";
import { env } from "@/lib/config/env";
import type { CSSProperties, ReactNode } from "react";
import {
  FONT_DISPLAY,
  FONT_MONO,
  FONT_NUM,
  FONT_SANS,
  FONT_SERIF,
} from "./assets";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// The Matchday paper: ink type, pitch green for a price that beats the fair line, vermilion for the edge.
export const C = {
  bg: "#f2ede3",
  text: "#141210",
  soft: "#3b3631",
  muted: "#7a7166",
  faint: "#b4aa9b",
  hairline: "#141210",
  fill: "#e8e1d3",
  win: "#0e5a36",
  edge: "#ff4b1f",
  board: "#0f0e0c",
  chalk: "#f7f3ea",
  gold: "#f2c14e",
} as const;

const GUTTER = 64;
const HEADER = 96;
const FOOTER = 84;
const HOST = new URL(env.appUrl).host;

export function Row(props: { style?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", ...props.style }}>{props.children}</div>
  );
}

export function Col(props: { style?: CSSProperties; children?: ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", ...props.style }}>
      {props.children}
    </div>
  );
}

export function Crest(props: { size: number; color?: string }) {
  const color = props.color ?? C.text;
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 48 48">
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke={color}
        strokeWidth="3.5"
      />
      <path d="M3 24H45" stroke={color} strokeWidth="2.5" />
      <circle
        cx="24"
        cy="24"
        r="8.5"
        fill="none"
        stroke={color}
        strokeWidth="2.5"
      />
      <path d={CREST_SLICE} fill={C.edge} />
      <circle cx="24" cy="24" r="2.6" fill={color} />
    </svg>
  );
}

export function Wordmark(props: { size: number }) {
  return (
    <Row style={{ alignItems: "center", gap: props.size * 0.45 }}>
      <Crest size={props.size * 1.25} />
      <Row style={{ alignItems: "baseline" }}>
        <span
          style={{
            fontFamily: FONT_DISPLAY,
            fontSize: props.size,
            lineHeight: 1,
            color: C.text,
          }}
        >
          OPEN
        </span>
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontStyle: "italic",
            fontSize: props.size * 1.14,
            lineHeight: 1,
            color: C.edge,
            marginLeft: 2,
          }}
        >
          ev
        </span>
      </Row>
    </Row>
  );
}

export function Eyebrow(props: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 16,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        color: props.color ?? C.soft,
      }}
    >
      {props.children}
    </span>
  );
}

function Pitch() {
  return (
    <svg
      width="560"
      height="370"
      viewBox="0 0 760 500"
      style={{
        position: "absolute",
        right: -150,
        bottom: -120,
        transform: "rotate(-8deg)",
      }}
    >
      <rect width="760" height="500" rx="20" fill="#0e5a36" />
      <rect x="152" width="76" height="500" fill="#0a4529" />
      <rect x="456" width="76" height="500" fill="#0a4529" />
      <g fill="none" stroke="#f7f3ea" strokeOpacity="0.55" strokeWidth="3">
        <rect x="20" y="20" width="720" height="460" />
        <path d="M380 20V480" />
        <circle cx="380" cy="250" r="70" />
      </g>
    </svg>
  );
}

export function Frame(props: {
  label: ReactNode;
  footer?: ReactNode;
  pitch?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: C.bg,
        fontFamily: FONT_SANS,
        color: C.text,
        overflow: "hidden",
      }}
    >
      {props.pitch && <Pitch />}
      <Row
        style={{
          height: HEADER,
          padding: `0 ${GUTTER}px`,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `3px solid ${C.hairline}`,
        }}
      >
        <Wordmark size={34} />
        <Eyebrow>{props.label}</Eyebrow>
      </Row>
      <Col
        style={{
          flexGrow: 1,
          padding: `36px ${GUTTER}px`,
          overflow: "hidden",
        }}
      >
        {props.children}
      </Col>
      <Row
        style={{
          height: FOOTER,
          padding: `0 ${GUTTER}px`,
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `3px solid ${C.hairline}`,
          backgroundColor: C.bg,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.soft }}>
          {HOST}
        </span>
        {props.footer}
      </Row>
    </div>
  );
}

export function Stat(props: {
  label: ReactNode;
  value: ReactNode;
  color?: string;
  size?: number;
}) {
  return (
    <Col style={{ gap: 6, flexShrink: 0 }}>
      <Eyebrow color={C.muted}>{props.label}</Eyebrow>
      <span
        style={{
          fontFamily: FONT_NUM,
          fontWeight: 700,
          fontSize: props.size ?? 56,
          lineHeight: 1,
          whiteSpace: "nowrap",
          color: props.color ?? C.text,
        }}
      >
        {props.value}
      </span>
    </Col>
  );
}

export function TeamImage(props: {
  src: string | null;
  size: number;
  name: string;
}) {
  if (!props.src) {
    const words = props.name.split(/\s+/).filter(Boolean);
    const letters =
      words.length > 1
        ? `${words[0][0]}${words[words.length - 1][0]}`
        : props.name.slice(0, 2);
    return (
      <Row
        style={{
          width: props.size,
          height: props.size,
          borderRadius: props.size / 2,
          border: `2px solid ${C.text}`,
          backgroundColor: C.fill,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_DISPLAY,
          fontSize: Math.round(props.size * 0.38),
          color: C.text,
        }}
      >
        {letters.toUpperCase()}
      </Row>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={props.src}
      width={props.size}
      height={props.size}
      alt=""
      style={{ objectFit: "contain" }}
    />
  );
}
