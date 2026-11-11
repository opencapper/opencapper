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
  return { title: t("SIGN_IN") };
}

export default async function SignInPage(props: Props) {
  setRequestLocale(await serverLocale(props));
  return <AuthPage searchParams={props.searchParams} />;
}
