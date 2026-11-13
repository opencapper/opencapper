import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function SectionLabel(props: {
  children: ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p";
}) {
  const Tag = props.as ?? "h2";
  return <Tag className={cn("eyebrow", props.className)}>{props.children}</Tag>;
}

export function SectionTitle(props: { children: ReactNode }) {
  return (
    <h2 className="text-foreground text-base font-semibold">
      {props.children}
    </h2>
  );
}

export function PageHeading(props: {
  label: string;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  status?: ReactNode;
}) {
  return (
    <header className={cn("mb-8", props.className)}>
      <div className="flex items-center justify-between gap-3">
        <SectionLabel as="p">{props.label}</SectionLabel>
        {props.status}
      </div>
      <h1 className="text-foreground mt-1.5 text-2xl font-semibold sm:text-[28px]">
        {props.title}
      </h1>
      {props.description && (
        <p className="text-muted-foreground mt-1.5 max-w-2xl text-sm leading-relaxed">
          {props.description}
        </p>
      )}
      {props.children}
    </header>
  );
}

export const CARD_LABEL = "text-foreground text-sm font-semibold";
