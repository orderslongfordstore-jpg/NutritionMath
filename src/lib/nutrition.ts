import type { Ingredient, RecipeIngredient, NutritionSummary } from '../types';

function safeNumber(value: number | undefined | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, value);
}

export function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

export function calculateIngredientNutrition(
  ingredient: Pick<Ingredient, 'energy' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'sodium' | 'fibre'>,
  grams: number,
) {
  const safeGrams = safeNumber(grams);
  const factor = safeGrams / 100;

  return {
    energy: roundToTwo(safeNumber(ingredient.energy) * factor),
    protein: roundToTwo(safeNumber(ingredient.protein) * factor),
    carbohydrates: roundToTwo(safeNumber(ingredient.carbohydrates) * factor),
    sugars: roundToTwo(safeNumber(ingredient.sugars) * factor),
    fat: roundToTwo(safeNumber(ingredient.fat) * factor),
    saturatedFat: roundToTwo(safeNumber(ingredient.saturatedFat) * factor),
    sodium: roundToTwo(safeNumber(ingredient.sodium) * factor),
    fibre: roundToTwo(safeNumber(ingredient.fibre) * factor),
  };
}

export function calculateRecipeTotals(recipeIngredients: RecipeIngredient[], servings = 1): NutritionSummary {
  const safeServings = safeNumber(servings) > 0 ? safeNumber(servings) : 1;

  const totals = recipeIngredients.reduce(
    (acc, item) => {
      const quantity = safeNumber(item.quantity);
      const nutrition = calculateIngredientNutrition(item.ingredient, quantity);

      acc.totalWeight += quantity;
      acc.totalEnergy += nutrition.energy;
      acc.totalProtein += nutrition.protein;
      acc.totalCarbohydrate += nutrition.carbohydrates;
      acc.totalSugar += nutrition.sugars;
      acc.totalFat += nutrition.fat;
      acc.totalSaturatedFat += nutrition.saturatedFat;
      acc.totalSodium += nutrition.sodium;
      acc.totalFibre += nutrition.fibre;

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

  const per100g = {
    energy: totals.totalWeight > 0 ? roundToTwo((totals.totalEnergy / totals.totalWeight) * 100) : 0,
    protein: totals.totalWeight > 0 ? roundToTwo((totals.totalProtein / totals.totalWeight) * 100) : 0,
    carbohydrates: totals.totalWeight > 0 ? roundToTwo((totals.totalCarbohydrate / totals.totalWeight) * 100) : 0,
    sugars: totals.totalWeight > 0 ? roundToTwo((totals.totalSugar / totals.totalWeight) * 100) : 0,
    fat: totals.totalWeight > 0 ? roundToTwo((totals.totalFat / totals.totalWeight) * 100) : 0,
    saturatedFat: totals.totalWeight > 0 ? roundToTwo((totals.totalSaturatedFat / totals.totalWeight) * 100) : 0,
    sodium: totals.totalWeight > 0 ? roundToTwo((totals.totalSodium / totals.totalWeight) * 100) : 0,
    fibre: totals.totalWeight > 0 ? roundToTwo((totals.totalFibre / totals.totalWeight) * 100) : 0,
  };

  const perServing = {
    energy: roundToTwo(totals.totalEnergy / safeServings),
    protein: roundToTwo(totals.totalProtein / safeServings),
    carbohydrates: roundToTwo(totals.totalCarbohydrate / safeServings),
    sugars: roundToTwo(totals.totalSugar / safeServings),
    fat: roundToTwo(totals.totalFat / safeServings),
    saturatedFat: roundToTwo(totals.totalSaturatedFat / safeServings),
    sodium: roundToTwo(totals.totalSodium / safeServings),
    fibre: roundToTwo(totals.totalFibre / safeServings),
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

export function calculateNipPanel(values: {
  energy: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  fibre: number;
}) {
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
