import { describe, it, expect } from "vitest";
import {
  resolveApplicableRules,
  evaluateRule,
  evaluateFormula,
  calculateComplianceSummary,
  getIngredientComplianceStatus,
} from "@/lib/compliance";
import { RuleType, Severity } from "@/types";

describe("ComplianceEngine & RuleResolver", () => {
  const mockRules = [
    {
      id: "rule-1",
      ingredientId: "ing-lilial",
      productCategory: null,
      applicationArea: null,
      market: null,
      standard: "IFRA 51",
      ruleType: "PROHIBITED" as RuleType,
      limitValue: 0,
      unit: "%",
      severity: "VIOLATION" as Severity,
      warnAtPercentage: null,
      message: "Banned substance.",
      isDemo: true,
      sourceId: "src-1",
      sourceVersion: "1.0",
      effectiveFrom: null,
      effectiveTo: null,
      status: "ACTIVE",
    },
    {
      id: "rule-2",
      ingredientId: "ing-damascenone",
      productCategory: "EAU_DE_PARFUM",
      applicationArea: null,
      market: null,
      standard: "IFRA 51",
      ruleType: "MAX_CONCENTRATION" as RuleType,
      limitValue: 0.05,
      unit: "%",
      severity: "VIOLATION" as Severity,
      warnAtPercentage: 75,
      message: "Max 0.05% in EDP.",
      isDemo: true,
      sourceId: "src-1",
      sourceVersion: "1.0",
      effectiveFrom: null,
      effectiveTo: null,
      status: "ACTIVE",
    },
    {
      id: "rule-3",
      ingredientId: "ing-oakmoss",
      productCategory: null,
      applicationArea: null,
      market: null,
      standard: "IFRA 51",
      ruleType: "REQUIRES_REVIEW" as RuleType,
      limitValue: 0.1,
      unit: "%",
      severity: "REVIEW_REQUIRED" as Severity,
      warnAtPercentage: null,
      message: "Certificate required.",
      isDemo: true,
      sourceId: "src-1",
      sourceVersion: "1.0",
      effectiveFrom: null,
      effectiveTo: null,
      status: "ACTIVE",
    },
  ];

  it("resolves applicable rules based on ingredient and product category", () => {
    // Damascenone in EDP should match rule-2
    const edpRules = resolveApplicableRules(
      "ing-damascenone",
      { productCategory: "EAU_DE_PARFUM" },
      mockRules
    );
    expect(edpRules).toHaveLength(1);
    expect(edpRules[0].id).toBe("rule-2");

    // Damascenone in CANDLE should not match rule-2 (rule-2 specifies EAU_DE_PARFUM)
    const candleRules = resolveApplicableRules(
      "ing-damascenone",
      { productCategory: "CANDLE" },
      mockRules
    );
    expect(candleRules).toHaveLength(0);
  });

  it("identifies PROHIBITED ingredient as VIOLATION when quantity > 0", () => {
    const finding = evaluateRule(1.2, mockRules[0], "Lilial");
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("VIOLATION");
    expect(finding?.currentValue).toBe(1.2);
  });

  it("identifies MAX_CONCENTRATION violation when limit is exceeded", () => {
    // Limit is 0.05%, current is 0.08% => VIOLATION
    const finding = evaluateRule(0.08, mockRules[1], "Damascenone");
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("VIOLATION");
  });

  it("triggers WARNING when value enters warning threshold", () => {
    // Limit is 0.05%, warnAt 75% = 0.0375%. Current is 0.04% => WARNING
    const finding = evaluateRule(0.04, mockRules[1], "Damascenone");
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("WARNING");
  });

  it("passes compliance when value is below threshold", () => {
    // Current is 0.02% (below 0.0375%) => PASS
    const finding = evaluateRule(0.02, mockRules[1], "Damascenone");
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("PASS");
  });

  it("identifies REQUIRES_REVIEW rule properly", () => {
    const finding = evaluateRule(0.15, mockRules[2], "Oakmoss");
    expect(finding).not.toBeNull();
    expect(finding?.severity).toBe("REVIEW_REQUIRED");
  });

  it("evaluates a complete formula and produces summary counts", () => {
    const ingredients = [
      { ingredientId: "ing-damascenone", ingredientName: "Damascenone", quantity: 0.8, materialType: "AROMA_CHEMICAL", unit: "g" }, // 0.08% of 1000g -> VIOLATION
      { ingredientId: "ing-oakmoss", ingredientName: "Oakmoss", quantity: 1.0, materialType: "EXTRACT", unit: "g" }, // 0.1% -> REVIEW_REQUIRED
      { ingredientId: "ing-alcohol", ingredientName: "Ethanol", quantity: 998.2, materialType: "SOLVENT", unit: "g" },
    ];

    const findings = evaluateFormula(ingredients, mockRules, { productCategory: "EAU_DE_PARFUM" });
    expect(findings.length).toBeGreaterThan(0);

    const summary = calculateComplianceSummary(findings);
    expect(summary.violations).toBe(1);
    expect(summary.reviewRequired).toBe(1);
    expect(summary.overall).toBe("VIOLATION");
  });

  it("determines overall ingredient compliance status accurately", () => {
    const findings: any[] = [
      { ingredientId: "ing-1", severity: "PASS" },
      { ingredientId: "ing-2", severity: "WARNING" },
      { ingredientId: "ing-3", severity: "VIOLATION" },
    ];

    expect(getIngredientComplianceStatus("ing-1", findings)).toBe("PASS");
    expect(getIngredientComplianceStatus("ing-2", findings)).toBe("WARNING");
    expect(getIngredientComplianceStatus("ing-3", findings)).toBe("VIOLATION");
  });

  it("evaluates formulas with multi-market target arrays", () => {
    const marketRules = [
      {
        id: "rule-eu",
        ingredientId: "ing-1",
        productCategory: null,
        applicationArea: null,
        market: "European Union",
        standard: "EU Reg",
        ruleType: "MAX_CONCENTRATION" as RuleType,
        limitValue: 0.5,
        unit: "%",
        severity: "VIOLATION" as Severity,
        warnAtPercentage: null,
        message: "EU Max 0.5%",
        isDemo: true,
        sourceId: null,
        sourceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        status: "ACTIVE",
      },
      {
        id: "rule-us",
        ingredientId: "ing-1",
        productCategory: null,
        applicationArea: null,
        market: "United States",
        standard: "FDA Reg",
        ruleType: "MAX_CONCENTRATION" as RuleType,
        limitValue: 1.0,
        unit: "%",
        severity: "VIOLATION" as Severity,
        warnAtPercentage: null,
        message: "US Max 1.0%",
        isDemo: true,
        sourceId: null,
        sourceVersion: null,
        effectiveFrom: null,
        effectiveTo: null,
        status: "ACTIVE",
      },
    ];

    // When targeting EU and US
    const resolved = resolveApplicableRules(
      "ing-1",
      { markets: ["European Union", "United States"] },
      marketRules
    );
    expect(resolved).toHaveLength(2);

    // When targeting only US
    const resolvedUS = resolveApplicableRules(
      "ing-1",
      { markets: ["United States"] },
      marketRules
    );
    expect(resolvedUS).toHaveLength(1);
    expect(resolvedUS[0].id).toBe("rule-us");
  });
});
