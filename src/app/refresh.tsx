"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// The board is server rendered; this re-renders it so prices stay current without a reload.
export function AutoRefresh({ seconds }: { seconds: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);
  return null;
}
