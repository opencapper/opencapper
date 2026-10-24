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
import { useBanUserMutation } from "@/hooks/admin/admin-hook";
import type { AdminUser } from "@/lib/types";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";

const REASON_MAX = 200;

export function BanSheet(props: {
  target: AdminUser | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations();
  const ban = useBanUserMutation();
  const reason = useState("");
  const target = props.target;

  return (
    <Sheet
      open={target !== null}
      onOpenChange={(open) => {
        if (!open) {
          reason[1]("");
          ban.reset();
        }
        props.onOpenChange(open);
      }}
    >
      <SheetContent side="bottom" className="bg-background mx-auto max-w-md">
        <SheetHeader>
          <SheetTitle>
            {t("ADMIN.BAN.TITLE", { username: target?.username ?? "" })}
          </SheetTitle>
          <SheetDescription>{t("ADMIN.BAN.HINT")}</SheetDescription>
        </SheetHeader>
        <form
          className="flex flex-col gap-4 px-4 pb-6"
          onSubmit={(event) => {
            event.preventDefault();
            if (!target?.authUserId) return;
            ban.mutate(
              { userId: target.authUserId, reason: reason[0].trim() },
              {
                onSuccess: () => {
                  reason[1]("");
                  props.onOpenChange(false);
                },
              },
            );
          }}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ban-reason" className="label-mono text-[10px]">
              {t("ADMIN.BAN.REASON")}
            </Label>
            <Input
              id="ban-reason"
              value={reason[0]}
              onChange={(event) => reason[1](event.target.value)}
              placeholder={t("ADMIN.BAN.REASON_PLACEHOLDER")}
              maxLength={REASON_MAX}
            />
          </div>
          {ban.isError && (
            <p className="text-destructive text-sm">
              {apiErrorText(t, ban.error, t("ADMIN.USERS.ACTION_FAILED"))}
            </p>
          )}
          <SheetFooter className="p-0">
            <Button
              type="submit"
              variant="destructive"
              disabled={ban.isPending}
            >
              <Icon name="ban" />
              {t("ADMIN.BAN.CONFIRM")}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
