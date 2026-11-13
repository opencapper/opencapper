import { Geist, Geist_Mono } from "next/font/google";

// Two faces only: one grotesk for words, one mono with tabular figures for every number.
// "optional" keeps first paint on the metric matched fallback instead of waiting for a swap;
// the face is cached for every later page.
const sans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
  display: "optional",
});

const mono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
  display: "optional",
  preload: false,
});

export const fontVariables = `${sans.variable} ${mono.variable}`;
