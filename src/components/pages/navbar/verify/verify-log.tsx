"use client";

import { PageHeading } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import type { IconName } from "@/lib/config/icon-map";
import { useTranslations } from "next-intl";
import { DeveloperSection } from "./developer-section";
import { LogStats } from "./log-stats";
import { PickSearch } from "./pick-search";

const STEPS = [
  {
    icon: "lock",
    title: msg("VERIFY.HOW.STEP_1_TITLE"),
    body: msg("VERIFY.HOW.STEP_1_BODY"),
  },
  {
    icon: "link",
    title: msg("VERIFY.HOW.STEP_2_TITLE"),
    body: msg("VERIFY.HOW.STEP_2_BODY"),
  },
  {
    icon: "bitcoin",
    title: msg("VERIFY.HOW.STEP_3_TITLE"),
    body: msg("VERIFY.HOW.STEP_3_BODY"),
  },
] satisfies { icon: IconName; title: string; body: string }[];

export function VerifyLog(props: { initial: string }) {
  const t = useTranslations();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <PageHeading
        label={t("VERIFY.LABEL")}
        title={t("VERIFY.HEADING")}
        description={t("VERIFY.SUBHEADING")}
        className="mb-8"
      />

      <PickSearch initial={props.initial} />

      <section className="mt-14">
        <h2 className="text-foreground/90 text-lg font-medium tracking-tight">
          {t("VERIFY.HOW.TITLE")}
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
        <div className="mt-5">
          <LogStats />
        </div>
      </section>

      <DeveloperSection initial={props.initial} />
    </div>
  );
}
