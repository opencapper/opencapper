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
          ? "border-primary/40 bg-primary/10 text-foreground"
          : "text-muted-foreground hover:text-foreground hover:bg-muted",
      )}
    >
      {props.children}
    </Link>
  );
}

export function FilterRow(props: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="eyebrow w-24 shrink-0">
        {props.label}
      </span>
      {props.children}
    </div>
  );
}
