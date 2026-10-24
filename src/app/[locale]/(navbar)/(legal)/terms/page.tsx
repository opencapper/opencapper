import { TermsContent } from "@/components/pages/legal/terms-content";
import {
  legalMetadata,
  type LegalProps,
} from "@/components/pages/legal/legal-page";
import { serverLocale } from "@/lib/utils/server";
import { setRequestLocale } from "next-intl/server";

export function generateMetadata(props: LegalProps) {
  return legalMetadata("terms", props);
}

export default async function TermsPage(props: LegalProps) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  return <TermsContent locale={locale} />;
}
