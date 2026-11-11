import { GameView } from "@/components/pages/navbar/games/game";
import { api, load } from "@/lib/api/client";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "GAME" });
  return { title: t("META_TITLE") };
}

export default async function GamePage(props: Props) {
  setRequestLocale(await serverLocale(props));
  await connection();
  const id = decodeURIComponent((await props.params).id);
  const data = await load(api.GET("/v1/games/{id}", { params: { path: { id } }, cache: "no-store" }));
  return <GameView data={data} now={Date.now()} />;
}
