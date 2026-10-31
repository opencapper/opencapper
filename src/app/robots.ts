import { env } from "@/lib/config/env";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${env.siteOrigin}/sitemap.xml`,
  };
}
