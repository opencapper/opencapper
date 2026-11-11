import { AuthPage } from "@/components/pages/navbar/account/auth-page";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "ACCOUNT" });
  return { title: t("REGISTER") };
}

export default async function RegisterPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return <AuthPage mode="register" searchParams={props.searchParams} />;
}
