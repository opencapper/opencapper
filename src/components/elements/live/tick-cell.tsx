"use client";

import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

// Green when the number rises, red when it falls; two class names restart the animation.
function useTick(value: number): string | undefined {
  const state = useState({ value, dir: "", n: 0 });
  let tick = state[0];
  if (tick.value !== value) {
    tick = { value, dir: value > tick.value ? "up" : "down", n: tick.n + 1 };
    state[1](tick);
  }
  return tick.dir ? `tick-${tick.dir}-${tick.n % 2}` : undefined;
}

export function TickCell(props: {
  value: number;
  className?: string;
  title?: string;
  children: ReactNode;
}) {
  const tick = useTick(props.value);
  return (
    <td title={props.title} className={cn(props.className, tick)}>
      {props.children}
    </td>
  );
}

export function TickText(props: {
  value: number;
  className?: string;
  children: ReactNode;
}) {
  const tick = useTick(props.value);
  return (
    <span className={cn("-mx-1 rounded-sm px-1", props.className, tick)}>
      {props.children}
    </span>
  );
}
