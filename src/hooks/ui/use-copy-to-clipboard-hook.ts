"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useCopyToClipboard() {
  const [text, setText] = useState<string | null>(null);

  const copy = async (
    value: string,
    options: { timeout?: number; withToast?: string },
  ) => {
    const timeout = options.timeout ?? 3000;
    if (!navigator?.clipboard) return false;
    try {
      await navigator.clipboard.writeText(value);
      setText(value);
      if (timeout) setTimeout(() => setText(null), timeout);
      if (options.withToast) toast.success(options.withToast);
      return true;
    } catch {
      setText(null);
      return false;
    }
  };

  return { text, copy, isCopied: text !== null };
}
