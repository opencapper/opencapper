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

export type ParticipantSize = "xs" | "sm" | "default";

const PX: Record<ParticipantSize, number> = { xs: 18, sm: 24, default: 32 };

export function ParticipantAvatar(props: {
  name: string;
  imageUrl?: string | null;
  country?: string | null;
  photo?: boolean;
  size?: ParticipantSize;
  className?: string;
}) {
  const px = PX[props.size ?? "sm"];
  return (
    <span className={cn("relative inline-flex shrink-0", props.className)}>
      <Avatar
        size={props.size === "default" ? "default" : "sm"}
        className={props.size === "xs" ? "data-[size=sm]:size-[18px]" : undefined}
      >
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
                unoptimized
              />
            }
          />
        )}
        <AvatarFallback
          className={cn(
            "bg-primary/15 text-primary font-semibold",
            props.size === "xs" ? "text-[7px]" : "text-[9px]",
          )}
        >
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
