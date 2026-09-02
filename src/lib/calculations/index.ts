import Decimal from "decimal.js";

// Configure decimal.js for formulation precision
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

// ─── Core Calculation Functions ─────────────────────────────────────

/**
 * Calculate the percentage of an ingredient in a formula.
 * ingredientPercentage = ingredientWeight / totalFormulaWeight * 100
 */
export function calculatePercentage(
  ingredientWeight: number,
  totalFormulaWeight: number
): number {
  if (totalFormulaWeight <= 0) return 0;
  const result = new Decimal(ingredientWeight)
    .dividedBy(new Decimal(totalFormulaWeight))
    .times(100);
  return result.toDecimalPlaces(4).toNumber();
}

/**
 * Calculate total weight from an array of ingredient quantities.
 */
export function calculateTotalWeight(quantities: number[]): number {
  return quantities
    .reduce((sum, q) => sum.plus(new Decimal(q)), new Decimal(0))
    .toDecimalPlaces(4)
    .toNumber();
}

/**
 * Calculate all ingredient percentages given their quantities.
 * Returns an array of percentages in the same order.
 */
export function calculateAllPercentages(quantities: number[]): number[] {
  const total = calculateTotalWeight(quantities);
  if (total <= 0) return quantities.map(() => 0);
  return quantities.map((q) => calculatePercentage(q, total));
}

/**
 * Validate whether the total percentage equals 100% within tolerance.
 */
export function validateTotalPercentage(
  quantities: number[],
  tolerance: number = 0.01
): { isBalanced: boolean; totalPercentage: number; difference: number } {
  const totalWeight = calculateTotalWeight(quantities);
  const percentages = calculateAllPercentages(quantities);
  const totalPercentage = percentages.reduce(
    (sum, p) => sum.plus(new Decimal(p)),
    new Decimal(0)
  ).toDecimalPlaces(4).toNumber();
  
  const difference = new Decimal(totalPercentage).minus(100).abs().toNumber();
  
  return {
    isBalanced: difference <= tolerance,
    totalPercentage,
    difference,
  };
}

/**
 * Calculate the fragrance concentration in the formula.
 * Only counts FRAGRANCE, ESSENTIAL_OIL, AROMA_CHEMICAL, EXTRACT types.
 */
export function calculateConcentration(
  fragranceIngredients: { quantity: number; materialType: string }[],
  totalWeight: number
): number {
  if (totalWeight <= 0) return 0;
  
  const fragranceTypes = ["FRAGRANCE", "ESSENTIAL_OIL", "AROMA_CHEMICAL", "EXTRACT"];
  const fragranceWeight = fragranceIngredients
    .filter((i) => fragranceTypes.includes(i.materialType))
    .reduce((sum, i) => sum.plus(new Decimal(i.quantity)), new Decimal(0));
  
  return fragranceWeight
    .dividedBy(new Decimal(totalWeight))
    .times(100)
    .toDecimalPlaces(2)
    .toNumber();
}

// ─── Batch Scaling ──────────────────────────────────────────────────

/**
 * Calculate the batch scaling factor.
 * scaleFactor = targetBatchWeight / formulaWeight
 */
export function calculateScaleFactor(
  targetBatchWeight: number,
  formulaWeight: number
): number {
  if (formulaWeight <= 0) return 0;
  return new Decimal(targetBatchWeight)
    .dividedBy(new Decimal(formulaWeight))
    .toDecimalPlaces(6)
    .toNumber();
}

/**
 * Scale an ingredient quantity for a production batch.
 * scaledQuantity = formulaIngredientQuantity * scaleFactor
 */
