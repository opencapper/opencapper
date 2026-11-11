import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageShell(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
