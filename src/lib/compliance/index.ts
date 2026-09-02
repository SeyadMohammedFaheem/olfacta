import { RuleType, Severity } from "@/types";
import { calculatePercentage, calculateTotalWeight } from "@/lib/calculations";
import type { ComplianceFindingResult, ComplianceStatus, ComplianceSummary } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────

export interface FormulaContext {
  productCategory?: string;
  applicationArea?: string;
  market?: string;
  markets?: string[];
}

export interface ApplicationUsageOption {
  id: string;
  label: string;
  description: string;
  mappedCategory: string;
  defaultProductType: string;
}

export const APPLICATION_USAGE_OPTIONS: ApplicationUsageOption[] = [
  {
    id: "fine-fragrance",
    label: "Fine fragrance / applied to skin",
    description: "Hydroalcoholic perfumes, extraits, colognes applied directly to pulse points and skin.",
    mappedCategory: "Fine Fragrance",
    defaultProductType: "EAU_DE_PARFUM",
  },
  {
    id: "body-spray",
    label: "Body spray / mist",
    description: "All-over light body mists and refreshing daily sprays.",
    mappedCategory: "Personal Care",
    defaultProductType: "BODY_MIST",
  },
  {
    id: "hair-fragrance",
    label: "Hair fragrance",
    description: "Alcohol-free or protective delicate fragrance mist for hair.",
    mappedCategory: "Cosmetics",
    defaultProductType: "OTHER",
  },
  {
    id: "leave-on",
    label: "Leave-on product",
    description: "Perfumed creams, lotions, and body oils that remain on the skin.",
    mappedCategory: "Personal Care",
    defaultProductType: "LOTION",
  },
  {
    id: "wash-off",
    label: "Wash-off product",
    description: "Shampoos, body washes, and rinse-off soaps.",
    mappedCategory: "Personal Care",
    defaultProductType: "SOAP",
  },
  {
    id: "other",
    label: "Other application",
    description: "Candles, room diffusers, textiles, or specialized formulations.",
    mappedCategory: "Home Care",
    defaultProductType: "OTHER",
  },
];

interface FormulaIngredientInput {
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  materialType: string;
  unit: string;
}

interface RuleInput {
  id: string;
  ingredientId: string | null;
  productCategory: string | null;
  applicationArea: string | null;
  market: string | null;
  standard: string | null;
  ruleType: RuleType;
  limitValue: number | null;
  unit: string | null;
  severity: Severity;
  warnAtPercentage: number | null;
  message: string | null;
  isDemo: boolean;
  sourceId: string | null;
  sourceVersion: string | null;
  effectiveFrom: Date | null;
  effectiveTo: Date | null;
  status: string;
}

// ─── Rule Resolver ──────────────────────────────────────────────────

/**
 * Normalizes markets list from context.
 */
export function normalizeMarkets(context: FormulaContext): string[] {
  if (context.markets && context.markets.length > 0) {
    return context.markets;
  }
  if (context.market) {
    return context.market.split(",").map((m) => m.trim()).filter(Boolean);
  }
  return ["General"];
}

/**
 * Finds all applicable rules for a given ingredient within a formula context.
 * Supports multi-market resolution.
 */
export function resolveApplicableRules(
  ingredientId: string,
  context: FormulaContext,
  allRules: RuleInput[],
  evaluationDate: Date = new Date()
): RuleInput[] {
  const targetMarkets = normalizeMarkets(context).map((m) => m.toLowerCase());

  return allRules.filter((rule) => {
    // Must match ingredient (or be a global rule)
    if (rule.ingredientId !== null && rule.ingredientId !== ingredientId) {
      return false;
    }

    // Must match product category (or be universal)
    if (rule.productCategory !== null && rule.productCategory !== context.productCategory) {
      return false;
    }

    // Must match application area (or be universal)
    if (rule.applicationArea !== null && rule.applicationArea !== context.applicationArea) {
      return false;
    }

    // Must match market (or be universal / global)
    if (rule.market !== null) {
      const ruleMarket = rule.market.toLowerCase();
      const isUniversal = ruleMarket === "global" || ruleMarket === "general" || ruleMarket === "all";
      const matchesTarget = targetMarkets.some(
        (tm) => tm === ruleMarket || tm.includes(ruleMarket) || ruleMarket.includes(tm)
      );
      if (!isUniversal && !matchesTarget) {
        return false;
      }
    }

    // Must be active
    if (rule.status !== "ACTIVE") return false;

    // Must be within effective date range
    if (rule.effectiveFrom && evaluationDate < new Date(rule.effectiveFrom)) {
      return false;
    }
    if (rule.effectiveTo && evaluationDate > new Date(rule.effectiveTo)) {
      return false;
    }

    return true;
  });
}

// ─── Compliance Evaluator ───────────────────────────────────────────

/**
 * Evaluates a single ingredient against a single rule.
 */
