import type { TenantUserRole } from "@/lib/database.types";

export const TENANT_USER_ROLE = {
  ADMIN: "admin",
  OWNER: "owner",
  MEMBER: "member",
} as const satisfies Record<string, TenantUserRole>;

// Roles you can hand out from the team-management UI. Platform admin is
// granted separately via SQL / `platform_admins` (see migration 0011).
export const INVITABLE_ROLES = ["owner", "member"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

// owner + admin both get manage permissions inside their tenant. Used by
// the team page, branding form, and any future tenant-settings UI.
export function isManager(role: TenantUserRole | null | undefined): boolean {
  return role === TENANT_USER_ROLE.OWNER || role === TENANT_USER_ROLE.ADMIN;
}

export function roleLabel(role: TenantUserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "owner":
      return "Ägare";
    case "member":
      return "Medlem";
  }
}
