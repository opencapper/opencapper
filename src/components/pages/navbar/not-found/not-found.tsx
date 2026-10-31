import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function NotFound() {
  const t = useTranslations("NOT_FOUND");
  return (
    <div className="mx-auto max-w-2xl px-4 py-24">
      <Card>
        <CardContent className="flex flex-col items-start gap-4">
          <p className="label-mono text-foreground/45 text-[10px]">
            {t("CODE")}
          </p>
          <h1 className="text-xl font-medium tracking-tight">{t("HEADING")}</h1>
          <p className="text-muted-foreground text-sm">{t("BODY")}</p>
          <div className="flex flex-wrap gap-2">
            <Button nativeButton={false} render={<Link href="/" />}>
              <Icon name="house" />
              {t("HOME")}
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/check" />}
            >
              <Icon name="user-search" />
              {t("CHECK")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
