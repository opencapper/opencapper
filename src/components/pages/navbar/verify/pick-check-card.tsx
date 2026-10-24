"use client";

import { useHydrated } from "@/hooks/ui/use-hydrated-hook";
import { Matchup } from "@/components/elements/participant/matchup";
import {
  SportIcon,
  sportLabelKey,
} from "@/components/elements/sport/sport-icon";
import { Icon } from "@/components/ui/icon";
import { useLogVerifyQuery, type LogVerification } from "@/hooks/log/log-hook";
import { Link } from "@/i18n/navigation";
import type { IconName } from "@/lib/config/icon-map";
import { msg } from "@/lib/config/constants";
import type { ApiPick } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/format/date";
import { formatAmericanOdds } from "@/lib/utils/format/number";
import { useLocale, useTranslations } from "next-intl";

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
  const logged = props.pick.logSeq != null;
  const check = useLogVerifyQuery(
    logged ? { kind: "pick", pickId: Number(props.pick.id) } : null,
  );
  const state = sealState(logged, check);

  return (
    <li className="border-foreground/10 bg-card flex flex-col gap-4 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <span
            role="img"
            aria-label={t(sportLabelKey(props.pick.sportKey))}
            className="text-muted-foreground inline-flex shrink-0"
          >
            <SportIcon sportKey={props.pick.sportKey} />
          </span>
          <Matchup event={props.pick} />
        </div>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <span className="text-foreground text-base font-medium">
            {props.pick.selection}
          </span>
          <span className="tabular text-sm">
            {formatAmericanOdds(props.pick.odds)}
          </span>
          <span className="tabular text-muted-foreground text-sm">
            {t("VERIFY.CARD.UNITS", { count: props.pick.units })}
          </span>
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="tabular inline-flex items-center gap-1.5">
            <Icon name="lock" className="size-3.5" />
            {t("VERIFY.CARD.LOCKED", {
              time: formatDateTime(props.pick.createdAt, locale, local),
            })}
          </span>
          <Link
            href={{
              pathname: "/u/[username]",
              params: { username: props.pick.username },
              query: { pick: props.pick.id },
            }}
            className="hover:text-foreground underline-offset-2 hover:underline"
          >
            {t("VERIFY.CARD.BY", { username: props.pick.username })}
          </Link>
          <span className="tabular">
            {t("VERIFY.CARD.NUMBER", { seq: props.pick.sequence })}
          </span>
        </div>
        {state === "mismatch" && (
          <p className="text-pick-loss text-sm">
            {t("VERIFY.CARD.MISMATCH_HINT")}
          </p>
        )}
      </div>
      <SealBadge state={state} />
    </li>
  );
}
