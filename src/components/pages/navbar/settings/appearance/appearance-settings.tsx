import { PageHeading } from "@/components/elements/page/page-heading";
import { getTranslations } from "next-intl/server";
import { AppearanceEditor } from "./appearance-editor";

export async function AppearanceSettings() {
  const t = await getTranslations("APPEARANCE");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <PageHeading
        label={t("LABEL")}
        title={t("HEADING")}
        description={t("SUBHEADING")}
      />
      <AppearanceEditor />
    </div>
  );
}
