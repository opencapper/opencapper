import { Geist, Geist_Mono } from "next/font/google";

// Two faces only: one grotesk for words, one mono with tabular figures for every number.
const sans = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist",
  display: "swap",
});

const mono = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const fontVariables = `${sans.variable} ${mono.variable}`;
