import { authUser, users } from "@/lib/db/schema/server";
import { DISCORD_CDN_BASE } from "@/server/constants";

export const avatarColumns = {
  discordId: users.discordId,
  avatar: users.avatar,
  imageUrl: users.imageUrl,
  authImage: authUser.image,
};

export type AvatarSource = {
  discordId: string | null;
  avatar: string | null;
  imageUrl: string | null;
  authImage: string | null;
};

// Google and Telegram pictures live on the Better Auth user, so callers left join `authUser`.
export function avatarUrl(source: AvatarSource, size: number): string | null {
  if (source.discordId && source.avatar)
    return `${DISCORD_CDN_BASE}/avatars/${source.discordId}/${source.avatar}.png?size=${size}`;
  return source.imageUrl ?? source.authImage;
}
