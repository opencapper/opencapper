import { GameView } from "@/components/pages/navbar/games/game";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import { ogMetadata } from "@/lib/og/metadata";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "GAME" });
  const id = decodeURIComponent((await props.params).id);
  return { title: t("META_TITLE"), ...ogMetadata("game", locale, id) };
}

export default async function GamePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const id = decodeURIComponent((await props.params).id);
  const data = await load(api.GET("/v1/games/{id}", { params: { path: { id } }, cache: "no-store" }));
  return <GameView id={id} data={data} now={Date.now()} />;
}
