import { describe, it, expect } from "vitest";
import {
  calculatePercentage,
  calculateTotalWeight,
  calculateAllPercentages,
  validateTotalPercentage,
  calculateScaleFactor,
  calculateScaledQuantity,
  calculateBatchDifference,
  scaleFormulaForBatch,
  calculateConcentration,
  calculateQuantityFromPercentage,
  calculateConcentrateTarget,
  calculateBaseWeight,
  calculateDropsConversion,
} from "@/lib/calculations";

describe("FormulaCalculationService", () => {
  it("calculates exact ingredient percentage accurately", () => {
    // 50g in 1000g total = 5.00%
    const pct = calculatePercentage(50, 1000);
    expect(pct).toBe(5);

    // 12.5g in 1000g total = 1.25%
    const pct2 = calculatePercentage(12.5, 1000);
    expect(pct2).toBe(1.25);

    // 0.4g in 1000g = 0.04%
    const pct3 = calculatePercentage(0.4, 1000);
    expect(pct3).toBe(0.04);
  });

  it("handles zero total weight without dividing by zero", () => {
    expect(calculatePercentage(10, 0)).toBe(0);
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  it("calculates total weight with decimal safety", () => {
    // Standard JS float issue: 0.1 + 0.2 = 0.30000000000000004
    const total = calculateTotalWeight([0.1, 0.2, 0.3, 0.4]);
    expect(total).toBe(1.0);

    const weights = [45.5, 15.25, 30.0, 60.75, 848.5];
    expect(calculateTotalWeight(weights)).toBe(1000);
  });

  it("validates 100% formula total with precision tolerance", () => {
    const balanced = [45, 15, 30, 60, 20, 10, 20, 800]; // sum = 1000g
    const res = validateTotalPercentage(balanced);
    expect(res.isBalanced).toBe(true);
    expect(res.totalPercentage).toBe(100);

    // Unbalanced formula
    const unbalanced = [50, 30, 20]; // 100g total, percentages sum to 100% of 100g
    const res2 = validateTotalPercentage(unbalanced);
    expect(res2.isBalanced).toBe(true);

    // Single item
    const single = [500];
    const res3 = validateTotalPercentage(single);
    expect(res3.totalPercentage).toBe(100);
  });

  it("calculates batch scaling factors and scaled quantities accurately", () => {
    // 1000g formula -> 25000g batch = 25x
    const scale = calculateScaleFactor(25000, 1000);
    expect(scale).toBe(25);

    // Scaled ingredient: 45g * 25 = 1125g
    const scaled = calculateScaledQuantity(45, scale);
    expect(scaled).toBe(1125);

    // Decimal scaled ingredient: 0.4g * 25 = 10g
    const scaledDec = calculateScaledQuantity(0.4, scale);
    expect(scaledDec).toBe(10);
  });

  it("calculates batch difference variance correctly", () => {
    const target = 1250;
    const actual = 1248;
    const diff = calculateBatchDifference(actual, target);
    expect(diff.difference).toBe(-2);
    expect(diff.percentageDifference).toBe(-0.16);

    const overTarget = 1255.5;
    const diff2 = calculateBatchDifference(overTarget, target);
    expect(diff2.difference).toBe(5.5);
  });

  it("scales an entire formula array into batch requirements", () => {
    const formulaIngredients = [
      { ingredientId: "1", name: "Bergamot", quantity: 50, materialType: "ESSENTIAL_OIL", unit: "g" },
      { ingredientId: "2", name: "Ethanol", quantity: 950, materialType: "SOLVENT", unit: "g" },
    ];

    const scaled = scaleFormulaForBatch(formulaIngredients, 1000, 10000);
    expect(scaled).toHaveLength(2);
    expect(scaled[0].targetQuantity).toBe(500); // 50 * 10
    expect(scaled[1].targetQuantity).toBe(9500); // 950 * 10
    expect(scaled[0].percentage).toBe(5);
  });

  it("calculates concentrate fragrance concentration ignoring solvents", () => {
    const ingredients = [
      { quantity: 50, materialType: "ESSENTIAL_OIL" },
      { quantity: 150, materialType: "AROMA_CHEMICAL" },
      { quantity: 800, materialType: "SOLVENT" },
    ];

    // 200g fragrance in 1000g = 20.00%
    const conc = calculateConcentration(ingredients, 1000);
    expect(conc).toBe(20);
  });

  it("calculates quantity from desired percentage accurately", () => {
    // 3.5% in 1000g batch = 35.0g
    expect(calculateQuantityFromPercentage(3.5, 1000)).toBe(35);
    // 0.05% in 500g batch = 0.25g
    expect(calculateQuantityFromPercentage(0.05, 500)).toBe(0.25);
  });

  it("calculates concentrate target and base weight split accurately", () => {
    // 1000g batch at 20% concentration = 200g concentrate, 800g base
    const concentrate = calculateConcentrateTarget(1000, 20);
    const base = calculateBaseWeight(1000, concentrate);
    expect(concentrate).toBe(200);
    expect(base).toBe(800);
  });

  it("converts pipette drops to ml and grams with calibrated drops/ml", () => {
    // 500 drops at 20 drops/ml = 25 ml => 25 * 0.95 = 23.75 g
    const res = calculateDropsConversion(500, 20, 0.95);
    expect(res.ml).toBe(25);
    expect(res.grams).toBe(23.75);
  });
});
