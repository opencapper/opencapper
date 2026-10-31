"use client";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePickQuery,
  useUserPickQuery,
  useUserPicksQuery,
} from "@/hooks/users/users-hook";
import { Link } from "@/i18n/navigation";
import { apiErrorText } from "@/lib/utils/api-error";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { PickCheckCard } from "./pick-check-card";
import { parseSearch, searchQuery, type SearchTarget } from "./search-target";

const RECENT_PICKS = 10;

export function PickSearch(props: { initial: string }) {
  const t = useTranslations("VERIFY.SEARCH");
  const draft = useState(props.initial);
  const target = useState<SearchTarget | null>(parseSearch(props.initial));
  const invalid = useState(false);

  return (
    <section className="space-y-6">
      <form
        className="flex flex-col gap-2 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const next = parseSearch(draft[0]);
          invalid[1](next === null);
          if (!next) return;
          target[1](next);
          window.history.replaceState(null, "", searchQuery(next));
        }}
      >
        <div className="flex-1 space-y-2">
          <Label htmlFor="verify-search" className="text-base">
            {t("LABEL")}
          </Label>
          <Input
            id="verify-search"
            value={draft[0]}
            placeholder={t("PLACEHOLDER")}
            aria-invalid={invalid[0]}
            autoComplete="off"
            spellCheck={false}
            className="h-11 text-base"
            onChange={(e) => draft[1](e.target.value)}
          />
        </div>
        <Button type="submit" size="lg" className="h-11 px-6">
          <Icon name="search" className="size-4" />
          {t("SUBMIT")}
        </Button>
      </form>
      {invalid[0] && <p className="text-destructive text-sm">{t("INVALID")}</p>}
      {target[0] && <SearchResults target={target[0]} />}
    </section>
  );
}

function SearchResults(props: { target: SearchTarget }) {
  const target = props.target;
  if (target.kind === "capper")
    return <CapperPicks key={target.username} username={target.username} />;
  if (target.kind === "user")
    return (
      <UserPick
        key={`${target.username}#${target.seq}`}
        username={target.username.toLowerCase()}
        seq={target.seq}
      />
    );
  return <PickById key={target.pickId} pickId={target.pickId} />;
}

function Status(props: { text: string }) {
  return <p className="text-muted-foreground text-sm">{props.text}</p>;
}

function CapperPicks(props: { username: string }) {
  const t = useTranslations("VERIFY.SEARCH");
  const tRoot = useTranslations();
  const picks = useUserPicksQuery(props.username.toLowerCase());

  if (picks.isPending) return <Skeleton className="h-32 rounded-xl" />;
  if (picks.isError)
    return <Status text={apiErrorText(tRoot, picks.error, t("ERROR"))} />;
  if (picks.data.length === 0)
    return <Status text={t("NO_PICKS", { username: props.username })} />;
  const username = picks.data[0].username;
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-foreground/90 text-sm font-medium">
          {t("LATEST", { username })}
        </h2>
        <Link
          href={{ pathname: "/u/[username]", params: { username } }}
          className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
        >
          {t("PROFILE")}
          <Icon name="arrow-up-right" className="size-3.5" />
        </Link>
      </div>
      <ul className="space-y-3">
        {picks.data.slice(0, RECENT_PICKS).map((pick) => (
          <PickCheckCard key={pick.id} pick={pick} />
        ))}
      </ul>
    </div>
  );
}

function UserPick(props: { username: string; seq: number }) {
  const t = useTranslations("VERIFY.SEARCH");
  const tRoot = useTranslations();
  const pick = useUserPickQuery(props.username, props.seq);
  if (pick.isPending) return <Skeleton className="h-32 rounded-xl" />;
  if (pick.isError)
    return <Status text={apiErrorText(tRoot, pick.error, t("NOT_FOUND"))} />;
  return (
    <ul>
      <PickCheckCard pick={pick.data} />
    </ul>
  );
}

function PickById(props: { pickId: number }) {
  const t = useTranslations("VERIFY.SEARCH");
  const tRoot = useTranslations();
  const pick = usePickQuery(props.pickId);
  if (pick.isPending) return <Skeleton className="h-32 rounded-xl" />;
  if (pick.isError)
    return <Status text={apiErrorText(tRoot, pick.error, t("NOT_FOUND"))} />;
  return (
    <ul>
      <PickCheckCard pick={pick.data} />
    </ul>
  );
}
