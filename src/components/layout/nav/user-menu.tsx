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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TelegramLoginWidget } from "@/components/elements/auth/telegram-login-widget";
import {
  useAuthProviders,
  useAuthUser,
  useLoginMutation,
  useLogoutMutation,
  useTelegramLoginMutation,
} from "@/hooks/auth/auth-hook";
import { Link } from "@/i18n/navigation";
import type { AuthUser } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function UserMenu() {
  const user = useAuthUser();
  return user ? <SignedInMenu user={user} /> : <LoginButton />;
}

export function LoginButton(props: { returnTo?: string; label?: boolean }) {
  const t = useTranslations("AUTH");
  const pathname = usePathname();
  const login = useLoginMutation();
  const providers = useAuthProviders();
  const telegramSheet = useState(false);
  const returnTo = props.returnTo ?? pathname;
  const labelClass = props.label ? undefined : "hidden sm:inline";

  if (!providers.google && !providers.telegramBot)
    return (
      <Button
        size="sm"
        aria-label={t("LOGIN")}
        disabled={login.isPending}
        onClick={() => login.mutate({ provider: "discord", returnTo })}
      >
        <Icon name="brand-discord" />
        <span className={labelClass}>{t("LOGIN")}</span>
      </Button>
    );

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              size="sm"
              aria-label={t("LOG_IN")}
              disabled={login.isPending}
            />
          }
        >
          <Icon name="log-in" />
          <span className={labelClass}>{t("LOG_IN")}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-56">
          <DropdownMenuItem
            onClick={() => login.mutate({ provider: "discord", returnTo })}
          >
            <Icon name="brand-discord" />
            {t("WITH_DISCORD")}
          </DropdownMenuItem>
          {providers.google && (
            <DropdownMenuItem
              onClick={() => login.mutate({ provider: "google", returnTo })}
            >
              <Icon name="brand-google" />
              {t("WITH_GOOGLE")}
            </DropdownMenuItem>
          )}
          {providers.telegramBot && (
            <DropdownMenuItem onClick={() => telegramSheet[1](true)}>
              <Icon name="brand-telegram" />
              {t("WITH_TELEGRAM")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {providers.telegramBot && (
        <TelegramLoginSheet
          botUsername={providers.telegramBot}
          open={telegramSheet[0]}
          onOpenChange={telegramSheet[1]}
        />
      )}
    </>
  );
}

// A sheet, not a menu item: the widget iframe must stay mounted until Telegram calls back.
function TelegramLoginSheet(props: {
  botUsername: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AUTH");
  const tRoot = useTranslations();
  const telegram = useTelegramLoginMutation();
  return (
    <Sheet open={props.open} onOpenChange={props.onOpenChange}>
      <SheetContent side="bottom" className="bg-background mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>{t("TELEGRAM_TITLE")}</SheetTitle>
          <SheetDescription>{t("TELEGRAM_HINT")}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col items-center gap-3 px-4 pb-6">
          {props.open && (
            <TelegramLoginWidget
              botUsername={props.botUsername}
              onAuth={(user) =>
                telegram.mutate(user, {
                  onSuccess: () => props.onOpenChange(false),
                })
              }
            />
          )}
          {telegram.isError && (
            <p className="text-destructive text-sm">
              {apiErrorText(tRoot, telegram.error, t("TELEGRAM_FAILED"))}
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function UserAvatar(props: { user: AuthUser; className?: string }) {
  return (
    <Avatar size="sm" className={props.className}>
      {props.user.avatarUrl && (
        <AvatarImage src={props.user.avatarUrl} alt={props.user.username} />
      )}
      <AvatarFallback className="bg-primary/15 text-primary text-[10px] font-semibold">
        {props.user.username.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function SignedInMenu(props: { user: AuthUser }) {
  const t = useTranslations("AUTH");
  const logout = useLogoutMutation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="rounded-full"
            aria-label={t("MENU")}
          />
        }
      >
        <UserAvatar user={props.user} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="truncate">
            {t("SIGNED_IN_AS", { username: props.user.username })}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link
              href={{
                pathname: "/u/[username]",
                params: { username: props.user.username },
              }}
            />
          }
        >
          <Icon name="user" />
          {t("MY_PROFILE")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/picks/new" />}>
          <Icon name="plus" />
          {t("LOG_PICK")}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/appearance" />}>
          <Icon name="paintbrush" />
          {t("APPEARANCE")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={logout.isPending}
          onClick={() => logout.mutate()}
        >
          <Icon name="log-out" />
          {t("LOGOUT")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
