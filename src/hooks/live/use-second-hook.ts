"use client";

import { useSyncExternalStore } from "react";

// One shared one second timer; only the components that read it re-render.
let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      for (const l of listeners) l();
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

// Hydration reads the server time passed in, so the first client render matches the HTML.
export function useSecond(serverNow: number): number {
  const value = useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
  return value || serverNow;
}
