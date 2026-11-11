"use client";

import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

// The board is server rendered; this re-renders it so prices stay current without a reload.
export function AutoRefresh(props: { seconds: number }) {
  const router = useRouter();
  const seconds = props.seconds;
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
