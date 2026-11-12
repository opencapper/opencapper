"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

// Each tile counts its own changes; a new count remounts only that tile, so only changed digits flip.
function useFlips(value: string): number[] {
  const state = useState({ value, gens: value.split("").map(() => 0) });
  let current = state[0];
  if (current.value !== value) {
    const prev = current;
    current = {
      value,
      gens: value
        .split("")
        .map((c, i) =>
          prev.value[i] === c ? (prev.gens[i] ?? 0) : (prev.gens[i] ?? 0) + 1,
        ),
    };
    state[1](current);
  }
  return current.gens;
}

// Split flap digits. Tiles are right aligned in a fixed width, so a price going to two digits never moves the row.
export function Flaps(props: {
  value: string;
  tiles: number;
  className?: string;
  tileClassName?: string;
}) {
  const padded = props.value.padStart(props.tiles, " ");
  const gens = useFlips(padded);
  return (
    <span
      aria-label={props.value}
      role="img"
      className={cn(
        "flex justify-end gap-[3px] [perspective:300px]",
        props.className,
      )}
    >
      {padded.split("").map((c, i) =>
        c === "." ? (
          <span
            key={i}
            aria-hidden
            className="num w-1.5 self-end text-center leading-none"
          >
            .
          </span>
        ) : (
          <span
            key={`${i}:${gens[i]}`}
            aria-hidden
            className={cn(
              "num grid place-items-center rounded-[4px] bg-[linear-gradient(#24211d_0_49%,#0f0e0c_49%_51%,#1c1a17_51%)] leading-none",
              c === " " && "opacity-30",
              gens[i] > 0 && "flap-flip",
              props.tileClassName,
            )}
          >
            {c === " " ? "" : c}
          </span>
        ),
      )}
    </span>
  );
}
