"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { Link, usePathname } from "@/i18n/navigation";
import { signOut } from "@/lib/auth/actions";
import { query } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export function UserMenu(props: { email?: string }) {
  if (!props.email) return <SignInButton />;
  return <SignedInMenu email={props.email} />;
}

function SignInButton() {
  const t = useTranslations("AUTH");
  const pathname = usePathname();
  const next = pathname === "/sign-in" || pathname === "/register" ? undefined : pathname;
  return (
    <Button
      size="sm"
      nativeButton={false}
      aria-label={t("SIGN_IN")}
      render={<Link href={query("/sign-in", { next })} />}
    >
      <Icon name="log-in" />
      <span className="hidden sm:inline">{t("SIGN_IN")}</span>
    </Button>
  );
}

function SignedInMenu(props: { email: string }) {
  const t = useTranslations("AUTH");
  const transition = useTransition();
  const pending = transition[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" className="rounded-full" aria-label={t("MENU")} />
        }
      >
        <Avatar size="sm">
          <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
            {props.email.slice(0, 1).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {t("SIGNED_IN_AS", { email: props.email })}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/tracker" />}>
          <Icon name="wallet" />
          {t("TRACKER")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/tracker/health" />}>
          <Icon name="shield-check" />
          {t("HEALTH")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings" />}>
          <Icon name="settings-2" />
          {t("SETTINGS")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/appearance" />}>
          <Icon name="paintbrush" />
          {t("APPEARANCE")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={() => transition[1](() => signOut())}>
          <Icon name="log-out" />
          {t("SIGN_OUT")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
