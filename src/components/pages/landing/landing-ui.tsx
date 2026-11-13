import { Link } from "@/i18n/navigation";
import type { LinkHref } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const BOARD_ROWS = 6;

export const WRAP = "mx-auto w-full max-w-7xl px-4 sm:px-6";

export function Section(props: {
  id?: string;
  muted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={props.id}
      className={cn(
        "border-t py-16 sm:py-24",
        props.muted && "bg-subtle",
        props.className,
      )}
    >
      <div className={WRAP}>{props.children}</div>
    </section>
  );
}

// One headline, one line: every landing section opens the same way.
export function SectionHead(props: {
  title: ReactNode;
  line: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="mb-10 flex flex-col justify-between gap-4 sm:mb-12 md:flex-row md:items-end">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-semibold sm:text-3xl">{props.title}</h2>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          {props.line}
        </p>
      </div>
      {props.aside}
    </div>
  );
}

const CTA =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-medium whitespace-nowrap transition-colors";

const CTA_TONE = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "bg-background hover:bg-muted border",
} as const;

export function Cta(props: {
  href: LinkHref;
  tone?: keyof typeof CTA_TONE;
  external?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const className = cn(CTA, CTA_TONE[props.tone ?? "outline"], props.className);
  if (props.external && typeof props.href === "string") {
    return (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {props.children}
      </a>
    );
  }
  return (
    <Link href={props.href} className={className}>
      {props.children}
    </Link>
  );
}

export function SampleTag(props: { children: ReactNode }) {
  return (
    <span className="text-muted-foreground inline-flex items-center rounded border border-dashed px-1.5 py-0.5 text-[11px]">
      {props.children}
    </span>
  );
}
