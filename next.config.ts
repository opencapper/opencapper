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
  experimental: {
    turbopackFileSystemCacheForBuild: true,
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
