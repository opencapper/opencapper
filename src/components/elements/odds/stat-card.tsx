import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function StatCard(props: {
  label: string;
  value: ReactNode;
  icon?: IconName;
  hint?: string;
  tone?: StatTone;
}) {
  return (
    <Card size="sm" title={props.hint}>
      <CardHeader>
        <CardDescription className="label-mono text-foreground/45 flex items-center gap-1.5 text-[10px]">
          {props.icon && <Icon name={props.icon} className="size-3.5" />}
          {props.label}
        </CardDescription>
        <CardTitle
          className={cn(
            "tabular text-xl font-medium",
            props.tone && TONE[props.tone],
          )}
        >
          {props.value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}

export function StatGrid(props: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-4", props.className)}>
      {props.children}
    </div>
  );
}
