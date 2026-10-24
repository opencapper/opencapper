import { VerifyLog } from "@/components/pages/navbar/verify/verify-log";
import {
  buildMetadata,
  ogImage,
  orNull,
  pickMetadata,
} from "@/lib/seo/metadata";
import { serverLocale } from "@/lib/utils/server";
import { findPick, type PickRef } from "@/server/picks/picks.service";
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
  const pick = ref ? await orNull(findPick(ref)) : null;
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
  return <VerifyLog initial={initial} />;
}
