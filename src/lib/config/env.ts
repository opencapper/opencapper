const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://opencapper.coding-global.com";

export const env = {
  appName: "OpenCapper",
  appUrl,
  siteOrigin: new URL(appUrl).origin,
  githubUrl: "https://github.com/opencapper/opencapper",
  discordInviteUrl: "https://discord.gg/YQhcPDrUJC",
  releaseVersion: process.env.NEXT_PUBLIC_RELEASE_VERSION ?? "dev",
  // Impressum identity is set at image build so it stays out of this public repo; the Dockerfile refuses to build without it.
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME ?? "",
  legalAddress: (process.env.NEXT_PUBLIC_LEGAL_ADDRESS ?? "").replaceAll(
    "\\n",
    "\n",
  ),
  legalVatId: process.env.NEXT_PUBLIC_LEGAL_VAT_ID ?? "",
  legalEmail: process.env.NEXT_PUBLIC_LEGAL_EMAIL ?? "",
} as const;
