import { Empty, Panel, Unreachable } from "@/components/elements/odds/panel";
import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { VendorLabel } from "@/components/elements/vendor/vendor-logo";
import type { BookHealth, HealthRisk, HealthWarningCode } from "@/lib/api/client";
import { count, currency, type Translate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import { TrackerShell } from "./tracker";

const RISK_STYLE: Record<HealthRisk, string> = {
  unknown: "border-border text-muted-foreground",
  low: "border-success/30 bg-success/10 text-success",
  medium: "border-warning/30 bg-warning/10 text-warning",
  high: "border-destructive/30 bg-destructive/10 text-destructive",
};

const RISK_ORDER: Record<HealthRisk, number> = { high: 0, medium: 1, low: 2, unknown: 3 };

function riskLabel(r: HealthRisk, t: Translate): string {
  if (r === "high") return t("HEALTH.RISK_HIGH");
  if (r === "medium") return t("HEALTH.RISK_MEDIUM");
  if (r === "low") return t("HEALTH.RISK_LOW");
  return t("HEALTH.RISK_UNKNOWN");
}

function warning(code: HealthWarningCode, t: Translate): { title: string; body: string } {
  if (code === "all_value_bets") return { title: t("HEALTH.WARN.ALL_VALUE_BETS"), body: t("HEALTH.WARN.ALL_VALUE_BETS_FIX") };
  if (code === "never_round_stakes") return { title: t("HEALTH.WARN.NEVER_ROUND"), body: t("HEALTH.WARN.NEVER_ROUND_FIX") };
  if (code === "low_liquidity") return { title: t("HEALTH.WARN.LOW_LIQUIDITY"), body: t("HEALTH.WARN.LOW_LIQUIDITY_FIX") };
  return { title: t("HEALTH.WARN.BEATS_CLOSE"), body: t("HEALTH.WARN.BEATS_CLOSE_FIX") };
}

function share(x: number | null | undefined, t: Translate): string {
  return x === null || x === undefined ? t("FORMAT.NA") : `${Math.round(x * 100)}%`;
}

function Metric(props: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-0.5" title={props.hint}>
      <dt className="eyebrow text-foreground/45 text-[10px]">{props.label}</dt>
      <dd className="tabular text-sm">{props.value}</dd>
    </div>
  );
}

function BookCard(props: { health: BookHealth; currency: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const h = props.health;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-base font-medium">
          <VendorLabel vendorKey={h.book} size={24} className="gap-2.5" />
        </CardTitle>
        <CardAction>
          <Badge variant="outline" className={cn("rounded-sm font-normal", RISK_STYLE[h.risk])}>
            {riskLabel(h.risk, t)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label={t("HEALTH.BETS")} value={count(h.bets, locale)} />
          <Metric label={t("HEALTH.AVG_STAKE")} value={currency(Number(h.avg_stake), locale, props.currency)} />
          <Metric label={t("HEALTH.VALUE_SHARE")} value={share(h.value_bet_share, t)} hint={t("HEALTH.VALUE_SHARE_HINT")} />
          <Metric label={t("HEALTH.ROUND_SHARE")} value={share(h.round_stake_share, t)} hint={t("HEALTH.ROUND_SHARE_HINT")} />
          <Metric label={t("HEALTH.LOW_LIQUIDITY")} value={share(h.low_liquidity_share, t)} hint={t("HEALTH.LOW_LIQUIDITY_HINT")} />
          <Metric label={t("HEALTH.BEAT_CLOSE")} value={share(h.beat_close_share, t)} />
        </dl>
        {h.risk === "unknown" && (
          <p className="text-muted-foreground text-xs">{t("HEALTH.TOO_FEW")}</p>
        )}
        {h.warnings.length > 0 && (
          <ul className="flex flex-col gap-3 border-t pt-3">
            {h.warnings.map((w) => {
              const text = warning(w.code, t);
              return (
                <li key={w.code} className="flex gap-2">
                  <Icon name="triangle-alert" className="text-warning mt-0.5 size-4 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">{text.title}</span>
                    <span className="text-muted-foreground text-xs leading-relaxed">{text.body}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {h.risk === "low" && (
          <p className="text-success flex items-center gap-1.5 text-xs">
            <Icon name="circle-check" className="size-3.5" />
            {t("HEALTH.ALL_CLEAR")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

const TIPS = ["TIP_MIX", "TIP_ROUND", "TIP_SPREAD", "TIP_TIMING", "TIP_WITHDRAW"] as const;

export function Health(props: { books?: BookHealth[]; currency: string }) {
  const t = useTranslations("HEALTH");
  const books = props.books;
  return (
    <TrackerShell active="/tracker/health">
      <Card>
        <CardHeader>
          <CardTitle className={CARD_LABEL}>{t("WHY_TITLE")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm leading-relaxed">
          <p className="text-muted-foreground">{t("WHY_BODY")}</p>
          <ul className="flex flex-col gap-1.5">
            {TIPS.map((tip) => (
              <li key={tip} className="flex gap-2">
                <Icon name="check" className="text-success mt-0.5 size-4 shrink-0" />
                <span>{t(tip)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {!books && <Unreachable />}
      {books && books.length === 0 && (
        <Panel>
          <Empty>{t("EMPTY")}</Empty>
        </Panel>
      )}
      {books && books.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {[...books]
            .sort((a, b) => RISK_ORDER[a.risk] - RISK_ORDER[b.risk] || b.bets - a.bets)
            .map((h) => (
              <BookCard key={h.book} health={h} currency={props.currency} />
            ))}
        </div>
      )}
    </TrackerShell>
  );
}
