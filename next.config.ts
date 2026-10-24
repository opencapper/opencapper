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
  // Type errors gate `bun typecheck`, not the deploy build.
  typescript: { ignoreBuildErrors: true },
  // Migrations and OG fonts are read from disk at runtime, which the file tracer cannot see.
  outputFileTracingIncludes: {
    "/**": [
      "./drizzle/**/*",
      "./node_modules/@fontsource/geist/files/geist-latin*-normal.woff",
      "./node_modules/@fontsource/geist-mono/files/geist-mono-latin*-normal.woff",
      "./node_modules/@fontsource/noto-sans-jp/files/noto-sans-jp-*-400-normal.woff",
    ],
  },
  // Bundling satori rewrites harfbuzz's locateFile base to "/ROOT" and every OG image 500s (next 16.3.2 regression, seen in unorouter).
  serverExternalPackages: ["satori", "sharp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "r2.thesportsdb.com" },
      { protocol: "https", hostname: "www.thesportsdb.com" },
    ],
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
    // TypeScript 7 ships no JS compiler API.
    useTypeScriptCli: true,
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
