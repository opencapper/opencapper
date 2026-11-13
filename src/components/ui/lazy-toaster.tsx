"use client";

import dynamic from "next/dynamic";

// Toasts only follow user actions, so sonner stays out of the first paint bundle.
export const LazyToaster = dynamic(
  () => import("@/components/ui/sonner").then((m) => m.Toaster),
  { ssr: false },
);