export function calculateScaledQuantity(
  formulaQuantity: number,
  scaleFactor: number
): number {
  return new Decimal(formulaQuantity)
    .times(new Decimal(scaleFactor))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate batch difference between actual and target.
 */
export function calculateBatchDifference(
  actual: number,
  target: number
): { difference: number; percentageDifference: number } {
  const diff = new Decimal(actual).minus(new Decimal(target));
  const pctDiff = target > 0
    ? diff.dividedBy(new Decimal(target)).times(100).toDecimalPlaces(2).toNumber()
    : 0;
  
  return {
    difference: diff.toDecimalPlaces(2).toNumber(),
    percentageDifference: pctDiff,
  };
}

/**
 * Scale all formula ingredients for a batch.
 */
export function scaleFormulaForBatch(
  ingredients: { ingredientId: string; name: string; quantity: number; materialType: string; unit: string }[],
  formulaWeight: number,
  targetBatchWeight: number
): {
  ingredientId: string;
  name: string;
  formulaQuantity: number;
  percentage: number;
  targetQuantity: number;
  unit: string;
  scaleFactor: number;
}[] {
  const scaleFactor = calculateScaleFactor(targetBatchWeight, formulaWeight);
  const totalWeight = calculateTotalWeight(ingredients.map((i) => i.quantity));

  return ingredients.map((i) => ({
    ingredientId: i.ingredientId,
    name: i.name,
    formulaQuantity: i.quantity,
    percentage: calculatePercentage(i.quantity, totalWeight),
    targetQuantity: calculateScaledQuantity(i.quantity, scaleFactor),
    unit: i.unit,
    scaleFactor,
  }));
}

// ─── Smart Formulation & Concentrate Calculations ──────────────────

/**
 * Calculate quantity in grams from desired percentage and total batch weight.
 * quantity = (percentage / 100) * totalBatchWeight
 */
export function calculateQuantityFromPercentage(
  percentage: number,
  totalBatchWeight: number
): number {
  if (totalBatchWeight <= 0 || percentage <= 0) return 0;
  return new Decimal(percentage)
    .dividedBy(100)
    .times(new Decimal(totalBatchWeight))
    .toDecimalPlaces(4)
    .toNumber();
}

/**
 * Calculate target concentrate weight from batch size and concentration percentage.
 * concentrateTarget = (concentration / 100) * batchSize
 */
export function calculateConcentrateTarget(
  targetBatchWeight: number,
  concentrationPercentage: number
): number {
  if (targetBatchWeight <= 0 || concentrationPercentage <= 0) return 0;
  return new Decimal(concentrationPercentage)
    .dividedBy(100)
    .times(new Decimal(targetBatchWeight))
    .toDecimalPlaces(2)
    .toNumber();
}

/**
 * Calculate base/solvent weight from target batch weight and concentrate weight.
 * baseWeight = targetBatchWeight - concentrateWeight
 */
export function calculateBaseWeight(
  targetBatchWeight: number,
  concentrateWeight: number
): number {
  if (targetBatchWeight <= 0) return 0;
  const base = new Decimal(targetBatchWeight).minus(new Decimal(concentrateWeight));
  return base.isNegative() ? 0 : base.toDecimalPlaces(2).toNumber();
}

/**
 * Calculate calibrated drop conversions.
 * Density defaults to 1.0 g/ml if not specified.
 */
export function calculateDropsConversion(
  drops: number,
  dropsPerMl: number = 20,
  density: number = 1.0
): { ml: number; grams: number } {
  if (drops <= 0 || dropsPerMl <= 0) return { ml: 0, grams: 0 };
  const ml = new Decimal(drops).dividedBy(new Decimal(dropsPerMl));
  const grams = ml.times(new Decimal(density || 1.0));
  return {
    ml: ml.toDecimalPlaces(2).toNumber(),
    grams: grams.toDecimalPlaces(2).toNumber(),
  };
}

/**
 * Calculate drops from ml.
 */
export function calculateMlToDrops(ml: number, dropsPerMl: number = 20): number {
  if (ml <= 0 || dropsPerMl <= 0) return 0;
  return new Decimal(ml).times(new Decimal(dropsPerMl)).toDecimalPlaces(0).toNumber();
}

// ─── Utility ────────────────────────────────────────────────────────

/**
 * Round a number to specified decimal places using decimal-safe arithmetic.
 */
export function decimalRound(value: number, places: number = 2): number {
  return new Decimal(value).toDecimalPlaces(places).toNumber();
}

/**
 * Validate that a quantity is a positive number.
 */
export function isValidQuantity(quantity: number): boolean {
  return typeof quantity === "number" && isFinite(quantity) && quantity >= 0;
}
