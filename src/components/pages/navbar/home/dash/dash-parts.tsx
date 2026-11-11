import { Icon } from "@/components/ui/icon";
import { Link } from "@/i18n/navigation";
import type { IconName } from "@/lib/config/icon-map";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const HAIRLINE_GRID = "bg-foreground/6 grid gap-px overflow-hidden rounded-md border border-foreground/6";

export const TH = "label-mono text-foreground/40 px-3 py-2 text-left text-[9px] font-normal";
export const TD = "px-3 py-2 align-middle";

export function Panel(props: {
  title: string;
  icon?: IconName;
  meta?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("bg-card flex min-w-0 flex-col", props.className)}>
      <header className="border-foreground/6 flex items-center justify-between gap-2 border-b px-3 py-2">
        <h4 className="label-mono text-foreground/60 flex items-center gap-1.5 text-[9px]">
          {props.icon && <Icon name={props.icon} className="size-3" />}
          {props.title}
        </h4>
        {props.meta && <span className="text-foreground/35 truncate font-mono text-[9px]">{props.meta}</span>}
      </header>
      <div className="flex min-w-0 flex-1 flex-col">{props.children}</div>
    </section>
  );
}

export function Stat(props: {
  icon: IconName;
  label: string;
  value: ReactNode;
  hint: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={cn("bg-card flex min-w-0 flex-col gap-1 px-3 py-2.5", props.className)}>
      <span className="label-mono text-foreground/45 flex items-center gap-1.5 text-[9px]">
        <Icon name={props.icon} className="size-3" />
        {props.label}
      </span>
      <span className={cn("tabular truncate text-lg font-medium tracking-tight", props.tone ?? "text-foreground/90")}>
        {props.value}
      </span>
      <span className="text-foreground/40 truncate text-[10px]">{props.hint}</span>
    </div>
  );
}

export function Row(props: { label: string; children: ReactNode }) {
  return (
    <div className="border-foreground/6 flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
      <span className="text-foreground/50 shrink-0 text-[11px]">{props.label}</span>
      <span className="tabular text-foreground/85 min-w-0 truncate text-right font-mono text-[11px]">
        {props.children}
      </span>
    </div>
  );
}

export function FrameLink(props: { href: string; children: ReactNode }) {
  return (
    <Link
      href={props.href}
      className="group label-mono text-foreground/70 hover:text-foreground border-foreground/10 hover:bg-muted inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[9px] transition-colors"
    >
      {props.children}
      <Icon name="arrow-up-right" className="size-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
