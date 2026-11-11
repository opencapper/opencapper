import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: "OpenEV", template: "%s | OpenEV" },
  description: "Value bets and arbs from soft bookmakers, priced against the sharp fair line, with a public record.",
  robots: { index: false, follow: false },
};

export default function RootLayout(props: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full lg:flex">
        <Sidebar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-10">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">{props.children}</div>
        </main>
      </body>
    </html>
  );
}
