import type { Ingredient, RecipeIngredient, NutritionSummary } from '../types';

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

/** Invalid, negative, or non-finite numeric values contribute zero. */
function safeNumber(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
}

function safeAdd(a: number, b: number): number {
  const sum = a + b;
  return Number.isFinite(sum) ? sum : a;
}

function safeScale(value: number, factor: number): number {
  const result = value * factor;
  return Number.isFinite(result) ? result : 0;
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

export function calculateRecipeTotals(recipeIngredients: RecipeIngredient[], servings = 1): NutritionSummary {
  const safeServings = safeNumber(servings) > 0 ? safeNumber(servings) : 1;

  const totals = recipeIngredients.reduce(
    (acc, item) => {
      if (!item || !item.ingredient) return acc;

      // Reject invalid weights (including +/-Infinity and NaN) before any scaling or accumulation.
      const quantity = safeNumber(item.quantity);
      if (quantity === 0) return acc;

      const nutrition = calculateIngredientNutrition(item.ingredient, quantity);
      acc.totalWeight = safeAdd(acc.totalWeight, quantity);
      acc.totalEnergy = safeAdd(acc.totalEnergy, nutrition.energy);
      acc.totalProtein = safeAdd(acc.totalProtein, nutrition.protein);
      acc.totalCarbohydrate = safeAdd(acc.totalCarbohydrate, nutrition.carbohydrates);
      acc.totalSugar = safeAdd(acc.totalSugar, nutrition.sugars);
      acc.totalFat = safeAdd(acc.totalFat, nutrition.fat);
      acc.totalSaturatedFat = safeAdd(acc.totalSaturatedFat, nutrition.saturatedFat);
      acc.totalSodium = safeAdd(acc.totalSodium, nutrition.sodium);
      acc.totalFibre = safeAdd(acc.totalFibre, nutrition.fibre);
      return acc;
    },
    {
      totalWeight: 0,
      totalEnergy: 0,
      totalProtein: 0,
      totalCarbohydrate: 0,
      totalSugar: 0,
      totalFat: 0,
      totalSaturatedFat: 0,
      totalSodium: 0,
      totalFibre: 0,
    },
  );

  const density = (total: number) =>
    totals.totalWeight > 0 ? roundToTwo(safeScale(total / totals.totalWeight, 100)) : 0;
  const perServingValue = (total: number) => roundToTwo(total / safeServings);

  const per100g = {
    energy: density(totals.totalEnergy),
    protein: density(totals.totalProtein),
    carbohydrates: density(totals.totalCarbohydrate),
    sugars: density(totals.totalSugar),
    fat: density(totals.totalFat),
    saturatedFat: density(totals.totalSaturatedFat),
    sodium: density(totals.totalSodium),
    fibre: density(totals.totalFibre),
  };

  const perServing = {
    energy: perServingValue(totals.totalEnergy),
    protein: perServingValue(totals.totalProtein),
    carbohydrates: perServingValue(totals.totalCarbohydrate),
    sugars: perServingValue(totals.totalSugar),
    fat: perServingValue(totals.totalFat),
    saturatedFat: perServingValue(totals.totalSaturatedFat),
    sodium: perServingValue(totals.totalSodium),
    fibre: perServingValue(totals.totalFibre),
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
