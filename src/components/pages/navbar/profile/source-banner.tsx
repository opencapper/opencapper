import { SourceIcon } from "@/components/elements/source/source-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { CLAIM_ISSUE_URL } from "@/lib/config/constants";
import type { ApiProfileSource } from "@/lib/types";
import { useTranslations } from "next-intl";

export function SourceBanner(props: {
  username: string;
  source: ApiProfileSource;
}) {
  const t = useTranslations("SOURCES");
  const claim = new URL(CLAIM_ISSUE_URL);
  claim.searchParams.set("title", `Claim or dispute @${props.username}`);
  claim.searchParams.set(
    "body",
    `Profile: @${props.username}\nSource: ${props.source.url}\n`,
  );

  return (
    <Card className="mt-8">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <SourceIcon
          platform={props.source.platform}
          className="text-muted-foreground mt-0.5 size-5 shrink-0"
        />
        <div className="flex flex-col gap-1.5 text-sm">
          <p className="font-medium">
            {t("BANNER_TITLE", { platform: props.source.platform })}
          </p>
          <p className="text-muted-foreground">
            {t("BANNER_BODY", { platform: props.source.platform })}
          </p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            <a
              href={props.source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              {t("BANNER_SOURCE", { platform: props.source.platform })}
              <Icon name="external-link" className="size-3.5" />
            </a>
            <a
              href={claim.toString()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              {t("BANNER_CLAIM")}
              <Icon name="external-link" className="size-3.5" />
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
