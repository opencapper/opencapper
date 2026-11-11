"use client";

import { VendorLogo } from "@/components/elements/vendor/vendor-logo";
import { Icon } from "@/components/ui/icon";
import { bookName } from "@/lib/config/vendor-registry";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export const CHIP =
  "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors disabled:pointer-events-none disabled:opacity-50";

export function chipState(on: boolean): string {
  return on
    ? "border-foreground/40 bg-foreground/10 text-foreground"
    : "text-foreground/55 hover:text-foreground hover:bg-foreground/5";
}

export function BookPicker(props: {
  label: string;
  books: string[];
  selected: string[];
  onChange: (books: string[]) => void;
  leading?: ReactNode;
}) {
  const toggle = (book: string) =>
    props.onChange(props.selected.includes(book) ? props.selected.filter((b) => b !== book) : [...props.selected, book]);
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={props.label}>
      {props.leading}
      {props.books.map((b) => {
        const on = props.selected.includes(b);
        return (
          <button key={b} type="button" aria-pressed={on} onClick={() => toggle(b)} className={cn(CHIP, chipState(on))}>
            <VendorLogo vendorKey={b} size={16} />
            {bookName(b)}
            {on && <Icon name="check" className="size-3" />}
          </button>
        );
      })}
    </div>
  );
}
