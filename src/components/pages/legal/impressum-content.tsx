import {
  LegalContact,
  LegalDoc,
  LegalIdentity,
} from "@/components/pages/legal/legal-doc";
import { LEGAL_VALUES } from "@/components/pages/legal/legal-page";
import { env } from "@/lib/config/env";
import type { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";

export async function ImpressumContent(props: { locale: Locale }) {
  const t = await getTranslations("LEGAL.IMPRESSUM");
  return (
    <LegalDoc
      locale={props.locale}
      title={t("TITLE")}
      intro={t("INTRO", LEGAL_VALUES)}
      sections={[
        { title: t("PROVIDER_TITLE"), body: [<LegalIdentity key="id" />] },
        {
          title: t("CONTACT_TITLE"),
          body: [<LegalContact key="contact" boxed />],
        },
        {
          title: t("VAT_TITLE"),
          body: [t("VAT_BODY", { vatId: env.legalVatId })],
        },
        {
          title: t("RESPONSIBLE_TITLE"),
          body: [<LegalIdentity key="responsible" />],
        },
        { title: t("DISPUTE_TITLE"), body: [t("DISPUTE_BODY")] },
      ]}
    />
  );
}
