"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useStartClaimMutation,
  useVerifyClaimMutation,
} from "@/hooks/claims/claims-hook";
import { SOURCE_NAMES } from "@/components/elements/source/source-badge";
import { useCopyToClipboard } from "@/hooks/ui/use-copy-to-clipboard-hook";
import type { SourcePlatform } from "@/lib/api/typebox/sources";
import { apiErrorText } from "@/lib/utils/api-error";
import { formatDateTime } from "@/lib/utils/format/date";
import { useLocale, useTranslations } from "next-intl";

export function ClaimDialog(props: {
  username: string;
  platform: SourcePlatform;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("CLAIM");
  const tRoot = useTranslations();
  const locale = useLocale();
  const start = useStartClaimMutation(props.username);
  const verify = useVerifyClaimMutation(props.username);
  const clipboard = useCopyToClipboard();
  const challenge = start.data;
  const platform = SOURCE_NAMES[props.platform];
  const failure = verify.error ?? start.error;

  return (
    <Sheet
      open={props.open}
      onOpenChange={(open) => {
        if (!open && verify.isSuccess) {
          start.reset();
          verify.reset();
        }
        props.onOpenChange(open);
      }}
    >
      <SheetContent side="bottom" className="bg-background mx-auto max-w-lg">
        <SheetHeader>
          <SheetTitle>
            {verify.isSuccess
              ? t("SUCCESS_TITLE")
              : t("TITLE", { username: props.username })}
          </SheetTitle>
          <SheetDescription>
            {verify.isSuccess
              ? t("SUCCESS_BODY", { username: props.username })
              : t("INTRO", { platform })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-6 text-sm">
          {!verify.isSuccess && challenge && (
            <ol className="flex flex-col gap-4">
              <li className="flex flex-col gap-2">
                <span className="font-medium">{t("STEP_CODE")}</span>
                <div className="flex items-center gap-2">
                  <code className="bg-muted tabular flex-1 rounded-md px-3 py-2 font-mono text-base select-all">
                    {challenge.code}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      clipboard.copy(challenge.code, {
                        withToast: t("COPIED"),
                      })
                    }
                  >
                    <Icon name={clipboard.isCopied ? "check" : "copy"} />
                    {t("COPY")}
                  </Button>
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <span className="font-medium">
                  {t("STEP_BIO", { platform })}
                </span>
                <a
                  href={challenge.editUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline"
                >
                  {t("OPEN_SETTINGS", { platform })}
                  <Icon name="external-link" className="size-3.5" />
                </a>
              </li>
              <li className="flex flex-col gap-1.5">
                <span className="font-medium">{t("STEP_VERIFY")}</span>
                <span className="text-muted-foreground text-xs">
                  {t("EXPIRES", {
                    time: formatDateTime(challenge.expiresAt, locale),
                  })}
                </span>
              </li>
            </ol>
          )}

          {verify.isPending && (
            <p
              role="status"
              className="text-muted-foreground inline-flex items-center gap-2"
            >
              <Icon name="loader" className="animate-spin" />
              {t("VERIFYING", { platform })}
            </p>
          )}
          {failure && !verify.isPending && !verify.isSuccess && (
            <p role="alert" className="text-destructive">
              {apiErrorText(tRoot, failure, t("FAILED"))}
            </p>
          )}

          <SheetFooter className="p-0">
            {verify.isSuccess && (
              <Button onClick={() => props.onOpenChange(false)}>
                <Icon name="circle-check" />
                {t("DONE")}
              </Button>
            )}
            {!verify.isSuccess && !challenge && (
              <Button disabled={start.isPending} onClick={() => start.mutate()}>
                <Icon name={start.isPending ? "loader" : "hash"} />
                {t("START")}
              </Button>
            )}
            {!verify.isSuccess && challenge && (
              <div className="flex flex-col gap-2 sm:flex-row-reverse">
                <Button
                  disabled={verify.isPending}
                  onClick={() => verify.mutate()}
                >
                  <Icon name="shield-check" />
                  {t("VERIFY")}
                </Button>
                <Button
                  variant="ghost"
                  disabled={start.isPending || verify.isPending}
                  onClick={() => {
                    verify.reset();
                    start.mutate();
                  }}
                >
                  <Icon name="refresh-ccw" />
                  {t("NEW_CODE")}
                </Button>
              </div>
            )}
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
