import { describe, it, expect } from "vitest";
import { hasPermission, checkPermission } from "@/lib/permissions";
import { Role } from "@/types";

describe("Role-based Permissions Matrix", () => {
  it("ADMIN has full permissions across all actions", () => {
    expect(hasPermission(Role.ADMIN, "formula:create")).toBe(true);
    expect(hasPermission(Role.ADMIN, "formula:approve")).toBe(true);
    expect(hasPermission(Role.ADMIN, "compliance:manage")).toBe(true);
    expect(hasPermission(Role.ADMIN, "users:manage")).toBe(true);
    expect(hasPermission(Role.ADMIN, "batch:complete")).toBe(true);
  });

  it("PERFUMER can formulate but cannot manage regulatory rules or approve formulas", () => {
    expect(hasPermission(Role.PERFUMER, "formula:create")).toBe(true);
    expect(hasPermission(Role.PERFUMER, "formula:edit")).toBe(true);
    expect(hasPermission(Role.PERFUMER, "formula:submit")).toBe(true);

    // Forbidden for PERFUMER
    expect(hasPermission(Role.PERFUMER, "formula:approve")).toBe(false);
    expect(hasPermission(Role.PERFUMER, "compliance:manage")).toBe(false);
    expect(hasPermission(Role.PERFUMER, "users:manage")).toBe(false);
  });

  it("PRODUCTION can manage batches but cannot edit formulas or compliance rules", () => {
    expect(hasPermission(Role.PRODUCTION, "batch:create")).toBe(true);
    expect(hasPermission(Role.PRODUCTION, "batch:edit")).toBe(true);
    expect(hasPermission(Role.PRODUCTION, "batch:complete")).toBe(true);

    // Forbidden for PRODUCTION
    expect(hasPermission(Role.PRODUCTION, "formula:create")).toBe(false);
    expect(hasPermission(Role.PRODUCTION, "formula:approve")).toBe(false);
    expect(hasPermission(Role.PRODUCTION, "compliance:manage")).toBe(false);
  });

  it("COMPLIANCE can approve/reject formulas and manage regulatory rules", () => {
    expect(hasPermission(Role.COMPLIANCE, "formula:approve")).toBe(true);
    expect(hasPermission(Role.COMPLIANCE, "formula:reject")).toBe(true);
    expect(hasPermission(Role.COMPLIANCE, "compliance:manage")).toBe(true);

    // Forbidden for COMPLIANCE
    expect(hasPermission(Role.COMPLIANCE, "formula:create")).toBe(false);
    expect(hasPermission(Role.COMPLIANCE, "batch:create")).toBe(false);
  });

  it("VIEWER has read-only access", () => {
    expect(hasPermission(Role.VIEWER, "formula:view")).toBe(true);
    expect(hasPermission(Role.VIEWER, "ingredient:view")).toBe(true);
    expect(hasPermission(Role.VIEWER, "batch:view")).toBe(true);

    // Forbidden for VIEWER
    expect(hasPermission(Role.VIEWER, "formula:create")).toBe(false);
    expect(hasPermission(Role.VIEWER, "formula:edit")).toBe(false);
    expect(hasPermission(Role.VIEWER, "batch:create")).toBe(false);
    expect(hasPermission(Role.VIEWER, "formula:approve")).toBe(false);
  });

  it("checkPermission throws error when permission is denied", () => {
    expect(() => checkPermission(Role.VIEWER, "formula:create")).toThrowError(
      /Insufficient permissions/
    );
  });
});
