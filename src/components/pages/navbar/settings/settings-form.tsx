"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { Choice } from "@/components/elements/account/choice";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import type { Settings } from "@/lib/api/client";
import { saveSettings, type ActionResult } from "@/lib/auth/actions";
import { bookName } from "@/lib/config/vendor-registry";
import { fractionLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";

const FRACTIONS = [
  { key: "FULL", value: "1" },
  { key: "HALF", value: "0.5" },
  { key: "QUARTER", value: "0.25" },
  { key: "EIGHTH", value: "0.125" },
] as const;

const CURRENCIES = ["EUR", "GBP", "USD", "CAD", "AUD", "SEK", "NOK", "DKK", "PLN", "TRY", "BRL", "JPY", "CHF"];

export function SettingsForm(props: { settings: Settings; books: string[] }) {
  const t = useTranslations();
  const router = useRouter();
  const bankroll = useState(props.settings.bankroll);
  const fraction = useState(String(Number(props.settings.kelly_fraction)));
  const code = useState(props.settings.currency);
  const preferred = useState(props.settings.preferred_books);
  const currencies = CURRENCIES.includes(code[0]) ? CURRENCIES : [code[0], ...CURRENCIES];

  const mutation = useMutation({
    mutationFn: (): Promise<ActionResult> =>
      saveSettings({
        bankroll: bankroll[0],
        kelly_fraction: fraction[0],
        currency: code[0],
        preferred_books: preferred[0],
      }),
    onSuccess: (result) => {
      if (!result.ok) return;
      toast.success(t("SETTINGS.SAVED"));
      router.refresh();
    },
  });
  const result = mutation.data;
  const toggle = (book: string) =>
    preferred[1]((prev) => (prev.includes(book) ? prev.filter((b) => b !== book) : [...prev, book]));

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle className={CARD_LABEL}>{t("SETTINGS.STAKING_TITLE")}</CardTitle>
          <CardDescription>{t("SETTINGS.STAKING_HINT")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankroll">{t("SETTINGS.BANKROLL")}</Label>
              <Input
                id="bankroll"
                inputMode="decimal"
                value={bankroll[0]}
                onChange={(e) => bankroll[1](e.target.value)}
                className="tabular"
              />
            </div>
            <Choice
              id="currency"
              label={t("SETTINGS.CURRENCY")}
              value={code[0]}
              options={currencies.map((c) => ({ value: c, label: c }))}
              onChange={code[1]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="fraction">{t("SETTINGS.KELLY")}</Label>
            <div className="flex flex-wrap gap-1">
              {FRACTIONS.map((f) => (
                <Button
                  key={f.key}
                  type="button"
                  size="sm"
                  variant={Number(fraction[0]) === Number(f.value) ? "secondary" : "ghost"}
                  onClick={() => fraction[1](f.value)}
                >
                  {t(`STAKE.KELLY.${f.key}`)}
                </Button>
              ))}
              <Input
                id="fraction"
                inputMode="decimal"
                value={fraction[0]}
                onChange={(e) => fraction[1](e.target.value)}
                className="tabular h-8 w-24"
                aria-label={t("SETTINGS.KELLY_CUSTOM")}
              />
            </div>
            <p className="text-muted-foreground text-xs">
              {t("SETTINGS.KELLY_HINT", { fraction: fractionLabel(Number(fraction[0]) || 0) })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className={CARD_LABEL}>{t("SETTINGS.BOOKS_TITLE")}</CardTitle>
          <CardDescription>{t("SETTINGS.BOOKS_HINT")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("SETTINGS.BOOKS_TITLE")}>
            {props.books.map((b) => {
              const on = preferred[0].includes(b);
              return (
                <button
                  key={b}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(b)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                    on
                      ? "border-foreground/40 bg-foreground/10 text-foreground"
                      : "text-foreground/55 hover:text-foreground hover:bg-foreground/5",
                  )}
                >
                  <VendorLogo vendorKey={b} size={16} />
                  {bookName(b)}
                  {on && <Icon name="check" className="size-3" />}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {result && !result.ok && (
        <p role="alert" className="text-destructive text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={mutation.isPending}>
          <Icon name="check" />
          {t("SETTINGS.SAVE")}
        </Button>
        <Link
          href="/settings/appearance"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm"
        >
          <Icon name="paintbrush" className="size-3.5" />
          {t("AUTH.APPEARANCE")}
        </Link>
      </div>
    </form>
  );
}
