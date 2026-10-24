import { CapperCheck } from "@/components/pages/navbar/check/capper-check";
import {
  checkTerm,
  loadCheckParams,
} from "@/components/pages/navbar/check/check-params";
import getQueryClient from "@/lib/react-query/client";
import { queryKeys } from "@/lib/react-query/keys";
import { prefetchElysia, serverRpc } from "@/lib/react-query/prefetch";
import { buildMetadata, ogImage } from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { headers } from "next/headers";
import { Suspense } from "react";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "CHECK" });
  const q = checkTerm((await loadCheckParams(props.searchParams)).q);
  return buildMetadata({
    locale,
    href: "/check",
    title: t("TITLE"),
    description: t("DESCRIPTION"),
    image: ogImage("home", locale),
    index: q.length === 0,
  });
}

// The in process call has no client address of its own; the lookup rate limit keys on it.
async function clientHeaders(): Promise<Record<string, string>> {
  const request = await headers();
  const out: Record<string, string> = {};
  for (const name of ["cf-connecting-ip", "x-forwarded-for"]) {
    const value = request.get(name);
    if (value) out[name] = value;
  }
  return out;
}

export default async function CheckPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const q = checkTerm((await loadCheckParams(props.searchParams)).q);
  const queryClient = getQueryClient();
  if (q) {
    const forwarded = await clientHeaders();
    await prefetchElysia(queryClient, queryKeys.capperCheck(q), (request) =>
      serverRpc.api.check.get({
        query: { q },
        headers: { ...request.headers, ...forwarded },
      }),
    );
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense>
        <CapperCheck />
      </Suspense>
    </HydrationBoundary>
  );
}
