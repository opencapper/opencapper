import { TooltipProvider } from "@/components/ui/tooltip";
import { ReactNode } from "react";
import { ThemeProvider } from "./app/theme-provider";
import { QueryProvider } from "./state/query-provider";

export function Providers(props: { children: ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider>
        <TooltipProvider>{props.children}</TooltipProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
