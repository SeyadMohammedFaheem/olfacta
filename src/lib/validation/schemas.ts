import { z } from "zod";

// ─── Auth Schemas ───────────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  organizationName: z.string().min(2, "Organization name must be at least 2 characters"),
});

// ─── Formula Schemas ────────────────────────────────────────────────

export const createFormulaSchema = z.object({
  name: z.string().min(1, "Formula name is required").max(200),
  description: z.string().max(1000).optional(),
  productType: z.enum([
    "EAU_DE_PARFUM", "EAU_DE_TOILETTE", "EAU_DE_COLOGNE",
    "PARFUM", "BODY_MIST", "ROOM_SPRAY", "CANDLE", "SOAP", "LOTION", "OTHER",
  ]),
  applicationCategory: z.string().max(100).optional(),
  market: z.string().max(100).optional(),
  targetWeight: z.number().positive("Target weight must be positive"),
  weightUnit: z.string().default("g"),
  concentration: z.number().min(0).max(100, "Concentration must be between 0 and 100"),
});

export const updateFormulaSchema = createFormulaSchema.partial();

// ─── Ingredient Schemas ─────────────────────────────────────────────

export const createIngredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required").max(200),
  casNumber: z.string().max(50).optional().nullable(),
  inciName: z.string().max(200).optional().nullable(),
  materialType: z.enum([
    "FRAGRANCE", "ESSENTIAL_OIL", "AROMA_CHEMICAL",
    "EXTRACT", "SOLVENT", "BASE", "OTHER",
  ]),
  description: z.string().max(1000).optional().nullable(),
  density: z.number().positive().optional().nullable(),
  dilutionPercentage: z.number().min(0.001).max(100).default(100).optional().nullable(),
  diluentSolvent: z.string().max(100).default("None (Pure)").optional().nullable(),
  compositionBreakdown: z.string().optional().nullable(),
  costPerUnit: z.number().min(0).optional().nullable(),
  costCurrency: z.string().max(3).default("USD"),
  costUnit: z.string().max(10).default("g"),
  supplierId: z.string().optional().nullable(),
});

export const updateIngredientSchema = createIngredientSchema.partial();

// ─── Formula Ingredient Schemas ─────────────────────────────────────

export const addIngredientToFormulaSchema = z.object({
  ingredientId: z.string().min(1, "Ingredient ID is required"),
  quantity: z.number().min(0, "Quantity cannot be negative"),
  unit: z.string().default("g"),
});

export const updateIngredientQuantitySchema = z.object({
  formulaIngredientId: z.string().min(1),
  quantity: z.number().min(0, "Quantity cannot be negative"),
});

// ─── Batch Schemas ──────────────────────────────────────────────────

export const createBatchSchema = z.object({
  formulaId: z.string().min(1, "Formula is required"),
  formulaVersionId: z.string().min(1, "Formula version is required"),
  targetQuantity: z.number().positive("Target quantity must be positive"),
  unit: z.string().default("g"),
  notes: z.string().max(1000).optional(),
});

export const updateBatchIngredientSchema = z.object({
  batchIngredientId: z.string().min(1),
  actualQuantity: z.number().min(0, "Actual quantity cannot be negative"),
});

// ─── Supplier Schemas ───────────────────────────────────────────────

export const createSupplierSchema = z.object({
  name: z.string().min(1, "Supplier name is required").max(200),
  contactName: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  website: z.string().url().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

// ─── Regulatory Rule Schemas ────────────────────────────────────────

export const createRuleSchema = z.object({
  ingredientId: z.string().optional().nullable(),
  productCategory: z.string().optional().nullable(),
  applicationArea: z.string().optional().nullable(),
  market: z.string().optional().nullable(),
  standard: z.string().optional().nullable(),
  ruleType: z.enum([
    "MAX_CONCENTRATION", "MIN_CONCENTRATION",
    "PRESENCE_RESTRICTION", "PROHIBITED", "REQUIRES_REVIEW",
  ]),
  limitValue: z.number().optional().nullable(),
  unit: z.string().default("%"),
  severity: z.enum(["PASS", "WARNING", "VIOLATION", "REVIEW_REQUIRED"]),
  warnAtPercentage: z.number().min(0).max(100).optional().nullable(),
  message: z.string().max(500).optional().nullable(),
  isDemo: z.boolean().default(false),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type CreateFormulaInput = z.infer<typeof createFormulaSchema>;
export type CreateIngredientInput = z.infer<typeof createIngredientSchema>;
export type CreateBatchInput = z.infer<typeof createBatchSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;
