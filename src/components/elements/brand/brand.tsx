import { cn } from "@/lib/utils";

// A plus in a rounded square: positive expected value, nothing more.
export const MARK_PLUS = "M12 7.5v9M7.5 12h9";

export function LogoImage(props: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("size-6 shrink-0", props.className)}
    >
      <rect width="24" height="24" rx="6" className="fill-foreground" />
      <path
        d={MARK_PLUS}
        className="stroke-background"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function CompanyName(props: { className?: string }) {
  return (
    <span
      className={cn(
        "text-[17px] leading-none font-semibold tracking-[-0.02em]",
        props.className,
      )}
    >
      Open<span className="text-muted-foreground">EV</span>
    </span>
  );
}
