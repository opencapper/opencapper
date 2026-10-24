import { BadgeParams } from "@/lib/api/typebox/check";
import type { CheckRecord } from "@/lib/types";
import { badgeRecord } from "@/server/check/check.service";
import { Elysia } from "elysia";
import { badgeSvg } from "./badge";

const USERNAME = /^@?([a-z0-9_.]{2,32})$/i;

const CACHE = {
  found: "public, max-age=300, s-maxage=600, stale-while-revalidate=3600",
  none: "public, max-age=60, s-maxage=60",
};

export const badgeRoute = new Elysia({ prefix: "/badge" }).get(
  "/:username",
  async (ctx) => {
    const match = USERNAME.exec(ctx.params.username.replace(/\.svg$/i, ""));
    const username = match ? match[1].toLowerCase() : "unknown";
    let record: CheckRecord | null = null;
    try {
      record = match ? await badgeRecord(username) : null;
    } catch (error) {
      console.error(`[badge] ${username} failed, serving neutral badge`, error);
    }
    return new Response(badgeSvg(username, record), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": CACHE[record ? "found" : "none"],
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Content-Security-Policy":
          "default-src 'none'; style-src 'unsafe-inline'",
      },
    });
  },
  { params: BadgeParams },
);
