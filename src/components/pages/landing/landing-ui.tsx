import { Link } from "@/i18n/navigation";
import type { LinkHref } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const BOARD_ROWS = 6;

export const WRAP = "mx-auto w-full max-w-[1360px] px-4 sm:px-8 lg:px-10";

export type Band = "paper" | "paper2" | "pitch" | "ink" | "vermilion";

const BAND: Record<Band, string> = {
  paper: "bg-background text-foreground",
  paper2: "bg-paper-2 text-ink dark:text-chalk",
  pitch: "bg-pitch text-chalk",
  ink: "bg-band text-chalk",
  vermilion: "bg-vermilion text-ink",
};

const NUMBER: Record<Band, string> = {
  paper: "[-webkit-text-stroke:2px_var(--color-foreground)]",
  paper2: "[-webkit-text-stroke:2px_var(--color-foreground)]",
  pitch: "[-webkit-text-stroke:2px_#5fa77f]",
  ink: "[-webkit-text-stroke:2px_#6a6158]",
  vermilion: "[-webkit-text-stroke:2px_var(--color-ink)]",
};

export function Section(props: {
  id?: string;
  band?: Band;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={props.id}
      className={cn(
        "relative overflow-hidden py-20 sm:py-28",
        BAND[props.band ?? "paper"],
        props.className,
      )}
    >
      {props.children}
    </section>
  );
}

// Outlined section number, Anton headline, one serif line: the paper's section head.
export function SectionHead(props: {
  index: number;
  title: ReactNode;
  line: ReactNode;
  band?: Band;
  aside?: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-10 grid grid-cols-1 items-end gap-x-7 gap-y-1 sm:mb-14",
        !props.stacked && "lg:grid-cols-[auto_1fr_auto]",
      )}
    >
      <div
        aria-hidden
        className={cn(
          "num text-[84px] leading-[0.8] text-transparent sm:text-[150px]",
          NUMBER[props.band ?? "paper"],
        )}
      >
        {String(props.index).padStart(2, "0")}
      </div>
      <div className="min-w-0">
        <h2 className="headline text-[48px] text-balance sm:text-[clamp(56px,6.6vw,104px)]">
          {props.title}
        </h2>
        <p className="mt-3 max-w-2xl font-serif text-[22px] leading-tight italic opacity-90 sm:text-[28px]">
          {props.line}
        </p>
      </div>
      {props.aside && <div className="lg:pb-3">{props.aside}</div>}
    </div>
  );
}

export function Arrow(props: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      className={cn("size-4", props.className)}
    >
      <path d="M2 8h11M9 4l4 4-4 4" />
    </svg>
  );
}

const PILL =
  "inline-flex h-12 items-center gap-2.5 rounded-full border-2 px-6 text-[14px] font-extrabold tracking-[0.05em] whitespace-nowrap uppercase transition-[transform,background-color,color] duration-200 active:translate-y-px sm:h-[52px] sm:px-7";

const PILL_TONE = {
  vermilion:
    "bg-vermilion border-vermilion text-ink hover:bg-vermilion-2 hover:border-vermilion-2",
  ink: "bg-foreground border-foreground text-background hover:opacity-85",
  outline: "border-current hover:bg-foreground/5",
  chalk: "bg-chalk border-chalk text-ink hover:bg-paper",
} as const;

export function Pill(props: {
  href: LinkHref;
  tone?: keyof typeof PILL_TONE;
  children: ReactNode;
  className?: string;
  external?: boolean;
}) {
  const className = cn(
    PILL,
    PILL_TONE[props.tone ?? "outline"],
    props.className,
  );
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

export function SampleTag(props: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-dashed border-current/40 px-2 py-0.5 font-mono text-[10px] tracking-[0.12em] uppercase opacity-70",
        props.className,
      )}
    >
      {props.children}
    </span>
  );
}

export function LiveDot(props: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "live-dot bg-vermilion inline-block size-2 shrink-0 rounded-full",
        props.className,
      )}
    />
  );
}
