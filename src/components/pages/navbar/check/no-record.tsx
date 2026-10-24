"use client";

import { Icon } from "@/components/ui/icon";
import { msg } from "@/lib/config/constants";
import { useTranslations } from "next-intl";

const TIPS = [
  msg("CHECK.NONE.TIP_1"),
  msg("CHECK.NONE.TIP_2"),
  msg("CHECK.NONE.TIP_3"),
];

export function NoRecord(props: { query: string }) {
  const t = useTranslations();

  return (
    <section className="border-destructive/30 bg-destructive/5 mt-8 rounded-xl border p-5">
      <div className="flex items-start gap-3">
        <span className="bg-destructive/10 text-destructive inline-flex size-9 shrink-0 items-center justify-center rounded-full">
          <Icon name="shield-alert" className="size-4.5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-foreground/95 text-lg font-medium tracking-tight break-words">
            {t("CHECK.NONE.TITLE", { query: props.query })}
          </h2>
          <p className="text-foreground/70 mt-1 text-sm leading-relaxed">
            {t("CHECK.NONE.BODY")}
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2 pl-12">
        {TIPS.map((tip) => (
          <li
            key={tip}
            className="text-foreground/65 flex items-start gap-2 text-sm leading-relaxed"
          >
            <Icon name="check" className="mt-1 size-3.5 shrink-0" />
            {t(tip)}
          </li>
        ))}
      </ul>
    </section>
  );
}
