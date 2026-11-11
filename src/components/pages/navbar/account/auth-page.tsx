import { PageHeading } from "@/components/elements/page/page-heading";
import { PageShell } from "@/components/elements/page/page-shell";
import { redirect } from "@/i18n/navigation";
import { getAccount } from "@/lib/auth/session";
import { param } from "@/lib/format";
import { getLocale, getTranslations } from "next-intl/server";
import { AuthForm } from "./auth-form";

export async function AuthPage(props: {
  mode: "sign_in" | "register";
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = param((await props.searchParams).next);
  if (await getAccount()) redirect({ href: next ?? "/tracker", locale: await getLocale() });
  const t = await getTranslations("ACCOUNT");
  return (
    <PageShell className="max-w-md">
      <PageHeading
        className="mb-0"
        label={t("LABEL")}
        title={props.mode === "sign_in" ? t("SIGN_IN_HEADING") : t("REGISTER_HEADING")}
        description={t("WHY")}
      />
      <AuthForm mode={props.mode} next={next} />
    </PageShell>
  );
}
