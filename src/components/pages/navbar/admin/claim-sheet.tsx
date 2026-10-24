"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAdminApproveClaimMutation } from "@/hooks/admin/admin-hook";
import type { AdminImportedProfile } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function ClaimSheet(props: {
  target: AdminImportedProfile | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const approve = useAdminApproveClaimMutation();
  const claimant = useState("");
  const target = props.target;

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          claimant[1]("");
          approve.reset();
        }
        props.onOpenChange(open);
      }}
    >
      <SheetContent side="bottom" className="bg-background mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>
            {t("ADMIN.CLAIM.TITLE", { username: target?.username ?? "" })}
          </SheetTitle>
          <SheetDescription>{t("ADMIN.CLAIM.HINT")}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!target || !claimant[0].trim()) return;
            approve.mutate(
              { id: target.id, claimant: claimant[0].trim() },
              {
                onSuccess: () => {
                  claimant[1]("");
                  props.onOpenChange(false);
                },
              },
            );
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="claimant" className="label-mono text-[10px]">
              {t("ADMIN.CLAIM.CLAIMANT")}
            </Label>
            <Input
              id="claimant"
              value={claimant[0]}
              onChange={(event) => claimant[1](event.target.value)}
              placeholder={t("ADMIN.CLAIM.CLAIMANT_PLACEHOLDER")}
              maxLength={33}
              required
            />
          </div>
          {approve.isError && (
            <p className="text-destructive text-sm">
              {apiErrorText(t, approve.error, t("ADMIN.USERS.ACTION_FAILED"))}
            </p>
          )}
          <SheetFooter className="p-0">
            <Button type="submit" disabled={approve.isPending}>
              <Icon name="user-check" />
              {t("ADMIN.CLAIM.CONFIRM")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
