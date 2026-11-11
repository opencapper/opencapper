import { SignInPrompt } from "@/components/elements/account/sign-in-prompt";
import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { SettingsForm } from "@/components/pages/navbar/settings/settings-form";
import { api, load } from "@/lib/api/client";
import { getAccount } from "@/lib/auth/session";
import { serverLocale } from "@/lib/utils/server";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata(props: Props): Promise<Metadata> {
  const t = await getTranslations({ locale: await serverLocale(props), namespace: "SETTINGS" });
  return { title: t("HEADING") };
}

export default async function SettingsPage(props: Props) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  await connection();
  const t = await getTranslations({ locale, namespace: "SETTINGS" });
  const results = await Promise.all([getAccount(), load(api.GET("/v1/books", { cache: "no-store" }))]);
  const account = results[0];
  const books = (results[1] ?? []).map((b) => b.book).filter((b) => b !== "pinnacle");
  return (
    <PageShell className="max-w-3xl">
      <PageHeading
        className="mb-0"
        label={t("LABEL")}
        title={t("HEADING")}
        description={account ? t("SUBHEADING", { email: account.user.email }) : t("SUBHEADING_SIGNED_OUT")}
      />
      {account ? (
        <SettingsForm settings={account.settings} books={books} />
      ) : (
        <SignInPrompt next="/settings" />
      )}
    </PageShell>
  );
}
