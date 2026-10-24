"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function hue(seed: string, salt: number) {
  let hash = salt;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

// Stable per username so a capper without a picture keeps the same gradient everywhere.
function gradient(username: string) {
  const from = hue(username, 7);
  const to = (from + 50 + (hue(username, 13) % 80)) % 360;
  return `linear-gradient(135deg, oklch(0.78 0.13 ${from}), oklch(0.5 0.16 ${to}))`;
}

export function CapperAvatar(props: {
  username: string;
  imageUrl: string | null | undefined;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={props.size} className={props.className}>
      {props.imageUrl && (
        <AvatarImage
          src={props.imageUrl}
          alt={props.username}
          referrerPolicy="no-referrer"
        />
      )}
      <AvatarFallback style={{ backgroundImage: gradient(props.username) }} />
    </Avatar>
  );
}
