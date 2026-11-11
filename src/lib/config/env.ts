const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://openev.coding-global.com";

export const env = {
  appName: "OpenEV",
  appUrl,
  siteOrigin: new URL(appUrl).origin,
  githubUrl: "https://github.com/openplusev/openev",
  discordInviteUrl: "https://discord.gg/YQhcPDrUJC",
  // Server shared with the alert bot; Discord only delivers DMs to members of a common server.
  alertsInviteUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE || undefined,
  releaseVersion: process.env.NEXT_PUBLIC_RELEASE_VERSION ?? "dev",
} as const;
