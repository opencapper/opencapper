import { SectionLabel } from "@/components/elements/page/page-heading";
import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function LeaderboardMethod(props: { minGraded: number }) {
  const t = useTranslations("LEADERBOARD.METHOD");
  const items: { icon: IconName; title: string; body: string }[] = [
    {
      icon: "hash",
      title: t("SAMPLE_TITLE"),
      body: t("SAMPLE_BODY", { count: props.minGraded }),
    },
    { icon: "percent", title: t("ROI_TITLE"), body: t("ROI_BODY") },
    { icon: "check", title: t("GRADED_TITLE"), body: t("GRADED_BODY") },
    { icon: "clock", title: t("PERIOD_TITLE"), body: t("PERIOD_BODY") },
  ];

  return (
    <section id="how-we-rank" className="mt-16 scroll-mt-24">
      <SectionLabel>{t("TITLE")}</SectionLabel>
      <div className="border-foreground/8 mt-6 grid border sm:grid-cols-2">
        {items.map((item, index) => (
          <div
            key={item.title}
            className={cn(
              "border-foreground/8 flex gap-3 p-5 sm:odd:border-r",
              index < items.length - 1 && "border-b",
              index >= items.length - 2 && "sm:border-b-0",
            )}
          >
            <Icon
              name={item.icon}
              className="text-foreground/50 mt-0.5 size-4 shrink-0"
            />
            <div>
              <p className="text-foreground/35 font-mono text-[11px]">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="text-foreground/90 mt-1 text-[13px] font-medium">
                {item.title}
              </h3>
              <p className="text-foreground/60 mt-1 text-sm leading-relaxed">
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
