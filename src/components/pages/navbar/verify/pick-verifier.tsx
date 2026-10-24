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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogVerifyQuery, type VerifyTarget } from "@/hooks/log/log-hook";
import { cn } from "@/lib/utils";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { HashRow } from "./hash-row";
import { isSealed } from "./pick-check-card";

const PICK_ID = /^\d{1,9}$/;
const USER_SEQ = /^@?([A-Za-z0-9_.]{2,32})\s*[#/\s]\s*(\d{1,9})$/;

function parseTarget(text: string): VerifyTarget | null {
  const value = text.trim();
  if (PICK_ID.test(value)) return { kind: "pick", pickId: Number(value) };
  const match = USER_SEQ.exec(value);
  if (!match) return null;
  return { kind: "user", username: match[1], seq: Number(match[2]) };
}

export function PickVerifier(props: { initial: string }) {
  const t = useTranslations("VERIFY.CHECK");
  const tRoot = useTranslations();
  const draft = useState(props.initial);
  const target = useState<VerifyTarget | null>(parseTarget(props.initial));
  const invalid = useState(false);
  const result = useLogVerifyQuery(target[0]);
  const verification = result.data;
  const ok = verification !== undefined && isSealed(verification);

  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className={CARD_LABEL}>{t("TITLE")}</CardTitle>
        <CardDescription>{t("DESCRIPTION")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            const next = parseTarget(draft[0]);
            invalid[1](next === null);
            if (next) target[1](next);
          }}
        >
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="verify-pick">{t("LABEL")}</Label>
            <Input
              id="verify-pick"
              value={draft[0]}
              placeholder={t("PLACEHOLDER")}
              aria-invalid={invalid[0]}
              onChange={(e) => draft[1](e.target.value)}
            />
          </div>
          <Button type="submit">{t("SUBMIT")}</Button>
        </form>
        {invalid[0] && (
          <p className="text-destructive text-sm">{t("INVALID")}</p>
        )}

        {result.isFetching && <Skeleton className="h-40 rounded-xl" />}
        {result.isError && !result.isFetching && (
          <p className="text-muted-foreground text-sm">
            {apiErrorText(tRoot, result.error, t("NOT_FOUND"))}
          </p>
        )}
        {verification && !result.isFetching && (
          <div className="space-y-4">
            <div
              className={cn(
                "flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium",
                ok
                  ? "border-success/40 text-success"
                  : "border-destructive/40 text-destructive",
              )}
            >
              <Icon
                name={ok ? "circle-check" : "octagon-x"}
                className="size-4"
              />
              {ok
                ? t("MATCH", { seq: verification.entry.seq })
                : t("MISMATCH", { seq: verification.entry.seq })}
            </div>
            <dl className="space-y-3">
              <HashRow
                label={t("CANONICAL")}
                value={verification.entry.canonical}
              />
              <HashRow label={t("LEAF")} value={verification.entry.leaf} />
              <HashRow
                label={t("COMPUTED_LEAF")}
                value={verification.computedLeaf}
              />
              <HashRow
                label={t("PREV_ROOT")}
                value={verification.entry.prevRoot}
              />
              <HashRow label={t("ROOT")} value={verification.entry.root} />
              <HashRow
                label={t("COMPUTED_ROOT")}
                value={verification.computedRoot}
              />
            </dl>
            {!verification.idMatches && (
              <p className="text-destructive text-sm">{t("ID_MISMATCH")}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
