import { env } from "@/lib/config/env";
import type { CSSProperties, ReactNode } from "react";
import { FONT_MONO, FONT_SANS } from "../lib/assets";
import { C, OG_HEIGHT, OG_WIDTH } from "../lib/theme";

const GUTTER = 56;
const HEADER = 104;
const FOOTER = 92;
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

export function Mark(props: { size: number; color?: string }) {
  return (
    <svg width={props.size} height={props.size} viewBox="0 0 24 24">
      <path
        fill={props.color ?? C.text}
        fillRule="evenodd"
        d="M0 0h24v24H0zM12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14m0 3.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7"
      />
    </svg>
  );
}

export function Wordmark(props: { size: number }) {
  return (
    <Row style={{ alignItems: "center", gap: props.size * 0.6 }}>
      <Mark size={props.size * 1.1} />
      <Row
        style={{
          fontFamily: FONT_SANS,
          fontWeight: 500,
          fontSize: props.size,
          letterSpacing: -0.01 * props.size,
          color: C.text,
        }}
      >
        {env.appName.toUpperCase()}
        <span style={{ color: C.muted }}>.</span>
      </Row>
    </Row>
  );
}

export function Eyebrow(props: { children: ReactNode; color?: string }) {
  return (
    <span
      style={{
        fontFamily: FONT_MONO,
        fontSize: 15,
        letterSpacing: 2,
        whiteSpace: "nowrap",
        textTransform: "uppercase",
        color: props.color ?? C.muted,
      }}
    >
      {props.children}
    </span>
  );
}

function Line(props: { style: CSSProperties }) {
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: C.hairline,
        ...props.style,
      }}
    />
  );
}

function Tick(props: { left: number; top: number }) {
  return (
    <div
      style={{
        position: "absolute",
        left: props.left - 4,
        top: props.top - 4,
        width: 9,
        height: 9,
        backgroundColor: C.bg,
        border: `1px solid ${C.faint}`,
      }}
    />
  );
}

export function Frame(props: {
  label: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const right = OG_WIDTH - GUTTER;
  const bottom = OG_HEIGHT - FOOTER;
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        position: "relative",
        width: OG_WIDTH,
        height: OG_HEIGHT,
        backgroundColor: C.bg,
        backgroundImage:
          "radial-gradient(circle at 12% 0%, rgba(255,255,255,0.09), rgba(0,0,0,0) 55%)",
        fontFamily: FONT_SANS,
        color: C.text,
      }}
    >
      <Line style={{ left: GUTTER, top: 0, width: 1, height: OG_HEIGHT }} />
      <Line style={{ left: right, top: 0, width: 1, height: OG_HEIGHT }} />
      <Line style={{ left: 0, top: HEADER, width: OG_WIDTH, height: 1 }} />
      <Line style={{ left: 0, top: bottom, width: OG_WIDTH, height: 1 }} />
      <Tick left={GUTTER} top={HEADER} />
      <Tick left={right} top={HEADER} />
      <Tick left={GUTTER} top={bottom} />
      <Tick left={right} top={bottom} />
      <Row
        style={{
          height: HEADER,
          padding: `0 ${GUTTER + 32}px`,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Wordmark size={24} />
        <Eyebrow>{props.label}</Eyebrow>
      </Row>
      <Col
        style={{
          flexGrow: 1,
          padding: `36px ${GUTTER + 32}px`,
          overflow: "hidden",
        }}
      >
        {props.children}
      </Col>
      <Row
        style={{
          height: FOOTER,
          padding: `0 ${GUTTER + 32}px`,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontFamily: FONT_MONO, fontSize: 16, color: C.muted }}>
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
  icon?: ReactNode;
}) {
  return (
    <Col style={{ gap: 10, flexShrink: 0 }}>
      <Eyebrow>{props.label}</Eyebrow>
      <Row style={{ alignItems: "center", gap: 14 }}>
        {props.icon}
        <span
          style={{
            fontFamily: FONT_MONO,
            fontWeight: 500,
            fontSize: props.size ?? 40,
            letterSpacing: -1,
            whiteSpace: "nowrap",
            color: props.color ?? C.text,
          }}
        >
          {props.value}
        </span>
      </Row>
    </Col>
  );
}

export function Img(props: {
  src: string | null;
  size: number;
  fallback: string;
  round?: boolean;
  tile?: boolean;
}) {
  const radius = props.round ? props.size / 2 : props.tile ? props.size / 5 : 0;
  if (!props.src) {
    return (
      <Row
        style={{
          width: props.size,
          height: props.size,
          borderRadius: radius,
          border: `1px solid ${C.hairline}`,
          backgroundColor: C.fill,
          alignItems: "center",
          justifyContent: "center",
          fontFamily: FONT_MONO,
          fontWeight: 500,
          fontSize: Math.round(props.size * 0.36),
          color: C.soft,
        }}
      >
        {props.fallback}
      </Row>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.src}
      width={props.size}
      height={props.size}
      alt=""
      style={{
        borderRadius: radius,
        border: props.tile ? `1px solid ${C.hairline}` : undefined,
        objectFit: "contain",
      }}
    />
  );
}

export function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1
      ? `${words[0][0]}${words[words.length - 1][0]}`
      : name.slice(0, 2);
  return letters.toUpperCase();
}
