import { LoginButton } from "@/components/layout/nav/user-menu";
import { PickForm } from "@/components/pages/navbar/picks/new/pick-form";
import { getPathname } from "@/i18n/navigation";
import getQueryClient from "@/lib/react-query/client";
import { prefetchAuth } from "@/lib/react-query/prefetch";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
  const locale = await serverLocale(props);
  const t = await getTranslations({ locale, namespace: "PICK_NEW" });
  return {
    title: t("TITLE"),
    description: t("DESCRIPTION"),
    robots: { index: false },
  };
}

export default async function NewPickPage(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  const user = await prefetchAuth(getQueryClient());
  if (!user) {
    const t = await getTranslations({ locale, namespace: "PICK_NEW" });
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t("HEADING")}</h1>
        <p className="text-muted-foreground">{t("LOGIN_REQUIRED")}</p>
        <LoginButton
          returnTo={getPathname({ locale, href: "/picks/new" })}
          label
        />
      </div>
    );
  }
  return <PickForm />;
}
