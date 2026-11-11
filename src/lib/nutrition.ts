import type {
  Ingredient,
  NutritionCalculationIssue,
  NutritionSummary,
  RecipeIngredient,
} from '../types';

const nutrients = [
  'energy',
  'protein',
  'carbohydrates',
  'sugars',
  'fat',
  'saturatedFat',
  'sodium',
  'fibre',
] as const;

type NutrientName = (typeof nutrients)[number];
type IngredientNutrients = Pick<Ingredient, NutrientName>;
type NutrientValues = Record<NutrientName, number>;
type Totals = Omit<NutritionSummary, 'per100g' | 'perServing' | 'isValid' | 'issues'>;

const nutrientLabels: Record<NutrientName, string> = {
  energy: 'Energy',
  protein: 'Protein',
  carbohydrates: 'Carbohydrate',
  sugars: 'Sugars',
  fat: 'Fat',
  saturatedFat: 'Saturated fat',
  sodium: 'Sodium',
  fibre: 'Fibre',
};

// Values beyond this magnitude cannot retain useful gram-level numeric precision.
const MAX_CALCULATION_VALUE = Number.MAX_SAFE_INTEGER;

function isSafeNonNegative(value: unknown): value is number {
  return typeof value === 'number'
    && Number.isFinite(value)
    && value >= 0
    && value <= MAX_CALCULATION_VALUE;
}

function isValidServingCount(value: unknown): value is number {
  return isSafeNonNegative(value) && Number.isInteger(value) && value >= 1;
}

/** Invalid, negative, non-finite, or precision-exceeding values contribute zero. */
function safeNumber(value: unknown): number {
  return isSafeNonNegative(value) ? value : 0;
}

function addIssue(
  issues: NutritionCalculationIssue[],
  code: string,
  severity: NutritionCalculationIssue['severity'],
  message: string,
  itemIndex?: number,
  nutrient?: string,
): void {
  issues.push({ code, severity, message, itemIndex, nutrient });
}

function safeAdd(
  a: number,
  b: number,
  label: string,
  issues: NutritionCalculationIssue[],
  itemIndex: number,
): number {
  const sum = a + b;
  if (!isSafeNonNegative(sum)) {
    addIssue(
      issues,
      'numeric_overflow',
      'error',
      `${label} exceeds the supported calculation range at ingredient ${itemIndex + 1}.`,
      itemIndex,
    );
    return a;
  }
  return sum;
}

function safeScale(value: number, factor: number): number {
  const result = value * factor;
  return isSafeNonNegative(result) ? result : 0;
}

function safeQuotient(
  numerator: number,
  denominator: number,
  multiplier: number,
  label: string,
  issues: NutritionCalculationIssue[],
): number {
  if (denominator <= 0) return 0;
  const result = (numerator / denominator) * multiplier;
  if (!isSafeNonNegative(result)) {
    addIssue(issues, 'numeric_overflow', 'error', `${label} is outside the supported calculation range.`);
    return 0;
  }
  return roundToTwo(result);
}

export function roundToTwo(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Number(value.toFixed(2));
}

export function calculateIngredientNutrition(ingredient: IngredientNutrients, grams: number): NutrientValues {
  const safeGrams = safeNumber(grams);
  const factor = safeGrams / 100;

  return {
    energy: roundToTwo(safeScale(safeNumber(ingredient?.energy), factor)),
    protein: roundToTwo(safeScale(safeNumber(ingredient?.protein), factor)),
    carbohydrates: roundToTwo(safeScale(safeNumber(ingredient?.carbohydrates), factor)),
    sugars: roundToTwo(safeScale(safeNumber(ingredient?.sugars), factor)),
    fat: roundToTwo(safeScale(safeNumber(ingredient?.fat), factor)),
    saturatedFat: roundToTwo(safeScale(safeNumber(ingredient?.saturatedFat), factor)),
    sodium: roundToTwo(safeScale(safeNumber(ingredient?.sodium), factor)),
    fibre: roundToTwo(safeScale(safeNumber(ingredient?.fibre), factor)),
  };
}

