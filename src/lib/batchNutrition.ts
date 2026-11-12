import { calculateRecipeTotals, roundToTwo } from './nutrition';
import type {
  BatchCalculationInput,
  BatchNutritionSummary,
  NutritionCalculationIssue,
  NutrientValues,
  RecipeIngredient,
} from '../types';

const nutrientTotalKeys = {
  energy: 'totalEnergy',
  protein: 'totalProtein',
  carbohydrates: 'totalCarbohydrate',
  sugars: 'totalSugar',
  fat: 'totalFat',
  saturatedFat: 'totalSaturatedFat',
  sodium: 'totalSodium',
  fibre: 'totalFibre',
} as const;

const MAX_VALUE = Number.MAX_SAFE_INTEGER;

function isValidPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_VALUE;
}

function addIssue(issues: NutritionCalculationIssue[], code: string, message: string): void {
  issues.push({ code, severity: 'error', message });
}

function emptyNutrients(): NutrientValues {
  return {
    energy: 0,
    protein: 0,
    carbohydrates: 0,
    sugars: 0,
    fat: 0,
    saturatedFat: 0,
    sodium: 0,
    fibre: 0,
  };
}

function scaledLines(lines: RecipeIngredient[] | undefined, factor: number): RecipeIngredient[] {
  if (!Array.isArray(lines)) return [];
  return lines.map((line) => ({
    ...line,
    quantity: line && typeof line.quantity === 'number' ? line.quantity * factor : Number.NaN,
  }));
}

function sumNutrition(lines: RecipeIngredient[], issues: NutritionCalculationIssue[], label: string) {
  if (lines.length === 0) return null;
  const summary = calculateRecipeTotals(lines, 1);
  if (!summary.isValid) {
    summary.issues.forEach((issue) => issues.push({
      ...issue,
      code: `${label}_${issue.code}`,
      message: `${label}: ${issue.message}`,
    }));
  }
  return summary;
}

function exactNutrientTotals(lines: RecipeIngredient[]): NutrientValues {
  const totals = emptyNutrients();
  for (const line of lines) {
    if (!line?.ingredient || !Number.isFinite(line.quantity) || line.quantity < 0) continue;
    for (const nutrient of Object.keys(totals) as Array<keyof NutrientValues>) {
      const value: unknown = line.ingredient[nutrient];
      if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) continue;
      const contribution = (line.quantity / 100) * value;
      const next = totals[nutrient] + contribution;
      if (Number.isFinite(contribution) && contribution >= 0 && contribution <= MAX_VALUE
        && Number.isFinite(next) && next <= MAX_VALUE) {
        totals[nutrient] = next;
      }
    }
  }
  return totals;
}

function safeTotal(a: number, b: number, issues: NutritionCalculationIssue[], label: string): number {
  const value = a + b;
  if (!Number.isFinite(value) || value < 0 || value > MAX_VALUE) {
    addIssue(issues, 'batch_numeric_overflow', `${label} exceeds the supported calculation range.`);
    return 0;
  }
  return value;
}

function exactWeight(lines: RecipeIngredient[]): number {
  return lines.reduce((total, line) => {
    if (!Number.isFinite(line?.quantity) || line.quantity < 0) return total;
    const next = total + line.quantity;
    return Number.isFinite(next) && next <= MAX_VALUE ? next : total;
  }, 0);
}

function ratios(
  totals: NutrientValues,
  denominator: number,
  multiplier: number,
  issues: NutritionCalculationIssue[],
  label: string,
): NutrientValues {
  const result = emptyNutrients();
  if (!isValidPositive(denominator)) {
    addIssue(issues, 'batch_invalid_yield', `${label} cannot be calculated without a finite positive finished-product weight.`);
    return result;
  }

  for (const nutrient of Object.keys(result) as Array<keyof NutrientValues>) {
    const value = (totals[nutrient] / denominator) * multiplier;
    if (!Number.isFinite(value) || value < 0 || value > MAX_VALUE) {
      addIssue(issues, 'batch_numeric_overflow', `${label} ${nutrient} is outside the supported calculation range.`);
      result[nutrient] = 0;
    } else {
      result[nutrient] = roundToTwo(value);
    }
  }
  return result;
}

const emptySummary = (): BatchNutritionSummary => ({
  rawIngredientWeightGrams: 0,
  addedMaterialWeightGrams: 0,
  totalInputWeightGrams: 0,
  cookedBatchWeightGrams: 0,
  cookingWeightLossGrams: 0,
  cookingWeightGainGrams: 0,
  discardedMaterialWeightGrams: 0,
  finalFinishedWeightGrams: 0,
  portionWeightGrams: 0,
  portions: 0,
  remainderWeightGrams: 0,
  totalNutrients: emptyNutrients(),
  per100g: emptyNutrients(),
  perServing: emptyNutrients(),
  isValid: false,
  issues: [],
});

/**
 * Calculate a batch from a saved recipe version and explicit process records.
 * The measured cooked weight is never inferred from raw input weight. Added and
 * discarded lines are scaled with the recipe; discarded lines must describe
 * the measured discarded material's nutrient profile, not its uncooked source.
 * Nutrient retention is assumed except for explicitly recorded discards.
 */
