import { MARK_PLUS } from "@/components/elements/brand/brand";
import { env } from "@/lib/config/env";
import type { CSSProperties, ReactNode } from "react";
import { FONT_MONO, FONT_SANS } from "./assets";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// The site's dark surface: neutral greys, green only for value.
export const C = {
  bg: "#0b0b0c",
  text: "#ececee",
  soft: "#b4b4bb",
  muted: "#7d7d86",
  hairline: "#26262a",
  fill: "#1b1b1e",
  win: "#3fcb83",
} as const;

const GUTTER = 64;
const HEADER = 96;
const FOOTER = 80;
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

function Mark(props: { size: number }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24">
      <rect width="24" height="24" rx="6" fill={C.text} />
      <path
        d={MARK_PLUS}
        stroke={C.bg}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function Wordmark(props: { size: number }) {
  return (
    <Row style={{ alignItems: "center", gap: props.size * 0.4 }}>
      <Mark size={props.size * 1.2} />
      <Row
        style={{
          fontSize: props.size,
          fontWeight: 600,
          letterSpacing: -0.02 * props.size,
          lineHeight: 1,
        }}
      >
        <span style={{ color: C.text }}>Open</span>
        <span style={{ color: C.muted }}>EV</span>
      </Row>
    </Row>
  );
}

export function Eyebrow(props: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontSize: 18,
        whiteSpace: "nowrap",
        color: props.color ?? C.soft,
      }}
    >
      {props.children}
    </span>
  );
}

export function Frame(props: {
  label: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: C.bg,
        fontFamily: FONT_SANS,
        color: C.text,
        overflow: "hidden",
      }}
    >
      <Row
        style={{
          height: HEADER,
          padding: `0 ${GUTTER}px`,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${C.hairline}`,
        }}
      >
        <Wordmark size={32} />
        <Eyebrow>{props.label}</Eyebrow>
      </Row>
      <Col
        style={{
          flexGrow: 1,
          padding: `40px ${GUTTER}px`,
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
          borderTop: `1px solid ${C.hairline}`,
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 18, color: C.muted }}>
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
    <Col style={{ gap: 8, flexShrink: 0 }}>
      <Eyebrow color={C.muted}>{props.label}</Eyebrow>
      <span
        style={{
          fontFamily: FONT_MONO,
          fontWeight: 500,
          fontSize: props.size ?? 52,
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
          backgroundColor: C.fill,
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 600,
          fontSize: Math.round(props.size * 0.36),
          color: C.soft,
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
