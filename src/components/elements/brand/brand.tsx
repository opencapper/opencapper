import { env } from "@/lib/config/env";
import { cn } from "@/lib/utils";

const appName = env.appName;

export function LogoImage(props: { className?: string }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className={cn("text-foreground size-5 shrink-0", props.className)}
    >
      <path
        fill="currentColor"
        fillRule="evenodd"
        d="M0 0h24v24H0zM12 5a7 7 0 1 0 0 14a7 7 0 0 0 0-14m0 3.5a3.5 3.5 0 1 1 0 7a3.5 3.5 0 0 1 0-7"
      />
    </svg>
  );
}

export function CompanyName(props: { className?: string }) {
  return (
    <span className={cn("font-medium tracking-tight", props.className)}>
      {appName.toUpperCase()}
      <span className="text-muted-foreground">.</span>
    </span>
  );
}