export function calculateBatchNutrition(input: BatchCalculationInput): BatchNutritionSummary {
  const result = emptySummary();
  const issues = result.issues;
  const scale = isValidPositive(input?.scaleFactor) ? input.scaleFactor : 0;
  if (scale === 0) addIssue(issues, 'invalid_batch_scale', 'Batch scale must be finite and greater than zero.');

  const baseLines = scaledLines(input?.recipeVersion?.ingredients, scale);
  const additionLines = scaledLines(input?.additions, scale);
  const discardedLines = scaledLines(input?.discardedMaterials, scale);

  if (baseLines.length === 0) addIssue(issues, 'empty_batch_recipe', 'A saved recipe version with at least one ingredient is required.');
  const base = sumNutrition(baseLines, issues, 'Recipe ingredients');
  const additions = sumNutrition(additionLines, issues, 'Added materials');
  const discards = sumNutrition(discardedLines, issues, 'Discarded materials');

  result.rawIngredientWeightGrams = exactWeight(baseLines);
  result.addedMaterialWeightGrams = exactWeight(additionLines);
  result.totalInputWeightGrams = safeTotal(
    result.rawIngredientWeightGrams,
    result.addedMaterialWeightGrams,
    issues,
    'Total pre-cook input weight',
  );
  result.cookedBatchWeightGrams = isValidPositive(input?.cookedBatchWeightGrams)
    ? input.cookedBatchWeightGrams
    : 0;
  if (!isValidPositive(input?.cookedBatchWeightGrams)) {
    addIssue(issues, 'invalid_cooked_weight', 'Measured cooked batch weight must be finite and greater than zero.');
  }
  result.discardedMaterialWeightGrams = exactWeight(discardedLines);
  result.finalFinishedWeightGrams = result.cookedBatchWeightGrams - result.discardedMaterialWeightGrams;
  if (result.discardedMaterialWeightGrams > result.cookedBatchWeightGrams) {
    addIssue(issues, 'discard_exceeds_cooked_weight', 'Discarded material weight cannot exceed the measured cooked batch weight.');
  }
  if (!isValidPositive(result.finalFinishedWeightGrams)) {
    addIssue(issues, 'invalid_finished_weight', 'Finished-product weight after recorded discards must be finite and greater than zero.');
  }
  result.cookingWeightLossGrams = Math.max(0, result.totalInputWeightGrams - result.cookedBatchWeightGrams);
  result.cookingWeightGainGrams = Math.max(0, result.cookedBatchWeightGrams - result.totalInputWeightGrams);
  result.portionWeightGrams = isValidPositive(input?.portionWeightGrams)
    ? input.portionWeightGrams
    : 0;
  if (!isValidPositive(input?.portionWeightGrams)) {
    addIssue(issues, 'invalid_portion_weight', 'Portion weight must be finite and greater than zero.');
  }

  const baseTotals = exactNutrientTotals(baseLines);
  const additionTotals = exactNutrientTotals(additionLines);
  const discardTotals = exactNutrientTotals(discardedLines);
  const totalNutrients = emptyNutrients();
  for (const nutrient of Object.keys(totalNutrients) as Array<keyof NutrientValues>) {
    const available = baseTotals[nutrient] + additionTotals[nutrient];
    if (!Number.isFinite(available) || available < 0 || available > MAX_VALUE) {
      addIssue(issues, 'batch_numeric_overflow', `${nutrient} input exceeds the supported calculation range.`);
      totalNutrients[nutrient] = 0;
      continue;
    }
    const retained = available - discardTotals[nutrient];
    if (!Number.isFinite(retained) || retained < 0 || retained > MAX_VALUE) {
      addIssue(issues, 'discard_nutrients_exceed_input', `Recorded discarded ${nutrient} exceeds the available batch amount.`);
      totalNutrients[nutrient] = 0;
    } else {
      totalNutrients[nutrient] = retained;
    }
  }
  result.totalNutrients = totalNutrients;
  result.per100g = ratios(totalNutrients, result.finalFinishedWeightGrams, 100, issues, 'Per-100-g nutrition');
  result.perServing = ratios(totalNutrients, result.finalFinishedWeightGrams, result.portionWeightGrams, issues, 'Per-portion nutrition');

  if (isValidPositive(result.finalFinishedWeightGrams) && isValidPositive(result.portionWeightGrams)) {
    const portionCount = result.finalFinishedWeightGrams / result.portionWeightGrams;
    if (!Number.isFinite(portionCount) || portionCount > MAX_VALUE) {
      addIssue(issues, 'batch_portion_overflow', 'The calculated portion count exceeds the supported range.');
    } else {
      result.portions = Math.floor(portionCount);
      if (result.portions < 1) addIssue(issues, 'zero_portions', 'Finished-product weight is less than one declared portion.');
      result.remainderWeightGrams = result.finalFinishedWeightGrams - result.portions * result.portionWeightGrams;
    }
  }

  result.isValid = issues.length === 0;
  return result;
}
