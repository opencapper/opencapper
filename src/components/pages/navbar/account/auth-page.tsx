import { CARD_LABEL, PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPathname, redirect } from "@/i18n/navigation";
import { loginError, type LoginError } from "@/lib/auth/discord";
import { getAccount } from "@/lib/auth/session";
import { param, query, type Translate } from "@/lib/format";
import { getLocale, getTranslations } from "next-intl/server";
import Image from "next/image";

function loginErrorText(error: LoginError, t: Translate): string {
  if (error === "invalid_state") return t("ACCOUNT.LOGIN_ERRORS.INVALID_STATE");
  if (error === "invalid_redirect_uri") return t("ACCOUNT.LOGIN_ERRORS.INVALID_REDIRECT_URI");
  if (error === "discord_denied") return t("ACCOUNT.LOGIN_ERRORS.DISCORD_DENIED");
  return t("ACCOUNT.LOGIN_ERRORS.DISCORD_UNAVAILABLE");
}

export async function AuthPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const next = param(searchParams.next) ?? "/value-bets";
  const error = param(searchParams.error);
  const locale = await getLocale();
  if (await getAccount()) redirect({ href: next, locale });
  const t = await getTranslations();
  const start = query("/api/auth/discord", { next: getPathname({ href: next, locale }), locale });
  return (
    <PageShell className="max-w-md">
      <PageHeading
        className="mb-0"
        label={t("ACCOUNT.LABEL")}
        title={t("ACCOUNT.SIGN_IN_HEADING")}
        description={t("ACCOUNT.WHY")}
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className={CARD_LABEL}>{t("ACCOUNT.SIGN_IN")}</CardTitle>
          <CardDescription>{t("ACCOUNT.DISCORD_HINT")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-destructive text-sm">
              {loginErrorText(loginError(error), t)}
            </p>
          )}
          <Button size="lg" variant="outline" nativeButton={false} render={<a href={start} />}>
            <Image src="/images/vendors/discord.svg" alt="" width={18} height={18} unoptimized />
            {t("ACCOUNT.CONTINUE_DISCORD")}
          </Button>
          <p className="text-muted-foreground text-xs leading-relaxed">{t("ACCOUNT.SCOPE_NOTE")}</p>
        </CardContent>
      </Card>
    </PageShell>
  );
}
