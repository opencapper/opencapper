import { PrivacyContent } from "@/components/pages/legal/privacy-content";
import {
  legalMetadata,
  type LegalProps,
} from "@/components/pages/legal/legal-page";
import { serverLocale } from "@/lib/utils/server";
import { setRequestLocale } from "next-intl/server";

export function generateMetadata(props: LegalProps) {
  return legalMetadata("privacy", props);
}

export default async function PrivacyPage(props: LegalProps) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  return <PrivacyContent locale={locale} />;
}
