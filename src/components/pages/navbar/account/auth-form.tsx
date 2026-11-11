"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "@/i18n/navigation";
import { register, signIn } from "@/lib/auth/actions";
import { query } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useActionState } from "react";

export function AuthForm(props: { mode: "sign_in" | "register"; next?: string }) {
  const t = useTranslations();
  const signingIn = props.mode === "sign_in";
  const state = useActionState(signingIn ? signIn : register, undefined);
  const result = state[0];
  const pending = state[2];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>
          {signingIn ? t("ACCOUNT.SIGN_IN_TITLE") : t("ACCOUNT.REGISTER_TITLE")}
        </CardTitle>
        <CardDescription>
          {signingIn ? t("ACCOUNT.SIGN_IN_HINT") : t("ACCOUNT.REGISTER_HINT")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={state[1]} className="flex flex-col gap-4">
          <input type="hidden" name="next" value={props.next ?? ""} />
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">{t("ACCOUNT.EMAIL")}</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">{t("ACCOUNT.PASSWORD")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={signingIn ? "current-password" : "new-password"}
              minLength={signingIn ? undefined : 8}
              required
            />
            {!signingIn && (
              <p className="text-muted-foreground text-xs">{t("ACCOUNT.PASSWORD_HINT")}</p>
            )}
          </div>
          {result && !result.ok && (
            <p role="alert" className="text-destructive text-sm">
              {actionErrorText(result.error, t)}
            </p>
          )}
          <Button type="submit" disabled={pending}>
            <Icon name={signingIn ? "log-in" : "user"} />
            {signingIn ? t("ACCOUNT.SIGN_IN") : t("ACCOUNT.REGISTER")}
          </Button>
          <p className="text-muted-foreground text-center text-xs">
            {signingIn ? t("ACCOUNT.NO_ACCOUNT") : t("ACCOUNT.HAVE_ACCOUNT")}{" "}
            <Link
              href={query(signingIn ? "/register" : "/sign-in", { next: props.next })}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {signingIn ? t("ACCOUNT.REGISTER") : t("ACCOUNT.SIGN_IN")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
