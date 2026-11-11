"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { DiscordIcon } from "@/components/ui/local-icons";
import { Link, usePathname } from "@/i18n/navigation";
import type { User } from "@/lib/api/client";
import { signOut } from "@/lib/auth/actions";
import { query } from "@/lib/format";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

export function UserMenu(props: { user?: User }) {
  if (!props.user) return <SignInButton />;
  return <SignedInMenu user={props.user} />;
}

function SignInButton() {
  const t = useTranslations("AUTH");
  const pathname = usePathname();
  const next = pathname === "/sign-in" ? undefined : pathname;
  return (
    <Button
      size="sm"
      nativeButton={false}
      aria-label={t("SIGN_IN")}
      render={<Link href={query("/sign-in", { next })} />}
    >
      <DiscordIcon />
      <span className="hidden sm:inline">{t("SIGN_IN")}</span>
    </Button>
  );
}

function UserAvatar(props: { user: User; className?: string }) {
  return (
    <Avatar size="sm" className={props.className}>
      <AvatarImage src={props.user.avatar_url} alt={props.user.display_name} />
      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
        {props.user.display_name.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function SignedInMenu(props: { user: User }) {
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
        <UserAvatar user={props.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-2.5">
            <UserAvatar user={props.user} className="size-8" />
            <span className="flex min-w-0 flex-col">
              <span className="text-foreground truncate text-sm font-medium">{props.user.display_name}</span>
              <span className="text-muted-foreground truncate text-xs font-normal">{props.user.username}</span>
            </span>
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
