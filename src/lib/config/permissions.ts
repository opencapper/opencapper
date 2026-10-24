import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements } from "better-auth/plugins/admin/access";
import { t } from "elysia";

// `user` and `session` keep the admin plugin's names: its endpoints check exactly those.
export const statements = {
  ...defaultStatements,
  picks: ["list"],
  imports: ["list"],
  profiles: ["hide"],
  claims: ["approve", "revoke"],
  system: ["view"],
} as const;

export const ac = createAccessControl(statements);

export const roles = {
  user: ac.newRole({ user: [], session: [] }),
  moderator: ac.newRole({
    user: ["list", "get", "ban"],
    session: ["list"],
    picks: ["list"],
    imports: ["list"],
    profiles: ["hide"],
    system: ["view"],
  }),
  // No impersonate, create, delete or credential rights: identities come from OAuth only.
  admin: ac.newRole({
    user: ["list", "get", "set-role", "ban"],
    session: ["list", "revoke"],
    picks: ["list"],
    imports: ["list"],
    profiles: ["hide"],
    claims: ["approve", "revoke"],
    system: ["view"],
  }),
};

export const AuthRole = t.Union([
  t.Literal("user"),
  t.Literal("moderator"),
  t.Literal("admin"),
]);
export type AuthRole = typeof AuthRole.static;

export const AUTH_ROLES = AuthRole.anyOf.map((l) => l.const);

export type Permissions = {
  [K in keyof typeof statements]?: (typeof statements)[K][number][];
};

export function isAuthRole(value: unknown): value is AuthRole {
  return AUTH_ROLES.some((role) => role === value);
}

export function isStaff(role: AuthRole | null | undefined): boolean {
  return role === "moderator" || role === "admin";
}

export function can(role: AuthRole, permissions: Permissions): boolean {
  return roles[role].authorize(permissions).success;
}
