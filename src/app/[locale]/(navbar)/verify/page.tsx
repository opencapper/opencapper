import {
  parseSearch,
  type SearchTarget,
} from "@/components/pages/navbar/verify/search-target";
import { VerifyLog } from "@/components/pages/navbar/verify/verify-log";
import getQueryClient from "@/lib/react-query/client";
import { queryKeys } from "@/lib/react-query/keys";
import { prefetchElysia, serverRpc } from "@/lib/react-query/prefetch";
import {
  buildMetadata,
  ogImage,
  orNull,
  pickMetadata,
} from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { getPublicPick } from "@/server/picks/lookup.service";
import type { PickRef } from "@/server/picks/picks.service";
import {
  dehydrate,
  HydrationBoundary,
  type QueryClient,
} from "@tanstack/react-query";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

const SEQ = /^[1-9][0-9]{0,8}$/;

function pickRef(query: Record<string, string | string[] | undefined>) {
  const pick = single(query.pick);
  const user = single(query.user).replace(/^@/, "");
  const seq = single(query.seq);
  if (SEQ.test(pick)) return { pickId: Number(pick) } satisfies PickRef;
  if (user && SEQ.test(seq))
    return { username: user, sequence: Number(seq) } satisfies PickRef;
  return null;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const ref = pickRef(await props.searchParams);
  const pick = ref ? await orNull(getPublicPick(ref)) : null;
  if (pick) return pickMetadata(locale, "/verify", pick);
  const t = await getTranslations({ locale, namespace: "VERIFY" });
  return buildMetadata({
    locale,
    href: "/verify",
    title: t("TITLE"),
    description: t("DESCRIPTION"),
    image: ogImage("verify", locale),
  });
}

export default async function VerifyPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const query = await props.searchParams;
  const pick = single(query.pick);
  const user = single(query.user);
  const seq = single(query.seq);
  const initial = pick || (user && seq ? `${user}#${seq}` : user);
  const queryClient = getQueryClient();
  // The log entry check itself stays in the browser: it hashes the entry there.
  await Promise.all([
    prefetchElysia(queryClient, queryKeys.logHead(), (headers) =>
      serverRpc.api.log.head.get(headers),
    ),
    prefetchElysia(queryClient, queryKeys.logAnchors(), (headers) =>
      serverRpc.api.log.anchors.get(headers),
    ),
    prefetchSearch(queryClient, parseSearch(initial)),
  ]);
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <VerifyLog initial={initial} />
    </HydrationBoundary>
  );
}

// The search result the first render shows, under the client's exact key (usernames lowercased).
function prefetchSearch(queryClient: QueryClient, target: SearchTarget | null) {
  if (!target) return null;
  if (target.kind === "pick")
    return prefetchElysia(
      queryClient,
      queryKeys.pick(target.pickId),
      (headers) =>
        serverRpc.api.picks({ id: String(target.pickId) }).get(headers),
    );
  const username = target.username.toLowerCase();
  const user = serverRpc.api.users({ username });
  if (target.kind === "user")
    return prefetchElysia(
      queryClient,
      queryKeys.userPick(username, target.seq),
      (headers) => user.picks({ seq: String(target.seq) }).get(headers),
    );
  return prefetchElysia(queryClient, queryKeys.userPicks(username), (headers) =>
    user.picks.get(headers),
  );
}
