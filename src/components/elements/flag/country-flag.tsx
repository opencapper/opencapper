"use client";

import { countryCode } from "@/lib/config/countries";
import { FLAG_LOADERS } from "@/lib/config/flag-loaders";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

// Fetched on first sight; the whole 3x2 set is about 150KB gzipped.
const flagSvgs = new Map<string, string>();

async function loadFlag(code: string): Promise<string | null> {
  const cached = flagSvgs.get(code);
  if (cached) return cached;
  const load = Object.hasOwn(FLAG_LOADERS, code) ? FLAG_LOADERS[code] : null;
  if (!load) return null;
  const mod = await load();
  flagSvgs.set(code, mod.default);
  return mod.default;
}

export function CountryFlag(props: { country: string; className?: string }) {
  const code = countryCode(props.country);
  const flagState = useState<{ code: string; svg: string } | null>(null);
  const flag = flagState[0];
  const setFlag = flagState[1];
  useEffect(() => {
    if (!code) return;
    let alive = true;
    void loadFlag(code)
      .then((svg) => {
        if (alive && svg) setFlag({ code, svg });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [code, setFlag]);

  if (!code) return null;
  return (
    <span
      role="img"
      aria-label={props.country}
      title={props.country}
      className={cn(
        "bg-muted inline-block h-2.5 w-[15px] shrink-0 rounded-[2px] bg-cover bg-center",
        props.className,
      )}
      style={
        flag?.code === code
          ? {
              backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(flag.svg)}")`,
            }
          : undefined
      }
    />
  );
}
