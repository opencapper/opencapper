"use client";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { formatDateTime } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";

export function DisqualifiedBadge(props: { actualStart: string }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const time = formatDateTime(props.actualStart, locale, local);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge
            variant="outline"
            className="bg-pick-loss/15 text-pick-loss cursor-help border-transparent"
          />
        }
      >
        <Icon name="octagon-x" />
        {t("PROFILE.PICKS.DISQUALIFIED")}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {t("PROFILE.PICKS.DISQUALIFIED_HINT", { time })}
      </TooltipContent>
    </Tooltip>
  );
}
