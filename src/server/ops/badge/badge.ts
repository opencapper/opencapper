import type { CheckRecord } from "@/lib/types";

const HEIGHT = 20;
const PAD = 7;
const FONT_SIZE = 11;
// Monospace advance is 0.6em; textLength pins it in case the viewer lacks the font.
const CHAR_WIDTH = FONT_SIZE * 0.6;
const LABEL = "OPENCAPPER";

const COLORS = {
  label: "#0a0a0a",
  value: "#262626",
  muted: "#a3a3a3",
  text: "#fafafa",
  border: "#404040",
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function roiText(roi: number): string {
  const percent = (roi * 100).toFixed(1);
  return `${roi > 0 ? "+" : ""}${percent}%`;
}

export type BadgeRecord = { total: CheckRecord; withHistory: boolean };

// The scope is spelled out so the badge never shows a bigger number than the profile without saying why.
export function badgeValue(badge: BadgeRecord | null): string {
  if (!badge) return "no record";
  const record = badge.total;
  if (record.graded === 0) return "no graded picks";
  const scope = badge.withHistory ? "live + on chain history" : "live";
  return `${record.wins}-${record.losses}-${record.pushes} | ROI ${roiText(record.roi)} | ${scope}`;
}

function segment(text: string, x: number, fill: string, color: string) {
  const width = Math.round(text.length * CHAR_WIDTH + PAD * 2);
  const textWidth = Math.round(text.length * CHAR_WIDTH);
  const body = `<rect x="${x}" width="${width}" height="${HEIGHT}" fill="${fill}"/><text x="${x + PAD}" y="14" fill="${color}" textLength="${textWidth}" lengthAdjust="spacingAndGlyphs">${escapeXml(text)}</text>`;
  return { width, body };
}

export function badgeSvg(username: string, record: BadgeRecord | null) {
  const value = badgeValue(record);
  const label = segment(LABEL, 0, COLORS.label, COLORS.muted);
  const right = segment(
    value,
    label.width,
    COLORS.value,
    record && record.total.graded > 0 ? COLORS.text : COLORS.muted,
  );
  const width = label.width + right.width;
  const title = escapeXml(`OpenCapper record of @${username}: ${value}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${HEIGHT}" role="img" aria-label="${title}"><title>${title}</title><clipPath id="r"><rect width="${width}" height="${HEIGHT}" rx="3"/></clipPath><g clip-path="url(#r)" font-family="Geist Mono,ui-monospace,SFMono-Regular,Menlo,Consolas,monospace" font-size="${FONT_SIZE}">${label.body}${right.body}</g><rect x="0.5" y="0.5" width="${width - 1}" height="${HEIGHT - 1}" rx="2.5" fill="none" stroke="${COLORS.border}"/></svg>`;
}
