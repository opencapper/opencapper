import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import type { IconName } from "@/lib/config/icon-map";
import { useTranslations } from "next-intl";

const SOURCE_ICON = {
  polymarket: "trending-up",
  reddit: "message-square",
} satisfies Record<SourcePlatform, IconName>;

// Brand names, never translated; ICU `select` per message is costly for the typed message keys.
export const SOURCE_NAMES = {
  polymarket: "Polymarket",
  reddit: "Reddit",
} satisfies Record<SourcePlatform, string>;

export function SourceIcon(props: {
  platform: SourcePlatform;
  className?: string;
}) {
  return (
    <Icon name={SOURCE_ICON[props.platform]} className={props.className} />
  );
}

export function PublicBadge(props: {
  platform: SourcePlatform;
  claimed?: boolean;
}) {
  const t = useTranslations("SOURCES");
  return (
    <Tooltip>
      <TooltipTrigger
        render={<Badge variant="outline" className="text-muted-foreground" />}
      >
        <SourceIcon platform={props.platform} />
        {t("PUBLIC_BADGE")}
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        {props.claimed
          ? t("PUBLIC_HINT_CLAIMED", { platform: SOURCE_NAMES[props.platform] })
          : t("PUBLIC_HINT", { platform: props.platform })}
      </TooltipContent>
    </Tooltip>
  );
}
