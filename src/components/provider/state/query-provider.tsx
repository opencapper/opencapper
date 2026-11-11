"use client";

import getQueryClient from "@/lib/react-query/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";

export function QueryProvider(props: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      {props.children}
    </QueryClientProvider>
  );
}