export function calculateRecipeTotals(
  recipeIngredients: RecipeIngredient[] | null | undefined,
  servings = 1,
): NutritionSummary {
  const issues: NutritionCalculationIssue[] = [];
  const entries = Array.isArray(recipeIngredients) ? recipeIngredients : [];

  if (!Array.isArray(recipeIngredients)) {
    addIssue(issues, 'invalid_recipe', 'error', 'Recipe ingredients must be provided as a list.');
  } else if (entries.length === 0) {
    addIssue(issues, 'empty_recipe', 'warning', 'Add at least one ingredient before using these totals.');
  }

  const safeServings = isValidServingCount(servings) ? servings : 1;
  if (!isValidServingCount(servings)) {
    addIssue(issues, 'invalid_servings', 'error', 'Serving count must be a finite positive whole number within the supported range.');
  }

  const totals = entries.reduce<Totals>((acc, item, itemIndex) => {
    if (!item || typeof item !== 'object' || !item.ingredient) {
      addIssue(issues, 'missing_ingredient', 'error', `Recipe row ${itemIndex + 1} has no ingredient.`, itemIndex);
      return acc;
    }

    const quantity = item.quantity;
    if (!isSafeNonNegative(quantity)) {
      addIssue(
        issues,
        'invalid_quantity',
        'error',
        `Ingredient quantity in row ${itemIndex + 1} must be finite, non-negative, and within the supported range.`,
        itemIndex,
      );
      return acc;
    }
    if (quantity === 0) {
      addIssue(issues, 'zero_quantity', 'warning', `Ingredient quantity in row ${itemIndex + 1} is zero and was ignored.`, itemIndex);
      return acc;
    }

    const factor = quantity / 100;
    const rawIngredient = item.ingredient as unknown as Record<string, unknown>;
    for (const nutrient of nutrients) {
      const value = rawIngredient[nutrient];
      if (value === undefined || value === null) {
        addIssue(
          issues,
          'missing_nutrient',
          'warning',
          `${nutrientLabels[nutrient]} is missing for ingredient ${item.ingredient.name || itemIndex + 1}.`,
          itemIndex,
          nutrient,
        );
      } else if (!isSafeNonNegative(value)) {
        addIssue(
          issues,
          'invalid_nutrient',
          'error',
          `${nutrientLabels[nutrient]} for ingredient ${item.ingredient.name || itemIndex + 1} must be finite and non-negative.`,
          itemIndex,
          nutrient,
        );
      } else if (!isSafeNonNegative(value * factor)) {
        addIssue(
          issues,
          'numeric_overflow',
          'error',
          `${nutrientLabels[nutrient]} for ingredient ${item.ingredient.name || itemIndex + 1} exceeds the supported calculation range.`,
          itemIndex,
          nutrient,
        );
      }
    }

    const nutrition = calculateIngredientNutrition(item.ingredient, quantity);
    acc.totalWeight = safeAdd(acc.totalWeight, quantity, 'Recipe weight', issues, itemIndex);
    acc.totalEnergy = safeAdd(acc.totalEnergy, nutrition.energy, 'Energy total', issues, itemIndex);
    acc.totalProtein = safeAdd(acc.totalProtein, nutrition.protein, 'Protein total', issues, itemIndex);
    acc.totalCarbohydrate = safeAdd(acc.totalCarbohydrate, nutrition.carbohydrates, 'Carbohydrate total', issues, itemIndex);
    acc.totalSugar = safeAdd(acc.totalSugar, nutrition.sugars, 'Sugar total', issues, itemIndex);
    acc.totalFat = safeAdd(acc.totalFat, nutrition.fat, 'Fat total', issues, itemIndex);
    acc.totalSaturatedFat = safeAdd(acc.totalSaturatedFat, nutrition.saturatedFat, 'Saturated fat total', issues, itemIndex);
    acc.totalSodium = safeAdd(acc.totalSodium, nutrition.sodium, 'Sodium total', issues, itemIndex);
    acc.totalFibre = safeAdd(acc.totalFibre, nutrition.fibre, 'Fibre total', issues, itemIndex);
    return acc;
  }, {
    totalWeight: 0,
    totalEnergy: 0,
    totalProtein: 0,
    totalCarbohydrate: 0,
    totalSugar: 0,
    totalFat: 0,
    totalSaturatedFat: 0,
    totalSodium: 0,
    totalFibre: 0,
  });

  const density = (total: number, label: string) =>
    safeQuotient(total, totals.totalWeight, 100, `${label} per 100 g`, issues);
  const perServingValue = (total: number, label: string) =>
    safeQuotient(total, safeServings, 1, `${label} per serving`, issues);

  const per100g = {
    energy: density(totals.totalEnergy, 'Energy'),
    protein: density(totals.totalProtein, 'Protein'),
    carbohydrates: density(totals.totalCarbohydrate, 'Carbohydrate'),
    sugars: density(totals.totalSugar, 'Sugars'),
    fat: density(totals.totalFat, 'Fat'),
    saturatedFat: density(totals.totalSaturatedFat, 'Saturated fat'),
    sodium: density(totals.totalSodium, 'Sodium'),
    fibre: density(totals.totalFibre, 'Fibre'),
  };

  const perServing = {
    energy: perServingValue(totals.totalEnergy, 'Energy'),
    protein: perServingValue(totals.totalProtein, 'Protein'),
    carbohydrates: perServingValue(totals.totalCarbohydrate, 'Carbohydrate'),
    sugars: perServingValue(totals.totalSugar, 'Sugars'),
    fat: perServingValue(totals.totalFat, 'Fat'),
    saturatedFat: perServingValue(totals.totalSaturatedFat, 'Saturated fat'),
    sodium: perServingValue(totals.totalSodium, 'Sodium'),
    fibre: perServingValue(totals.totalFibre, 'Fibre'),
  };

  return {
    totalWeight: roundToTwo(totals.totalWeight),
    totalEnergy: roundToTwo(totals.totalEnergy),
    totalProtein: roundToTwo(totals.totalProtein),
    totalCarbohydrate: roundToTwo(totals.totalCarbohydrate),
    totalSugar: roundToTwo(totals.totalSugar),
    totalFat: roundToTwo(totals.totalFat),
    totalSaturatedFat: roundToTwo(totals.totalSaturatedFat),
    totalSodium: roundToTwo(totals.totalSodium),
    totalFibre: roundToTwo(totals.totalFibre),
    per100g,
    perServing,
    isValid: issues.length === 0,
    issues,
  };
}

export function calculateNipPanel(values: NutrientValues) {
  return {
    energyPer100g: roundToTwo(safeNumber(values.energy)),
    proteinPer100g: roundToTwo(safeNumber(values.protein)),
    carbohydratePer100g: roundToTwo(safeNumber(values.carbohydrates)),
    sugarPer100g: roundToTwo(safeNumber(values.sugars)),
    fatPer100g: roundToTwo(safeNumber(values.fat)),
    saturatedFatPer100g: roundToTwo(safeNumber(values.saturatedFat)),
    sodiumPer100g: roundToTwo(safeNumber(values.sodium)),
    fibrePer100g: roundToTwo(safeNumber(values.fibre)),
  };
}
