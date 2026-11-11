import { env } from "@/lib/config/env";
import type { Metadata } from "next";
import type { OgSection } from "./cards";

type OgTemplate = "home" | "game" | "bet" | OgSection;

// The release in the URL makes every deploy a new image, so platforms drop their cached card.
export function ogMetadata(
  template: OgTemplate,
  locale: string,
  id?: string,
): Pick<Metadata, "openGraph" | "twitter"> {
  const query = new URLSearchParams({ locale, v: env.releaseVersion });
  if (id) query.set("id", id);
  const url = `${env.appUrl}/api/og/${template}?${query}`;
  return {
    openGraph: {
      siteName: env.appName,
      images: [{ url, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [url] },
  };
}
