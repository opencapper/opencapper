import { Icon } from "@/components/ui/icon";
import type { IconName } from "@/lib/config/icon-map";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export type StatTone = "win" | "warn" | "bad";

const TONE: Record<StatTone, string> = {
  win: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

// Fixed height and tabular digits: a live value never moves its neighbours.
export function StatCard(props: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  hint?: string;
  note?: ReactNode;
  tone?: StatTone;
}) {
  return (
    <div title={props.hint} className="bg-card min-w-0 rounded-lg border px-4 py-3">
      <div className="eyebrow flex items-center gap-1.5 normal-case">
        {props.icon && <Icon name={props.icon} className="size-3.5" />}
        <span className="truncate">{props.label}</span>
      </div>
      <div
        className={cn(
          "tabular mt-1 truncate text-xl leading-7 font-medium",
          props.tone && TONE[props.tone],
        )}
      >
        {props.value}
      </div>
      {props.note && (
        <div className="text-muted-foreground mt-0.5 truncate text-xs">
          {props.note}
        </div>
      )}
    </div>
  );
}

export function StatGrid(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", props.className)}>
      {props.children}
    </div>
  );
}
