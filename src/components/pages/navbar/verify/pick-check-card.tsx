"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { PickStatusBadge } from "@/components/elements/badge/pick-status-badge";
import { Matchup } from "@/components/elements/participant/matchup";
import {
  SOURCE_NAMES,
  SourceIcon,
} from "@/components/elements/source/source-badge";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { Icon } from "@/components/ui/icon";
import { useLogVerifyQuery, type LogVerification } from "@/hooks/log/log-hook";
import { Link } from "@/i18n/navigation";
import { EXCHANGE_BOOKMAKER } from "@/lib/api/typebox/sources";
import type { IconName } from "@/lib/config/icon-map";
import { msg } from "@/lib/config/constants";
import { PICK_STATUS_KEY } from "@/lib/config/markets";
import { vendorName } from "@/lib/config/vendor-registry";
import type { ApiPick } from "@/lib/types";
import { cn } from "@/lib/utils";
import { dayjs, formatDateTime, formatDuration } from "@/lib/utils/format/date";
import { formatAmericanOdds } from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";

type SealState = "sealed" | "mismatch" | "checking" | "unsealed" | "error";

const SEAL = {
  sealed: {
    key: msg("VERIFY.CARD.SEALED"),
    icon: "circle-check",
    className: "bg-pick-win/15 text-pick-win",
  },
  mismatch: {
    key: msg("VERIFY.CARD.MISMATCH"),
    icon: "octagon-x",
    className: "bg-pick-loss/15 text-pick-loss",
  },
  checking: {
    key: msg("VERIFY.CARD.CHECKING"),
    icon: "loader",
    className: "bg-foreground/5 text-muted-foreground",
  },
  unsealed: {
    key: msg("VERIFY.CARD.UNSEALED"),
    icon: "clock",
    className: "bg-pick-pending/15 text-pick-pending",
  },
  error: {
    key: msg("VERIFY.CARD.ERROR"),
    icon: "triangle-alert",
    className: "bg-foreground/5 text-muted-foreground",
  },
} satisfies Record<
  SealState,
  { key: string; icon: IconName; className: string }
>;

export function isSealed(verification: LogVerification): boolean {
  return (
    verification.idMatches &&
    verification.leafMatches &&
    verification.rootMatches
  );
}

function sealState(
  logged: boolean,
  check: ReturnType<typeof useLogVerifyQuery>,
): SealState {
  if (!logged) return "unsealed";
  if (check.data) return isSealed(check.data) ? "sealed" : "mismatch";
  if (check.isError) return "error";
  return "checking";
}

export function SealBadge(props: { state: SealState }) {
  const t = useTranslations();
  const seal = SEAL[props.state];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium",
        seal.className,
      )}
    >
      <Icon
        name={seal.icon}
        className={cn("size-5", props.state === "checking" && "animate-spin")}
      />
      {t(seal.key)}
    </span>
  );
}

export function PickCheckCard(props: { pick: ApiPick }) {
  const t = useTranslations();
  const locale = useLocale();
  const local = useHydrated();
  const pick = props.pick;
  const logged = pick.logSeq != null;
  const check = useLogVerifyQuery(
    logged ? { kind: "pick", pickId: Number(pick.id) } : null,
  );
  const state = sealState(logged, check);
  const source = pick.source;
  const startMs = dayjs(pick.commenceTime).valueOf();
  const lockedMs = dayjs(pick.createdAt).valueOf();
  const lead = formatDuration(pick.createdAt, pick.commenceTime, locale);

  return (
    <li className="border-foreground/10 bg-card flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span
              role="img"
              aria-label={t(sportLabelKey(pick.sportKey))}
              className="text-muted-foreground inline-flex shrink-0"
            >
              <SportIcon sportKey={pick.sportKey} />
            </span>
            <Matchup event={pick} />
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="text-foreground text-base font-medium">
              {pick.selection}
            </span>
            <span className="tabular text-sm">
              {formatAmericanOdds(pick.odds)}
            </span>
            <span className="tabular text-muted-foreground text-sm">
              {t("VERIFY.CARD.UNITS", { count: pick.units })}
            </span>
            <PickStatusBadge result={pick.result} />
          </div>
          <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <Link
              href={{
                pathname: "/u/[username]",
                params: { username: pick.username },
                query: { pick: pick.id },
              }}
              className="hover:text-foreground underline-offset-2 hover:underline"
            >
              {t("VERIFY.CARD.BY", { username: pick.username })}
            </Link>
            <span className="tabular">
              {t("VERIFY.CARD.NUMBER", { seq: pick.sequence, id: pick.id })}
            </span>
          </div>
        </div>
        <SealBadge state={state} />
      </div>

      <dl className="border-foreground/10 grid gap-x-6 gap-y-3 border-t pt-4 text-sm sm:grid-cols-2">
        <Fact icon="clock" label={t("VERIFY.CARD.STARTS")}>
          {formatDateTime(pick.commenceTime, locale, local)}
        </Fact>
        <Fact
          icon="lock"
          label={t(source ? "VERIFY.CARD.IMPORTED" : "VERIFY.CARD.LOCKED_AT")}
        >
          {formatDateTime(pick.createdAt, locale, local)}
          <span
            className={cn(
              "ml-2 text-xs",
              lockedMs < startMs ? "text-muted-foreground" : "text-pick-loss",
            )}
          >
            {lockedMs < startMs
              ? t("VERIFY.CARD.LEAD", { duration: lead })
              : t("VERIFY.CARD.AFTER_START", { duration: lead })}
          </span>
        </Fact>
        <Fact icon="coins" label={t("VERIFY.CARD.ODDS")}>
          {formatAmericanOdds(pick.odds)}
          <span className="text-muted-foreground ml-2 text-xs">
            {pick.bookmaker === EXCHANGE_BOOKMAKER
              ? t("VERIFY.CARD.EXCHANGE_PRICE")
              : vendorName(pick.bookmaker)}
          </span>
        </Fact>
        <Fact icon="scale" label={t("VERIFY.CARD.RESULT")}>
          {t(PICK_STATUS_KEY[pick.result])}
        </Fact>
        {source && (
          <Fact icon="link" label={t("VERIFY.CARD.SOURCE")}>
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              <SourceIcon platform={source.platform} className="size-3" />
              {t("SOURCES.PICK_SOURCE", { platform: source.platform })}
            </a>
            <span className="text-muted-foreground ml-2 text-xs">
              {formatDateTime(source.postedAt, locale, local)}
            </span>
          </Fact>
        )}
      </dl>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {source
          ? t("VERIFY.CARD.PROOF_NOTE_IMPORTED", {
              platform: SOURCE_NAMES[source.platform],
            })
          : t("VERIFY.CARD.PROOF_NOTE")}
      </p>
      {state === "mismatch" && (
        <p className="text-pick-loss text-sm">
          {t("VERIFY.CARD.MISMATCH_HINT")}
        </p>
      )}
    </li>
  );
}

function Fact(props: { icon: IconName; label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="label-mono text-foreground/45 flex items-center gap-1.5 text-[10px]">
        <Icon name={props.icon} className="size-3.5" />
        {props.label}
      </dt>
      <dd className="tabular mt-1">{props.children}</dd>
    </div>
  );
}
