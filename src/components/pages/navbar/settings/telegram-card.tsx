"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { TelegramIcon } from "@/components/ui/local-icons";
import { useRouter } from "@/i18n/navigation";
import {
  fetchTelegram,
  startTelegramLink,
  unlinkTelegram,
  type ActionResult,
  type TelegramLinkResult,
} from "@/lib/auth/actions";
import { queryKeys } from "@/lib/react-query/keys";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const POLL_MS = 2500;

type Pending = { url: string; expiresAt: number };

function botName(url: string): string {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch {
    return "";
  }
}

export function TelegramCard(props: { linked: boolean; username?: string | null }) {
  const t = useTranslations();
  const router = useRouter();
  const queryClient = useQueryClient();
  const pending = useState<Pending | undefined>(undefined);
  const link = pending[0];

  const status = useQuery({
    queryKey: queryKeys.telegram(),
    queryFn: () => fetchTelegram(),
    enabled: link !== undefined,
    refetchInterval: (query) =>
      query.state.data?.linked || !link || Date.now() > link.expiresAt ? false : POLL_MS,
  });
  const polled = link ? status.data : undefined;
  const justLinked = polled?.linked === true;
  // Read so every poll re-renders and the expiry below is re-evaluated.
  const lastPoll = status.dataUpdatedAt;
  const expired = link !== undefined && !justLinked && lastPoll > 0 && Date.now() > link.expiresAt;

  useEffect(() => {
    if (!justLinked) return;
    toast.success(t("ALERTS.TG_DONE"));
    router.refresh();
  }, [justLinked, router, t]);

  const connect = useMutation({
    mutationFn: async (): Promise<TelegramLinkResult> => {
      // Opened inside the click so popup blockers allow it; the URL arrives after the round trip.
      const tab = window.open("", "_blank");
      const result = await startTelegramLink();
      if (result.ok && tab) {
        tab.opener = null;
        tab.location.href = result.url;
      } else {
        tab?.close();
      }
      return result;
    },
    onSuccess: (result) => {
      if (!result.ok) return;
      queryClient.removeQueries({ queryKey: queryKeys.telegram() });
      pending[1]({ url: result.url, expiresAt: new Date(result.expiresAt).getTime() });
    },
  });

  const disconnect = useMutation({
    mutationFn: (): Promise<ActionResult> => unlinkTelegram(),
    onSuccess: (result) => {
      if (!result.ok) return;
      pending[1](undefined);
      queryClient.removeQueries({ queryKey: queryKeys.telegram() });
      toast.success(t("ALERTS.TG_DISCONNECTED"));
      router.refresh();
    },
  });

  const linked = props.linked || justLinked;
  const username = polled?.username ?? props.username;
  const waiting = link !== undefined && !linked && !expired;
  const connectError = connect.data && !connect.data.ok ? connect.data.error : undefined;
  const disconnectError = disconnect.data && !disconnect.data.ok ? disconnect.data.error : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn(CARD_LABEL, "flex items-center gap-1.5")}>
          <TelegramIcon className="size-3.5" />
          {t("ALERTS.TG_TITLE")}
        </CardTitle>
        <CardDescription>{t("ALERTS.TG_HINT")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {linked ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 text-sm">
              <Icon name="circle-check" className="text-success size-4" />
              {username ? t("ALERTS.TG_LINKED", { name: `@${username}` }) : t("ALERTS.TG_LINKED_NO_NAME")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disconnect.isPending}
              onClick={() => disconnect.mutate()}
            >
              <Icon name="x" />
              {t("ALERTS.TG_DISCONNECT")}
            </Button>
          </div>
        ) : waiting ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <span className="inline-flex items-center gap-2 text-sm font-medium">
              <Icon name="loader" className="size-4 animate-spin" />
              {t("ALERTS.TG_WAITING")}
            </span>
            <p className="text-muted-foreground text-xs">{t("ALERTS.TG_WAITING_HINT", { bot: botName(link.url) })}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                nativeButton={false}
                render={<a href={link.url} target="_blank" rel="noreferrer" />}
              >
                <Icon name="external-link" />
                {t("ALERTS.TG_OPEN_AGAIN")}
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => pending[1](undefined)}>
                {t("ALERTS.TG_CANCEL")}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {expired && <p className="text-warning text-xs">{t("ALERTS.TG_EXPIRED")}</p>}
            <div>
              <Button type="button" size="sm" disabled={connect.isPending} onClick={() => connect.mutate()}>
                <TelegramIcon />
                {expired ? t("ALERTS.TG_RETRY") : t("ALERTS.TG_CONNECT")}
              </Button>
            </div>
          </div>
        )}
        {connectError && (
          <p role="alert" className="text-destructive text-sm">
            {connectError === "telegram_unavailable" ? t("ALERTS.TG_UNAVAILABLE") : actionErrorText(connectError, t)}
          </p>
        )}
        {disconnectError && (
          <p role="alert" className="text-destructive text-sm">
            {actionErrorText(disconnectError, t)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
