"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import { useTranslations } from "next-intl";
import { LogAnchors } from "./log-anchors";
import { LogHeadCard } from "./log-head-card";
import { PickVerifier } from "./pick-verifier";

const STEPS = [
  {
    title: msg("VERIFY.DEV.STEP_1_TITLE"),
    body: msg("VERIFY.DEV.STEP_1_BODY"),
  },
  {
    title: msg("VERIFY.DEV.STEP_2_TITLE"),
    body: msg("VERIFY.DEV.STEP_2_BODY"),
  },
  {
    title: msg("VERIFY.DEV.STEP_3_TITLE"),
    body: msg("VERIFY.DEV.STEP_3_BODY"),
  },
  {
    title: msg("VERIFY.DEV.STEP_4_TITLE"),
    body: msg("VERIFY.DEV.STEP_4_BODY"),
  },
];

export function DeveloperSection(props: { initial: string }) {
  const t = useTranslations();

  return (
    <details
      id="developers"
      className="group/dev border-foreground/10 mt-14 rounded-xl border"
    >
      <summary className="hover:bg-foreground/3 flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl px-4 py-3.5 transition-colors [&::-webkit-details-marker]:hidden">
        <span className="flex items-center gap-3">
          <Icon name="braces" className="text-muted-foreground size-4" />
          <span>
            <span className="text-foreground/90 block text-sm font-medium">
              {t("VERIFY.DEV.TITLE")}
            </span>
            <span className="text-muted-foreground block text-xs">
              {t("VERIFY.DEV.DESCRIPTION")}
            </span>
          </span>
        </span>
        <Icon
          name="chevron-down"
          className="text-muted-foreground size-4 shrink-0 transition-transform group-open/dev:rotate-180"
        />
      </summary>

      <div className="border-foreground/10 border-t p-4">
        <Card>
          <CardHeader>
            <CardTitle className={CARD_LABEL}>
              {t("VERIFY.DEV.STEPS_TITLE")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-6 sm:grid-cols-2">
              {STEPS.map((step, i) => (
                <li key={step.title} className="flex gap-3">
                  <span className="text-foreground/35 font-mono text-[11px] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="text-foreground/90 text-[13px] font-medium">
                      {t(step.title)}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm">
                      {t(step.body)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <LogHeadCard />
        <PickVerifier initial={props.initial} />
        <LogAnchors />

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className={CARD_LABEL}>
              {t("VERIFY.EXPORT.TITLE")}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>{t("VERIFY.EXPORT.BODY")}</p>
            <ul className="space-y-1 font-mono text-xs">
              <li>GET /api/log/head</li>
              <li>GET /api/log/picks/:id</li>
              <li>GET /api/log/users/:username/:seq</li>
              <li>GET /api/log/entries?from=1&amp;limit=1000</li>
              <li>GET /api/log/anchors</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </details>
  );
}