export function evaluateRule(
  ingredientPercentage: number,
  rule: RuleInput,
  ingredientName: string
): ComplianceFindingResult | null {
  const ruleId = rule.id;
  const base = {
    ingredientId: rule.ingredientId || "",
    ingredientName,
    ruleId,
    ruleType: rule.ruleType,
    unit: rule.unit || "%",
    source: rule.sourceId,
    sourceVersion: rule.sourceVersion,
    market: rule.market || rule.standard || "General",
    standard: rule.standard || "General",
    isDemo: rule.isDemo,
  };

  switch (rule.ruleType) {
    case "PROHIBITED":
      if (ingredientPercentage > 0) {
        return {
          ...base,
          severity: "VIOLATION",
          currentValue: ingredientPercentage,
          limitValue: 0,
          message: rule.message || `${ingredientName} is prohibited in this context.`,
        };
      }
      return {
        ...base,
        severity: "PASS",
        currentValue: ingredientPercentage,
        limitValue: 0,
        message: `${ingredientName} is not present.`,
      };

    case "MAX_CONCENTRATION": {
      if (rule.limitValue === null) return null;
      const limit = rule.limitValue;
      
      if (ingredientPercentage > limit) {
        return {
          ...base,
          severity: "VIOLATION",
          currentValue: ingredientPercentage,
          limitValue: limit,
          message: rule.message || `${ingredientName} exceeds the configured limit of ${limit}% (current: ${ingredientPercentage}%).`,
        };
      }

      // Check warning threshold
      const warnAt = rule.warnAtPercentage ?? 80;
      const warnThreshold = (limit * warnAt) / 100;
      if (ingredientPercentage >= warnThreshold) {
        return {
          ...base,
          severity: "WARNING",
          currentValue: ingredientPercentage,
          limitValue: limit,
          message: `${ingredientName} is at ${ingredientPercentage}%, approaching the limit of ${limit}%.`,
        };
      }

      return {
        ...base,
        severity: "PASS",
        currentValue: ingredientPercentage,
        limitValue: limit,
        message: `${ingredientName} is within the configured limit.`,
      };
    }

    case "MIN_CONCENTRATION": {
      if (rule.limitValue === null) return null;
      const minLimit = rule.limitValue;
      
      if (ingredientPercentage < minLimit) {
        return {
          ...base,
          severity: "WARNING",
          currentValue: ingredientPercentage,
          limitValue: minLimit,
          message: rule.message || `${ingredientName} is below the minimum of ${minLimit}% (current: ${ingredientPercentage}%).`,
        };
      }

      return {
        ...base,
        severity: "PASS",
        currentValue: ingredientPercentage,
        limitValue: minLimit,
        message: `${ingredientName} meets the minimum concentration.`,
      };
    }

    case "PRESENCE_RESTRICTION":
      if (ingredientPercentage > 0) {
        return {
          ...base,
          severity: "WARNING",
          currentValue: ingredientPercentage,
          limitValue: null,
          message: rule.message || `${ingredientName} has a presence restriction in this context.`,
        };
      }
      return null;

    case "REQUIRES_REVIEW":
      if (ingredientPercentage > 0) {
        return {
          ...base,
          severity: "REVIEW_REQUIRED",
          currentValue: ingredientPercentage,
          limitValue: rule.limitValue,
          message: rule.message || `${ingredientName} requires review for this product context.`,
        };
      }
      return null;

    default:
      return null;
  }
}

// ─── Compliance Engine ──────────────────────────────────────────────

/**
 * Evaluate an entire formula against all applicable rules.
 * Returns all compliance findings.
 */
export function evaluateFormula(
  ingredients: FormulaIngredientInput[],
  rules: RuleInput[],
  context: FormulaContext
): ComplianceFindingResult[] {
  const totalWeight = calculateTotalWeight(ingredients.map((i) => i.quantity));
  const findings: ComplianceFindingResult[] = [];

  for (const ingredient of ingredients) {
    const percentage = calculatePercentage(ingredient.quantity, totalWeight);
    const applicableRules = resolveApplicableRules(
      ingredient.ingredientId,
      context,
      rules
    );

    for (const rule of applicableRules) {
      const finding = evaluateRule(percentage, rule, ingredient.ingredientName);
      if (finding) {
        finding.ingredientId = ingredient.ingredientId;
        findings.push(finding);
      }
    }
  }

  return findings;
}

/**
 * Calculate compliance summary from findings.
 */
export function calculateComplianceSummary(
  findings: ComplianceFindingResult[]
): ComplianceSummary {
  const passed = findings.filter((f) => f.severity === "PASS").length;
  const warnings = findings.filter((f) => f.severity === "WARNING").length;
  const violations = findings.filter((f) => f.severity === "VIOLATION").length;
  const reviewRequired = findings.filter((f) => f.severity === "REVIEW_REQUIRED").length;

  let overall: ComplianceStatus = "PASS";
  if (reviewRequired > 0) overall = "REVIEW_REQUIRED";
  if (warnings > 0) overall = "WARNING";
  if (violations > 0) overall = "VIOLATION";

  return { passed, warnings, violations, reviewRequired, overall };
}

/**
 * Determine overall compliance status for an ingredient.
 */
export function getIngredientComplianceStatus(
  ingredientId: string,
  findings: ComplianceFindingResult[]
): ComplianceStatus {
  const ingredientFindings = findings.filter(
    (f) => f.ingredientId === ingredientId
  );

  if (ingredientFindings.some((f) => f.severity === "VIOLATION")) return "VIOLATION";
  if (ingredientFindings.some((f) => f.severity === "REVIEW_REQUIRED")) return "REVIEW_REQUIRED";
  if (ingredientFindings.some((f) => f.severity === "WARNING")) return "WARNING";
  return "PASS";
}
