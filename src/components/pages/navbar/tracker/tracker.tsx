import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const FEATURES = ["FEATURE_LOG", "FEATURE_CLV", "FEATURE_ROI", "FEATURE_BOOKS"] as const;

export function Tracker() {
  const t = useTranslations("TRACKER");
  return (
    <PageShell className="max-w-3xl">
      <PageHeading className="mb-0" label={t("LABEL")} title={t("HEADING")} description={t("SUBHEADING")} />
      <Card>
        <CardContent className="flex flex-col gap-4">
          <ul className="flex flex-col gap-2 text-sm">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <Icon name="check" className="text-success mt-0.5 size-4 shrink-0" />
                <span>{t(f)}</span>
              </li>
            ))}
          </ul>
          <div>
            <Button nativeButton={false} render={<Link href="/value-bets" />}>
              <Icon name="trending-up" />
              {t("CTA")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
