"use client";

import { CountryFlag } from "@/components/elements/flag/country-flag";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Image from "next/image";

function initials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  const letters =
    words.length > 1
      ? `${words[0][0]}${words[words.length - 1][0]}`
      : name.slice(0, 2);
  return letters.toUpperCase();
}

export function ParticipantAvatar(props: {
  name: string;
  imageUrl?: string | null;
  country?: string | null;
  photo?: boolean;
  size?: "sm" | "default";
  className?: string;
}) {
  const px = props.size === "default" ? 32 : 24;
  return (
    <span className={cn("relative inline-flex shrink-0", props.className)}>
      <Avatar size={props.size ?? "sm"}>
        {props.imageUrl && (
          <AvatarImage
            keepMounted
            src={props.imageUrl}
            alt={props.name}
            className={cn(
              "absolute inset-0 data-[error]:hidden data-[loading]:opacity-0",
              props.photo ? "object-cover object-top" : "object-contain",
            )}
            render={
              <Image
                src={props.imageUrl}
                alt={props.name}
                width={px}
                height={px}
              />
            }
          />
        )}
        <AvatarFallback className="bg-primary/15 text-primary text-[9px] font-semibold">
          {initials(props.name)}
        </AvatarFallback>
      </Avatar>
      {props.country && (
        <CountryFlag
          country={props.country}
          className="ring-background absolute -right-1 -bottom-0.5 h-2 w-3 ring-1"
        />
      )}
    </span>
  );
}
