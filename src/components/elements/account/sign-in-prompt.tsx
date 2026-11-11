import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import { query } from "@/lib/format";
import { useTranslations } from "next-intl";

export function SignInPrompt(props: { next: string; body?: string }) {
  const t = useTranslations("ACCOUNT");
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
        <Icon name="lock" className="text-muted-foreground size-8" />
        <p className="font-medium">{t("PROMPT_TITLE")}</p>
        <p className="text-muted-foreground max-w-md text-sm">{props.body ?? t("PROMPT_BODY")}</p>
        <Button nativeButton={false} render={<Link href={query("/sign-in", { next: props.next })} />}>
          <Icon name="log-in" />
          {t("SIGN_IN")}
        </Button>
      </CardContent>
    </Card>
  );
}
