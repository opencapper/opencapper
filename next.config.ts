import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // The build adapter assembles its own traced tree; standalone post-processing fails on files it pruned.
  output:
    process.env.STANDALONE && !process.env.NEXT_ADAPTER_PATH
      ? "standalone"
      : undefined,
  // Asset URLs carry the commit so a page from build N never loads build N+1 chunks under a reused name.
  deploymentId: process.env.NEXT_DEPLOYMENT_ID,
  // Type errors gate `bun run typecheck`, not the deploy build.
  typescript: { ignoreBuildErrors: true },
  // OG fonts are read from disk at runtime, which the file tracer cannot see.
  outputFileTracingIncludes: {
    "/api/og/**": [
      "./node_modules/@fontsource/manrope/files/manrope-latin*-normal.woff",
      "./node_modules/@fontsource/dm-mono/files/dm-mono-latin*-normal.woff",
      "./node_modules/@fontsource/anton/files/anton-latin*-normal.woff",
      "./node_modules/@fontsource/instrument-serif/files/instrument-serif-latin*-italic.woff",
      "./node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin*-700-normal.woff",
      "./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-*-400-normal.woff",
    ],
  },
  // Bundling satori rewrites harfbuzz's locateFile base to "/ROOT" and every OG image 500s.
  serverExternalPackages: ["satori", "sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
  },
  async redirects() {
    return [
      {
        source: "/:locale/register",
        destination: "/:locale/sign-in",
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: ["./public/i18n/en.json"],
    messages: {
      format: "json",
      path: "./public/i18n",
      locales: "infer",
      precompile: true,
    },
  },
});

export default withNextIntl(nextConfig);
