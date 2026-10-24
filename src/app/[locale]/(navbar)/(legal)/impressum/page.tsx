import { ImpressumContent } from "@/components/pages/legal/impressum-content";
import {
  legalMetadata,
  type LegalProps,
} from "@/components/pages/legal/legal-page";
import { serverLocale } from "@/lib/utils/server";
import { setRequestLocale } from "next-intl/server";

export function generateMetadata(props: LegalProps) {
  return legalMetadata("impressum", props);
}

export default async function ImpressumPage(props: LegalProps) {
  const locale = await serverLocale(props);
  setRequestLocale(locale);
  return <ImpressumContent locale={locale} />;
}
