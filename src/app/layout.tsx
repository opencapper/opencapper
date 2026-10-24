import "@/lib/utils/format/date";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ReactNode } from "react";

export default function RootLayout(props: { children: ReactNode }) {
  return <NuqsAdapter>{props.children}</NuqsAdapter>;
}
