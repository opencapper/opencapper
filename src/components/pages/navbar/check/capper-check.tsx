"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useCapperCheckQuery } from "@/hooks/check/check-hook";
import { msg } from "@/lib/config/constants";
import type { IconName } from "@/lib/config/icon-map";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CheckMatchCard } from "./check-match-card";
import { NoRecord } from "./no-record";
import { useCheckParams } from "./check-filters";
import { checkTerm } from "./check-params";

const STEPS = [
  {
    icon: "user-search",
    title: msg("CHECK.HOW.STEP_1_TITLE"),
    body: msg("CHECK.HOW.STEP_1_BODY"),
  },
  {
    icon: "link",
    title: msg("CHECK.HOW.STEP_2_TITLE"),
    body: msg("CHECK.HOW.STEP_2_BODY"),
  },
  {
    icon: "shield-alert",
    title: msg("CHECK.HOW.STEP_3_TITLE"),
    body: msg("CHECK.HOW.STEP_3_BODY"),
  },
] satisfies { icon: IconName; title: string; body: string }[];

export function CapperCheck() {
  const t = useTranslations();
  const params = useCheckParams();
  const q = checkTerm(params[0].q);
  const draft = useState(q);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        label={t("CHECK.LABEL")}
        title={t("CHECK.HEADING")}
        description={t("CHECK.SUBHEADING")}
        className="mb-8"
      />

      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          params[1]({ q: checkTerm(draft[0]) || null });
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="capper-check" className="text-base">
            {t("CHECK.FORM.LABEL")}
          </Label>
          <Input
            id="capper-check"
            name="q"
            value={draft[0]}
            placeholder={t("CHECK.FORM.PLACEHOLDER")}
            autoComplete="off"
            spellCheck={false}
            className="h-11 text-base"
            onChange={(e) => draft[1](e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="h-11 px-6">
          <Icon name="search" className="size-4" />
          {t("CHECK.FORM.SUBMIT")}
        </Button>
      </form>
      <p className="text-foreground/45 mt-2 text-xs">{t("CHECK.FORM.HINT")}</p>

      {q && <CheckResults key={q} q={q} />}

      <section className="mt-14">
        <h2 className="text-foreground/90 text-lg font-medium tracking-tight">
          {t("CHECK.HOW.TITLE")}
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.title}
              className="border-foreground/10 rounded-xl border p-4"
            >
              <span className="bg-foreground/5 text-foreground/80 inline-flex size-9 items-center justify-center rounded-full">
                <Icon name={step.icon} className="size-4.5" />
              </span>
              <p className="text-foreground/90 mt-3 text-sm font-medium">
                {t(step.title)}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                {t(step.body)}
              </p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}

function CheckResults(props: { q: string }) {
  const t = useTranslations("CHECK");
  const tRoot = useTranslations();
  const check = useCapperCheckQuery(props.q);

  if (check.isPending) return <Skeleton className="mt-8 h-56 rounded-xl" />;
  if (check.isError)
    return (
      <p className="text-destructive mt-8 text-sm">
        {apiErrorText(tRoot, check.error, t("ERROR"))}
      </p>
    );
  if (check.data.matches.length === 0)
    return <NoRecord query={check.data.query} />;
  return (
    <section className="mt-8 space-y-4">
      <p className="label-mono text-foreground/45">
        {t("RESULT.COUNT", { count: check.data.matches.length })}
      </p>
      <ul className="space-y-4">
        {check.data.matches.map((match) => (
          <CheckMatchCard key={match.username} match={match} />
        ))}
      </ul>
      <p className="text-foreground/55 flex items-start gap-2 text-sm leading-relaxed">
        <Icon name="triangle-alert" className="mt-0.5 size-4 shrink-0" />
        {t("RESULT.WARNING")}
      </p>
    </section>
  );
}
