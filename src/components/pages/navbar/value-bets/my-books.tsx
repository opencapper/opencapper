"use client";

import { actionErrorText } from "@/components/elements/account/action-error";
import { BookPicker } from "@/components/elements/vendor/book-picker";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useRouter } from "@/i18n/navigation";
import type { Settings } from "@/lib/api/client";
import { saveSettings, type ActionResult } from "@/lib/auth/actions";
import { COOKIE_MAX_AGE, MY_BOOKS_COOKIE } from "@/lib/config/constants";
import { useMutation } from "@tanstack/react-query";
import { setCookie } from "cookies-next/client";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Signed in, the books go to the account settings; signed out, to a cookie the server reads on the next render.
// The cookie is also written when skipping, so an empty list there means "asked, wants every book".
export function MyBooks(props: {
  books: string[];
  selected: string[];
  settings?: Settings;
  mode: "prompt" | "edit" | "settings";
  onDone?: () => void;
}) {
  const t = useTranslations();
  const router = useRouter();
  const picked = useState(props.selected);

  const mutation = useMutation({
    mutationFn: async (books: string[]): Promise<ActionResult> => {
      const saved: ActionResult =
        props.settings && books.length > 0
          ? await saveSettings({ ...props.settings, preferred_books: books })
          : { ok: true };
      if (saved.ok) setCookie(MY_BOOKS_COOKIE, JSON.stringify(books), { maxAge: COOKIE_MAX_AGE, path: "/" });
      return saved;
    },
    onSuccess: (result) => {
      if (!result.ok) return;
      props.onDone?.();
      router.refresh();
    },
  });
  const result = mutation.data;

  return (
    <section className="bg-card rounded-lg border p-4 sm:p-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold">{t("VALUE_BETS.MY_BOOKS_TITLE")}</h2>
        <p className="text-muted-foreground text-sm">
          {props.settings ? t("VALUE_BETS.MY_BOOKS_LINE_IN") : t("VALUE_BETS.MY_BOOKS_LINE_OUT")}
        </p>
      </div>
      <div className="mt-4">
        <BookPicker
          label={t("VALUE_BETS.MY_BOOKS_TITLE")}
          books={props.books}
          selected={picked[0]}
          onChange={picked[1]}
        />
      </div>
      {result && !result.ok && (
        <p role="alert" className="text-destructive mt-3 text-sm">
          {actionErrorText(result.error, t)}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={picked[0].length === 0 || mutation.isPending}
          onClick={() => mutation.mutate(picked[0])}
        >
          <Icon name="check" />
          {t("VALUE_BETS.MY_BOOKS_SAVE")}
        </Button>
        {props.mode === "prompt" ? (
          <Button
            size="sm"
            variant="ghost"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate([])}
          >
            {t("VALUE_BETS.MY_BOOKS_SKIP")}
          </Button>
        ) : props.mode === "edit" ? (
          <Button size="sm" variant="ghost" onClick={props.onDone}>
            {t("VALUE_BETS.MY_BOOKS_CANCEL")}
          </Button>
        ) : null}
        {picked[0].length === 0 && (
          <span className="text-muted-foreground text-xs">{t("VALUE_BETS.MY_BOOKS_NONE")}</span>
        )}
      </div>
    </section>
  );
}
