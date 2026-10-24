import { LegalDoc } from "@/components/pages/legal/legal-doc";
import { LEGAL_VALUES } from "@/components/pages/legal/legal-page";
import { env } from "@/lib/config/env";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function TermsContent(props: { locale: Locale }) {
  const t = await getTranslations("LEGAL.TERMS");
  const v = LEGAL_VALUES;
  return (
    <LegalDoc
      locale={props.locale}
      title={t("TITLE")}
      intro={t("INTRO", v)}
      sections={[
        { title: t("SERVICE_TITLE"), body: [t("SERVICE_BODY", v)] },
        { title: t("INFO_TITLE"), body: [t("INFO_BODY", v)] },
        { title: t("ACCOUNT_TITLE"), body: [t("ACCOUNT_BODY")] },
        { title: t("PICKS_TITLE"), body: [t("PICKS_BODY")] },
        { title: t("ACCURACY_TITLE"), body: [t("ACCURACY_BODY")] },
        { title: t("IMPORTED_TITLE"), body: [t("IMPORTED_BODY", v)] },
        {
          title: t("CONDUCT_TITLE"),
          body: [t("CONDUCT_INTRO")],
          items: [
            t("CONDUCT_FAKE"),
            t("CONDUCT_MANIPULATION"),
            t("CONDUCT_ABUSE"),
            t("CONDUCT_CONTENT"),
            t("CONDUCT_LAW"),
          ],
        },
        { title: t("MODERATION_TITLE"), body: [t("MODERATION_BODY", v)] },
        { title: t("CONTENT_TITLE"), body: [t("CONTENT_BODY")] },
        {
          title: t("OPEN_SOURCE_TITLE"),
          body: [t("OPEN_SOURCE_BODY", { ...v, githubUrl: env.githubUrl })],
        },
        { title: t("CHANGES_TITLE"), body: [t("CHANGES_BODY")] },
        { title: t("LIABILITY_TITLE"), body: [t("LIABILITY_BODY")] },
        { title: t("LAW_TITLE"), body: [t("LAW_BODY")] },
        { title: t("CONTACT_TITLE"), body: [t("CONTACT_BODY", v)] },
      ]}
    />
  );
}
