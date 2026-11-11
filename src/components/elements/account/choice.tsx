"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReactNode } from "react";

export type Option = { value: string; label: string; icon?: ReactNode };

function OptionLabel(props: { option: Option }) {
  if (!props.option.icon) return props.option.label;
  return (
    <span className="inline-flex items-center gap-2">
      {props.option.icon}
      {props.option.label}
    </span>
  );
}

// A labelled select whose closed state shows the option label, not the raw value.
export function Choice(props: {
  id: string;
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Select
        items={props.options}
        value={props.value}
        onValueChange={(value) => {
          const picked = props.options.find((o) => o.value === value);
          if (picked) props.onChange(picked.value);
        }}
      >
        <SelectTrigger id={props.id} className="w-full">
          <SelectValue>
            {(value: string) => {
              const picked = props.options.find((o) => o.value === value);
              return picked ? <OptionLabel option={picked} /> : value;
            }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {props.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              <OptionLabel option={o} />
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
