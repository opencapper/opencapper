import { msg } from "@/lib/config/constants";
import type { AuthRole } from "@/lib/config/permissions";

export const ROLE_LABELS = {
  user: msg("ADMIN.ROLES.USER"),
  moderator: msg("ADMIN.ROLES.MODERATOR"),
  admin: msg("ADMIN.ROLES.ADMIN"),
} satisfies Record<AuthRole, string>;
