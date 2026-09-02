// ─── Domain Types ───────────────────────────────────────────────────

export type {
  User,
  Organization,
  OrganizationMember,
  Formula,
  FormulaVersion,
  FormulaIngredient,
  Ingredient,
  Supplier,
  IngredientSupplier,
  RegulatoryRule,
  RegulatoryProfile,
  RegulatorySource,
  ComplianceFinding,
  ComplianceSnapshot,
  Batch,
  BatchIngredient,
  AuditLog,
  Notification,
} from "@prisma/client";

export const Role = {
  ADMIN: "ADMIN",
  PERFUMER: "PERFUMER",
  PRODUCTION: "PRODUCTION",
  COMPLIANCE: "COMPLIANCE",
  VIEWER: "VIEWER",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MaterialType = {
  FRAGRANCE: "FRAGRANCE",
  ESSENTIAL_OIL: "ESSENTIAL_OIL",
  AROMA_CHEMICAL: "AROMA_CHEMICAL",
  EXTRACT: "EXTRACT",
  SOLVENT: "SOLVENT",
  BASE: "BASE",
  OTHER: "OTHER",
} as const;
export type MaterialType = (typeof MaterialType)[keyof typeof MaterialType];

export const IngredientStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  ARCHIVED: "ARCHIVED",
} as const;
export type IngredientStatus = (typeof IngredientStatus)[keyof typeof IngredientStatus];

export const ProductType = {
  EAU_DE_PARFUM: "EAU_DE_PARFUM",
  EAU_DE_TOILETTE: "EAU_DE_TOILETTE",
  EAU_DE_COLOGNE: "EAU_DE_COLOGNE",
  PARFUM: "PARFUM",
  BODY_MIST: "BODY_MIST",
  ROOM_SPRAY: "ROOM_SPRAY",
  CANDLE: "CANDLE",
  SOAP: "SOAP",
  LOTION: "LOTION",
  OTHER: "OTHER",
} as const;
export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const FormulaStatus = {
  DRAFT: "DRAFT",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  ARCHIVED: "ARCHIVED",
} as const;
export type FormulaStatus = (typeof FormulaStatus)[keyof typeof FormulaStatus];

export const RuleType = {
  MAX_CONCENTRATION: "MAX_CONCENTRATION",
  MIN_CONCENTRATION: "MIN_CONCENTRATION",
  PRESENCE_RESTRICTION: "PRESENCE_RESTRICTION",
  PROHIBITED: "PROHIBITED",
  REQUIRES_REVIEW: "REQUIRES_REVIEW",
} as const;
export type RuleType = (typeof RuleType)[keyof typeof RuleType];

export const Severity = {
  PASS: "PASS",
  WARNING: "WARNING",
  VIOLATION: "VIOLATION",
  REVIEW_REQUIRED: "REVIEW_REQUIRED",
} as const;
export type Severity = (typeof Severity)[keyof typeof Severity];

export const BatchStatus = {
  PLANNED: "PLANNED",
  IN_PRODUCTION: "IN_PRODUCTION",
  QC: "QC",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];

// ─── Session ────────────────────────────────────────────────────────

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  organizationId: string;
  organizationName: string;
  role: Role;
}

export interface Session {
  user: SessionUser;
  expires: string;
}

// ─── API Response ───────────────────────────────────────────────────

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// ─── Formula Calculation ────────────────────────────────────────────

export interface CalculatedIngredient {
  id: string;
  ingredientId: string;
  name: string;
  materialType: string;
  quantity: number;
  unit: string;
  percentage: number;
  compliance: ComplianceStatus;
  costPerUnit?: number | null;
  cost?: number;
  sortOrder: number;
}

export type ComplianceStatus = "PASS" | "WARNING" | "VIOLATION" | "REVIEW_REQUIRED";

export interface FormulaTotals {
  totalWeight: number;
  totalPercentage: number;
  ingredientCount: number;
  isBalanced: boolean;
  overallCompliance: ComplianceStatus;
}

export interface ComplianceSummary {
  passed: number;
  warnings: number;
  violations: number;
  reviewRequired: number;
  overall: ComplianceStatus;
}

// ─── Compliance Finding (runtime) ───────────────────────────────────

export interface ComplianceFindingResult {
  ingredientId: string;
  ingredientName: string;
  ruleId: string;
  ruleType: string;
  severity: ComplianceStatus;
  currentValue: number;
  limitValue: number | null;
  unit: string;
  message: string;
  source: string | null;
  sourceVersion: string | null;
  market?: string | null;
  standard?: string | null;
  isDemo: boolean;
}

// ─── Batch Calculation ──────────────────────────────────────────────

export interface BatchScaledIngredient {
  ingredientId: string;
  name: string;
  formulaQuantity: number;
  percentage: number;
  targetQuantity: number;
  actualQuantity: number | null;
  difference: number | null;
  unit: string;
}

// ─── Dashboard Stats ────────────────────────────────────────────────

export interface DashboardStats {
  totalFormulas: number;
  drafts: number;
  inReview: number;
  approved: number;
  activeBatches: number;
  violations: number;
  warnings: number;
  reviewRequired: number;
}
