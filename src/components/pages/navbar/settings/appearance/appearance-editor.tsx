"use client";

import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

// The editor reads live CSS off the page, so it only renders in the browser.
export const AppearanceEditor = dynamic(
  () =>
    import("@/components/elements/theme/customizer-body").then(
      (m) => m.ThemeCustomizerBody,
    ),
  { ssr: false, loading: () => <Skeleton className="h-96 rounded-xl" /> },
);
