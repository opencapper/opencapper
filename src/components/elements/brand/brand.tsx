import { cn } from "@/lib/utils";

// Centre circle of a pitch; the vermilion slice is the edge a wrong price leaves.
export const CREST_SLICE = "M24 24 L24 3 A21 21 0 0 1 38.85 9.15 Z";

export function LogoImage(props: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 48 48"
      className={cn("text-foreground size-7 shrink-0", props.className)}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
      />
      <path d="M3 24H45" stroke="currentColor" strokeWidth="2.5" />
      <circle
        cx="24"
        cy="24"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path d={CREST_SLICE} className="fill-vermilion" />
      <circle cx="24" cy="24" r="2.6" fill="currentColor" />
    </svg>
  );
}

export function CompanyName(props: { className?: string }) {
  return (
    <span
      className={cn(
        "font-display inline-flex items-baseline text-[22px] leading-none tracking-normal uppercase",
        props.className,
      )}
    >
      Open
      <span className="serif-accent text-vermilion ml-px text-[1.14em] leading-none">
        ev
      </span>
    </span>
  );
}
