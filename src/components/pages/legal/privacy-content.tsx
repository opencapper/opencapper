import { LegalDoc, LegalIdentity } from "@/components/pages/legal/legal-doc";
import { LEGAL_VALUES } from "@/components/pages/legal/legal-page";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function PrivacyContent(props: { locale: Locale }) {
  const t = await getTranslations("LEGAL.PRIVACY");
  const v = LEGAL_VALUES;
  return (
    <LegalDoc
      locale={props.locale}
      title={t("TITLE")}
      intro={t("INTRO", v)}
      sections={[
        {
          title: t("CONTROLLER_TITLE"),
          body: [
            t("CONTROLLER_BODY"),
            <LegalIdentity key="controller" contact />,
            t("CONTROLLER_DPO"),
          ],
        },
        {
          title: t("HOSTING_TITLE"),
          body: [
            t("HOSTING_SERVER"),
            t("HOSTING_CLOUDFLARE"),
            t("HOSTING_LOGS"),
            t("HOSTING_BASIS"),
          ],
        },
        {
          title: t("ACCOUNT_TITLE"),
          body: [t("ACCOUNT_INTRO")],
          items: [
            t("ACCOUNT_DISCORD"),
            t("ACCOUNT_GOOGLE"),
            t("ACCOUNT_TELEGRAM"),
          ],
          after: [t("ACCOUNT_DETAILS"), t("ACCOUNT_BASIS")],
        },
        {
          title: t("COOKIES_TITLE"),
          body: [t("COOKIES_INTRO")],
          items: [
            t("COOKIES_SESSION"),
            t("COOKIES_OAUTH"),
            t("COOKIES_THEME"),
            t("COOKIES_TABLES"),
            t("COOKIES_MODE"),
          ],
          after: [t("COOKIES_LOCALE")],
        },
        {
          title: t("PICKS_TITLE"),
          body: [t("PICKS_BODY", v), t("PICKS_LOG"), t("PICKS_BASIS")],
        },
        { title: t("BOTS_TITLE"), body: [t("BOTS_BODY")] },
        {
          title: t("IMPORTED_TITLE"),
          body: [t("IMPORTED_INTRO", v)],
          items: [t("IMPORTED_POLYMARKET"), t("IMPORTED_REDDIT")],
          after: [
            t("IMPORTED_DETAILS"),
            t("IMPORTED_BASIS"),
            t("IMPORTED_RIGHTS", v),
          ],
        },
        { title: t("SOURCES_TITLE"), body: [t("SOURCES_BODY")] },
        {
          title: t("EXTERNAL_TITLE"),
          body: [t("EXTERNAL_INTRO")],
          items: [
            t("EXTERNAL_AVATARS"),
            t("EXTERNAL_TELEGRAM"),
            t("EXTERNAL_FONTS"),
          ],
          after: [t("EXTERNAL_BASIS")],
        },
        {
          title: t("PAYMENTS_TITLE"),
          body: [
            t("PAYMENTS_SELLER"),
            t("PAYMENTS_BUYER"),
            t("PAYMENTS_BASIS"),
          ],
        },
        { title: t("RECIPIENTS_TITLE"), body: [t("RECIPIENTS_BODY")] },
        {
          title: t("RETENTION_TITLE"),
          body: [],
          items: [
            t("RETENTION_SESSIONS"),
            t("RETENTION_ACCOUNT"),
            t("RETENTION_PICKS"),
            t("RETENTION_RATE"),
            t("RETENTION_BACKUPS"),
          ],
        },
        { title: t("DELETION_TITLE"), body: [t("DELETION_BODY", v)] },
        {
          title: t("RIGHTS_TITLE"),
          body: [t("RIGHTS_BODY", v), t("RIGHTS_COMPLAINT")],
        },
        { title: t("MINORS_TITLE"), body: [t("MINORS_BODY", v)] },
        { title: t("CHANGES_TITLE"), body: [t("CHANGES_BODY")] },
        { title: t("CONTACT_TITLE"), body: [t("CONTACT_BODY", v)] },
      ]}
    />
  );
}
