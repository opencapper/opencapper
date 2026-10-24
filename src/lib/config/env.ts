const appUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://opencapper.coding-global.com";

export const env = {
  appName: "OpenCapper",
  appUrl,
  siteOrigin: new URL(appUrl).origin,
  githubUrl: "https://github.com/opencapper/opencapper",
  releaseVersion: process.env.NEXT_PUBLIC_RELEASE_VERSION ?? "dev",
} as const;
