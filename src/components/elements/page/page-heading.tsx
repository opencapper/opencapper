import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionLabel(props: {
  children: ReactNode;
  index?: number;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const Tag = props.as ?? "h2";
  return (
    <Tag
      className={cn(
        "label-mono text-foreground/80 flex items-center gap-3 font-normal",
        props.className,
      )}
    >
      {props.index !== undefined && (
        <span className="text-foreground/35 tabular-nums">
          {String(props.index).padStart(2, "0")}
        </span>
      )}
      <span className="shrink-0">{props.children}</span>
      <span aria-hidden className="bg-foreground/10 h-px flex-1" />
    </Tag>
  );
}

export function SectionTitle(props: { children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-4">
      <span className="text-foreground/90 shrink-0 text-lg font-medium tracking-tight">
        {props.children}
      </span>
      <span aria-hidden className="border-foreground/10 flex-1 border-t" />
    </h2>
  );
}

export function PageHeading(props: {
  label: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("mb-10", props.className)}>
      <SectionLabel as="p">{props.label}</SectionLabel>
      <h1 className="text-foreground/95 mt-6 text-2xl font-medium tracking-tight text-balance sm:text-3xl">
        {props.title}
      </h1>
      {props.description && (
        <p className="text-foreground/60 mt-3 max-w-2xl text-sm leading-relaxed sm:text-[15px]">
          {props.description}
        </p>
      )}
      {props.children}
    </header>
  );
}

export const CARD_LABEL =
  "label-mono text-foreground/80 text-[11px] leading-4 font-normal";
