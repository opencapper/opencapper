import { CapperProfile } from "@/components/pages/navbar/profile/capper-profile";
import { DataTableProvider } from "@/components/provider/state/data-table-provider";
import { parseDataTableStores } from "@/lib/api/typebox/data-table";
import { DATA_TABLES_COOKIE } from "@/lib/config/constants";
import {
  buildMetadata,
  ogImage,
  orNull,
  pickMetadata,
  profileText,
} from "@/lib/seo/metadata";
import { getCookieValue, serverLocale } from "@/lib/utils/server";
import { serverEnv } from "@/server/env";
import { findPick } from "@/server/picks/picks.service";
import { getCapperStats } from "@/server/stats/stats.service";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string; username: string }>;
  searchParams: Promise<{ pick?: string | string[] }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const username = decodeURIComponent((await props.params).username);
  const href = { pathname: "/u/[username]" as const, params: { username } };
  const t = await getTranslations({ locale, namespace: "PROFILE" });
  const stats = await orNull(getCapperStats(username));
  if (stats?.hidden)
    return buildMetadata({
      locale,
      href,
      title: t("HIDDEN.TITLE"),
      description: t("HIDDEN.BODY"),
      image: ogImage("home", locale),
      index: false,
    });
  const pickId = (await props.searchParams).pick;
  if (typeof pickId === "string" && /^[1-9][0-9]{0,8}$/.test(pickId)) {
    const pick = await orNull(findPick({ pickId: Number(pickId) }));
    if (pick && pick.username === username.toLowerCase())
      return pickMetadata(locale, href, pick);
  }
  const text =
    stats && stats.picks > 0
      ? await profileText(locale, stats)
      : {
          title: t("TITLE", { username }),
          description: t("DESCRIPTION", { username }),
        };
  return buildMetadata({
    locale,
    href,
    ...text,
    image: ogImage("profile", locale, { username }),
  });
}

export default async function CapperPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  const username = decodeURIComponent((await props.params).username);
  const pick = (await props.searchParams).pick;
  const tableStores = parseDataTableStores(
    await getCookieValue<unknown>(DATA_TABLES_COOKIE),
  );
  return (
    <DataTableProvider data={tableStores}>
      <CapperProfile
        username={username}
        ranking={serverEnv.ranking}
        highlightPickId={typeof pick === "string" ? pick : null}
      />
    </DataTableProvider>
  );
}
