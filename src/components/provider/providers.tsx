import { TooltipProvider } from "@/components/ui/tooltip";
import type { UserTheme } from "@/lib/theme/theme-types";
import { ReactNode } from "react";
import { ThemeProvider } from "./app/theme-provider";
import { UserThemeProvider } from "./app/user-theme-provider";
import { QueryProvider } from "./state/query-provider";
import { UserThemeStoreProvider } from "./state/user-theme-store-provider";

export function Providers(props: {
  children: ReactNode;
  userTheme?: UserTheme;
}) {
  return (
    <QueryProvider>
      <UserThemeStoreProvider data={props.userTheme}>
        <ThemeProvider>
          <UserThemeProvider>
            <TooltipProvider>{props.children}</TooltipProvider>
          </UserThemeProvider>
        </ThemeProvider>
      </UserThemeStoreProvider>
    </QueryProvider>
  );
}
