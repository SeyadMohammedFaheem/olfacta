import { Role } from "@/types";

// ─── Permission Definitions ─────────────────────────────────────────

type Action =
  | "formula:create"
  | "formula:edit"
  | "formula:delete"
  | "formula:view"
  | "formula:submit"
  | "formula:approve"
  | "formula:reject"
  | "formula:archive"
  | "ingredient:create"
  | "ingredient:edit"
  | "ingredient:delete"
  | "ingredient:view"
  | "batch:create"
  | "batch:edit"
  | "batch:delete"
  | "batch:view"
  | "batch:complete"
  | "batch:cancel"
  | "compliance:view"
  | "compliance:manage"
  | "reports:view"
  | "settings:view"
  | "settings:edit"
  | "users:manage"
  | "audit:view"
  | "supplier:create"
  | "supplier:edit"
  | "supplier:delete"
  | "supplier:view";

const ROLE_PERMISSIONS: Record<Role, Action[]> = {
  ADMIN: [
    "formula:create", "formula:edit", "formula:delete", "formula:view",
    "formula:submit", "formula:approve", "formula:reject", "formula:archive",
    "ingredient:create", "ingredient:edit", "ingredient:delete", "ingredient:view",
    "batch:create", "batch:edit", "batch:delete", "batch:view", "batch:complete", "batch:cancel",
    "compliance:view", "compliance:manage",
    "reports:view",
    "settings:view", "settings:edit",
    "users:manage",
    "audit:view",
    "supplier:create", "supplier:edit", "supplier:delete", "supplier:view",
  ],
  CONTRIBUTOR: [
    "formula:create", "formula:edit", "formula:view", "formula:submit", "formula:archive",
    "ingredient:create", "ingredient:edit", "ingredient:view",
    "batch:create", "batch:view",
    "compliance:view",
    "reports:view",
    "supplier:create", "supplier:edit", "supplier:view",
  ],
  PERFUMER: [
    "formula:create", "formula:edit", "formula:view", "formula:submit", "formula:archive",
    "ingredient:create", "ingredient:edit", "ingredient:view",
    "batch:create", "batch:view",
    "compliance:view",
    "reports:view",
    "supplier:create", "supplier:edit", "supplier:view",
  ],
  PRODUCTION: [
    "formula:view",
    "ingredient:view",
    "batch:create", "batch:edit", "batch:view", "batch:complete", "batch:cancel",
    "compliance:view",
    "reports:view",
    "supplier:view",
  ],
  COMPLIANCE: [
    "formula:view", "formula:approve", "formula:reject",
    "ingredient:view",
    "batch:view",
    "compliance:view", "compliance:manage",
    "reports:view",
    "audit:view",
    "supplier:view",
  ],
  VIEWER: [
    "formula:view",
    "ingredient:view",
    "batch:view",
    "compliance:view",
    "reports:view",
    "supplier:view",
  ],
};

export function hasPermission(role: Role, action: Action): boolean {
  return ROLE_PERMISSIONS[role]?.includes(action) ?? false;
}

export function checkPermission(role: Role, action: Action): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Insufficient permissions: Action "${action}" is restricted to Main Admin.`);
  }
}

export function getPermittedActions(role: Role): Action[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export type { Action };
