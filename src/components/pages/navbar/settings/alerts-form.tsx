"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { BookPicker, CHIP, chipState } from "@/components/elements/vendor/book-picker";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DiscordIcon, TelegramIcon } from "@/components/ui/local-icons";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "@/i18n/navigation";
import type { AlertPrefs, MinConfidence } from "@/lib/api/client";
import { saveAlerts, type ActionResult } from "@/lib/auth/actions";
import { env } from "@/lib/config/env";
import { confidenceLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

const EV_PRESETS = ["1", "2", "3", "5"];
const CONFIDENCES: MinConfidence[] = ["low", "medium", "high"];

function toPercent(x: number): string {
  return String(Number((x * 100).toFixed(2)));
}

function fromPercent(s: string): number | undefined {
  const n = Number(s.replace(",", "."));
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 && n <= 100 ? n / 100 : undefined;
}

function PercentInput(props: { id: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div className="relative w-24">
      <Input
        id={props.id}
        inputMode="decimal"
        value={props.value}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
        className="tabular h-8 pr-6"
      />
      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs">%</span>
    </div>
  );
}

function SwitchRow(props: {
  id: string;
  name: string;
  label: ReactNode;
  hint: ReactNode;
  checked: boolean;
  onChange: (on: boolean) => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor={props.id} className="inline-flex items-center gap-2">
          {props.label}
        </Label>
        <div className="text-muted-foreground text-xs leading-relaxed">{props.hint}</div>
        {props.children}
      </div>
      <Switch id={props.id} aria-label={props.name} checked={props.checked} disabled={props.disabled} onCheckedChange={props.onChange} />
    </div>
  );
}

export function AlertsForm(props: { prefs: AlertPrefs; books: string[]; preferred: string[]; telegramLinked: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const enabled = useState(props.prefs.enabled);
  const minEv = useState(toPercent(props.prefs.min_ev));
  const books = useState(props.prefs.books);
  const confidence = useState(props.prefs.min_confidence);
  const arbs = useState(props.prefs.arbs);
  const minArb = useState(toPercent(props.prefs.min_arb_profit));
  const dm = useState(props.prefs.channels?.discord_dm ?? true);
  const telegram = useState(props.prefs.channels?.telegram ?? false);
  const invalid = useState(false);

  const mutation = useMutation({
    mutationFn: (prefs: AlertPrefs): Promise<ActionResult> => saveAlerts(prefs),
    onSuccess: (result) => {
      if (!result.ok) return;
      toast.success(t("ALERTS.SAVED"));
      router.refresh();
    },
  });
  const result = mutation.data;
  const noChannel = enabled[0] && !dm[0] && !telegram[0];
  const known = new Set(props.books);
  const pickable = [...props.books, ...books[0].filter((b) => !known.has(b))];

  const submit = () => {
    const ev = fromPercent(minEv[0]);
    const arb = fromPercent(minArb[0]);
    invalid[1](ev === undefined || arb === undefined);
    if (ev === undefined || arb === undefined) return;
    mutation.mutate({
      enabled: enabled[0],
      min_ev: ev,
      books: books[0],
      min_confidence: confidence[0],
      arbs: arbs[0],
      min_arb_profit: arb,
      channels: { discord_dm: dm[0], telegram: telegram[0] },
    });
  };

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className={cn(CARD_LABEL, "flex items-center gap-1.5")}>
            <Icon name="bell" className="size-3.5" />
            {t("ALERTS.TITLE")}
          </CardTitle>
          <CardDescription>{enabled[0] ? t("ALERTS.HINT") : t("ALERTS.OFF_HINT")}</CardDescription>
          <CardAction>
            <Switch checked={enabled[0]} onCheckedChange={enabled[1]} aria-label={t("ALERTS.ENABLED")} />
          </CardAction>
        </CardHeader>
        <CardContent className={cn("flex flex-col gap-6 transition-opacity", !enabled[0] && "opacity-60")}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="alerts-min-ev">{t("ALERTS.MIN_EV")}</Label>
              <div className="flex flex-wrap items-center gap-1">
                {EV_PRESETS.map((p) => (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={Number(minEv[0]) === Number(p) ? "secondary" : "ghost"}
                    onClick={() => minEv[1](p)}
                  >
                    {`${p}%`}
                  </Button>
                ))}
                <PercentInput id="alerts-min-ev" value={minEv[0]} onChange={minEv[1]} />
              </div>
              <p className="text-muted-foreground text-xs">{t("ALERTS.MIN_EV_HINT")}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Label>{t("ALERTS.MIN_CONFIDENCE")}</Label>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={t("ALERTS.MIN_CONFIDENCE")}>
                {CONFIDENCES.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    role="radio"
                    aria-checked={confidence[0] === c}
                    variant={confidence[0] === c ? "secondary" : "ghost"}
                    onClick={() => confidence[1](c)}
                  >
                    {confidenceLabel(c, t)}
                  </Button>
                ))}
              </div>
              <p className="text-muted-foreground text-xs">{t("ALERTS.MIN_CONFIDENCE_HINT")}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("ALERTS.BOOKS")}</Label>
            <p className="text-muted-foreground text-xs">{t("ALERTS.BOOKS_HINT")}</p>
            <BookPicker
              label={t("ALERTS.BOOKS")}
              books={pickable}
              selected={books[0]}
              onChange={books[1]}
              leading={
                <>
                  <button
                    type="button"
                    aria-pressed={books[0].length === 0}
                    onClick={() => books[1]([])}
                    className={cn(CHIP, chipState(books[0].length === 0))}
                  >
                    {t("ALERTS.ALL_BOOKS")}
                    {books[0].length === 0 && <Icon name="check" className="size-3" />}
                  </button>
                  {props.preferred.length > 0 && (
                    <button
                      type="button"
                      onClick={() => books[1](props.preferred)}
                      className={cn(CHIP, chipState(false), "border-dashed")}
                    >
                      <Icon name="wallet" className="size-3" />
                      {t("ALERTS.MY_BOOKS")}
                    </button>
                  )}
                </>
              }
            />
          </div>

          <SwitchRow
            id="alerts-arbs"
            name={t("ALERTS.ARBS")}
            label={
              <>
                <Icon name="scale" className="size-3.5" />
                {t("ALERTS.ARBS")}
              </>
            }
            hint={t("ALERTS.ARBS_HINT")}
            checked={arbs[0]}
            onChange={arbs[1]}
          >
            <div className="mt-1 flex items-center gap-2">
              <Label htmlFor="alerts-min-arb" className="text-muted-foreground text-xs font-normal">
                {t("ALERTS.MIN_ARB")}
              </Label>
              <PercentInput id="alerts-min-arb" value={minArb[0]} onChange={minArb[1]} disabled={!arbs[0]} />
            </div>
          </SwitchRow>

          <div className="flex flex-col gap-4 border-t pt-5">
            <span className={CARD_LABEL}>{t("ALERTS.CHANNELS")}</span>
            <SwitchRow
              id="alerts-dm"
              name={t("ALERTS.DISCORD_DM")}
              label={
                <>
                  <DiscordIcon className="size-3.5" />
                  {t("ALERTS.DISCORD_DM")}
                </>
              }
              hint={
                <>
                  {t("ALERTS.DISCORD_DM_HINT")}
                  {env.alertsInviteUrl && (
                    <>
                      {" "}
                      <a
                        href={env.alertsInviteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-foreground inline-flex items-center gap-1 underline underline-offset-2"
                      >
                        {t("ALERTS.DISCORD_JOIN")}
                        <Icon name="external-link" className="size-3" />
                      </a>
                    </>
                  )}
                </>
              }
              checked={dm[0]}
              onChange={dm[1]}
            />
            <SwitchRow
              id="alerts-telegram"
              name={t("ALERTS.TELEGRAM")}
              label={
                <>
                  <TelegramIcon className="size-3.5" />
                  {t("ALERTS.TELEGRAM")}
                </>
              }
              hint={props.telegramLinked ? t("ALERTS.TELEGRAM_HINT") : t("ALERTS.TELEGRAM_NOT_LINKED")}
              checked={telegram[0]}
              disabled={!props.telegramLinked && !telegram[0]}
              onChange={telegram[1]}
            />
            {noChannel && (
              <p className="text-warning flex items-center gap-1.5 text-xs">
                <Icon name="triangle-alert" className="size-3.5" />
                {t("ALERTS.NO_CHANNEL")}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {invalid[0] && (
        <p role="alert" className="text-destructive text-sm">
          {t("ALERTS.INVALID")}
        </p>
      )}
      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <div>
        <Button type="submit" disabled={mutation.isPending}>
          <Icon name="check" />
          {t("ALERTS.SAVE")}
        </Button>
      </div>
    </form>
  );
}
