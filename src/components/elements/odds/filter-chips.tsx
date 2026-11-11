import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Chip(props: { active: boolean; href: string; children: ReactNode }) {
  return (
    <Link
      href={props.href}
      scroll={false}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs transition-colors",
        props.active
          ? "border-foreground/40 bg-foreground/10 text-foreground"
          : "text-foreground/55 hover:text-foreground hover:bg-foreground/5",
      )}
    >
      {props.children}
    </Link>
  );
}

export function FilterRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label-mono text-foreground/45 w-20 shrink-0 text-[10px]">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}
