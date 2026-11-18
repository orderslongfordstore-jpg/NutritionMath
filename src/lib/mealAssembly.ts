import { roundToTwo } from './nutrition';
import type {
  BatchRecord,
  MealAssemblyCalculation,
  MealComponentAllocation,
  MealComponentInput,
  NutritionCalculationIssue,
  NutrientValues,
} from '../types';

const MAX_VALUE = Number.MAX_SAFE_INTEGER;
const nutrients = ['energy', 'protein', 'carbohydrates', 'sugars', 'fat', 'saturatedFat', 'sodium', 'fibre'] as const;

function blank(): NutrientValues {
  return { energy: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, sodium: 0, fibre: 0 };
}

function issue(issues: NutritionCalculationIssue[], code: string, message: string): void {
  issues.push({ code, severity: 'error', message });
}

function validPositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_VALUE;
}

export function calculateMealAssembly(
  components: MealComponentInput[],
  batches: BatchRecord[],
): MealAssemblyCalculation {
  const result: MealAssemblyCalculation = {
    servingWeightGrams: 0,
    portions: 0,
    finishedMealWeightGrams: 0,
    componentAllocations: [],
    totalNutrients: blank(),
    perServing: blank(),
    per100g: blank(),
    isValid: false,
    issues: [],
  };
  const issues = result.issues;
  if (!Array.isArray(components) || components.length < 2) {
    issue(issues, 'meal_needs_components', 'Choose at least two separately prepared component batches.');
    return result;
  }

  const seen = new Set<string>();
  const resolved: Array<{ input: MealComponentInput; batch: BatchRecord }> = [];
  for (const [index, input] of components.entries()) {
    if (!input || typeof input.batchRecordId !== 'string' || !input.batchRecordId) {
      issue(issues, 'meal_component_missing', `Meal component ${index + 1} must select a batch record.`);
      continue;
    }
    if (seen.has(input.batchRecordId)) {
      issue(issues, 'meal_component_duplicate', 'Select each component batch only once.');
      continue;
    }
    seen.add(input.batchRecordId);
    const batch = batches.find((entry) => entry.id === input.batchRecordId);
    if (!batch) {
      issue(issues, 'meal_component_batch_missing', `Selected component batch ${input.batchRecordId} is not available in this session.`);
      continue;
    }
    if (!batch.calculation.isValid || !validPositive(batch.calculation.finalFinishedWeightGrams)) {
      issue(issues, 'meal_component_batch_invalid', `Component batch ${batch.batchCode} has no valid measured finished yield.`);
      continue;
    }
    if (!validPositive(input.portionWeightGrams)) {
      issue(issues, 'meal_component_weight_invalid', `Component ${batch.recipeName} needs a finite positive plated weight in grams.`);
      continue;
    }
    resolved.push({ input, batch });
  }
  if (issues.length) return result;

  let servingWeight = 0;
  const componentPortionCounts = resolved.map(({ input, batch }) => (
    Math.floor(batch.calculation.finalFinishedWeightGrams / input.portionWeightGrams)
  ));
  if (componentPortionCounts.some((count) => !Number.isSafeInteger(count) || count < 1)) {
    issue(issues, 'meal_component_insufficient_yield', 'At least one selected component does not contain one full plated portion.');
    return result;
  }
  const portions = Math.min(...componentPortionCounts);
  const allocations: MealComponentAllocation[] = [];
  const perServing = blank();
  for (const { input, batch } of resolved) {
    const availableWeight = batch.calculation.finalFinishedWeightGrams;
    const usedWeight = input.portionWeightGrams * portions;
    const servingNutrients = blank();
    for (const key of nutrients) {
      const availableNutrient = batch.calculation.totalNutrients[key];
      if (!Number.isFinite(availableNutrient) || availableNutrient < 0) {
        issue(issues, 'meal_component_nutrient_invalid', `Component ${batch.recipeName} has invalid ${key} totals.`);
        continue;
      }
      const value = (availableNutrient / availableWeight) * input.portionWeightGrams;
      if (!Number.isFinite(value) || value < 0 || value > MAX_VALUE) {
        issue(issues, 'meal_numeric_overflow', `Meal ${key} contribution exceeds the supported range.`);
        continue;
      }
      servingNutrients[key] = value;
      const next = perServing[key] + value;
      if (!Number.isFinite(next) || next > MAX_VALUE) issue(issues, 'meal_numeric_overflow', `Combined meal ${key} exceeds the supported range.`);
      else perServing[key] = next;
    }
    const nextWeight = servingWeight + input.portionWeightGrams;
    if (!Number.isFinite(nextWeight) || nextWeight > MAX_VALUE) issue(issues, 'meal_numeric_overflow', 'Combined meal portion weight exceeds the supported range.');
    else servingWeight = nextWeight;
    allocations.push({
      batchRecordId: batch.id,
      componentName: batch.recipeName,
      componentBatchCode: batch.batchCode,
      componentPortionWeightGrams: input.portionWeightGrams,
      componentAvailableWeightGrams: availableWeight,
      weightUsedGrams: usedWeight,
      weightLeftoverGrams: availableWeight - usedWeight,
      perPortionNutrients: servingNutrients,
    });
  }

  if (issues.length) return result;
  if (!validPositive(servingWeight) || !Number.isSafeInteger(portions) || portions < 1) {
    issue(issues, 'meal_portions_invalid', 'The selected component yields do not produce a complete combined meal portion.');
    return result;
  }
  const finishedWeight = servingWeight * portions;
  if (!validPositive(finishedWeight)) {
    issue(issues, 'meal_numeric_overflow', 'Combined meal finished weight exceeds the supported range.');
    return result;
  }
  const totalNutrients = blank();
  const per100g = blank();
  for (const key of nutrients) {
    const total = perServing[key] * portions;
    const density = (perServing[key] / servingWeight) * 100;
    if (!Number.isFinite(total) || total > MAX_VALUE || !Number.isFinite(density) || density > MAX_VALUE) {
      issue(issues, 'meal_numeric_overflow', `Combined meal ${key} result exceeds the supported range.`);
      continue;
    }
    totalNutrients[key] = total;
    per100g[key] = roundToTwo(density);
  }
  if (issues.length) return result;
  result.servingWeightGrams = servingWeight;
  result.portions = portions;
  result.finishedMealWeightGrams = finishedWeight;
  result.componentAllocations = allocations;
  result.perServing = perServing;
  result.totalNutrients = totalNutrients;
  result.per100g = per100g;
  result.isValid = true;
  return result;
}
