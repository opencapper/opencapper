"use client";

import { CARD_LABEL } from "@/components/elements/page/page-heading";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard-hook";
import { env } from "@/lib/config/env";
import { useTranslations } from "next-intl";

export function ShareRecord(props: { username: string }) {
  const t = useTranslations("PROFILE.SHARE");
  const name = encodeURIComponent(props.username);
  // No locale prefix: the middleware sends each visitor to their own language.
  const profileUrl = `${env.siteOrigin}/u/${name}`;
  const badgeUrl = `${env.siteOrigin}/api/ops/badge/${name}`;
  const alt = t("BADGE_ALT");
  const rows = [
    { label: t("PROFILE_URL"), value: profileUrl },
    { label: t("BIO"), value: t("BIO_LINE", { url: profileUrl }) },
    { label: t("MARKDOWN"), value: `[![${alt}](${badgeUrl})](${profileUrl})` },
    {
      label: t("HTML"),
      value: `<a href="${profileUrl}"><img src="${badgeUrl}" alt="${alt}" height="20"></a>`,
    },
  ];

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/ops/badge/${name}`}
            alt={alt}
            height={20}
            className="h-5 w-auto"
          />
          <span className="text-foreground/45 text-xs">{t("PREVIEW")}</span>
        </div>
        <ul className="space-y-3">
          {rows.map((row) => (
            <CopyRow key={row.label} label={row.label} value={row.value} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function CopyRow(props: { label: string; value: string }) {
  const t = useTranslations("PROFILE.SHARE");
  const clipboard = useCopyToClipboard();
  return (
    <li className="space-y-1.5">
      <span className="label-mono text-foreground/45 text-[10px]">
        {props.label}
      </span>
      <div className="flex items-center gap-2">
        <code className="border-foreground/10 bg-muted/40 text-foreground/80 thin-scrollbar min-w-0 flex-1 overflow-x-auto rounded-md border px-3 py-2 font-mono text-xs whitespace-nowrap">
          {props.value}
        </code>
        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            clipboard.copy(props.value, { withToast: t("COPIED") })
          }
        >
          <Icon name={clipboard.isCopied ? "check" : "copy"} />
          {t("COPY")}
        </Button>
      </div>
    </li>
  );
}
