import { Ingredient, NutritionSummary, RecipeIngredient } from '../types';

export function roundToTwo(value: number) {
  return Number(value.toFixed(2));
}

export function calculateIngredientNutrition(ingredient: Pick<Ingredient, 'energy' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'sodium' | 'fibre'>, grams: number) {
  const scale = grams / 100;

  return {
    energy: roundToTwo(ingredient.energy * scale),
    protein: roundToTwo(ingredient.protein * scale),
    carbohydrates: roundToTwo(ingredient.carbohydrates * scale),
    sugars: roundToTwo(ingredient.sugars * scale),
    fat: roundToTwo(ingredient.fat * scale),
    saturatedFat: roundToTwo(ingredient.saturatedFat * scale),
    sodium: roundToTwo(ingredient.sodium * scale),
    fibre: roundToTwo(ingredient.fibre * scale),
  };
}

export function calculateRecipeTotals(recipeIngredients: RecipeIngredient[], servings = 1): NutritionSummary {
  const totals = recipeIngredients.reduce(
    (acc, item) => {
      const nutrition = calculateIngredientNutrition(item.ingredient, item.quantity);
      acc.totalEnergy += nutrition.energy;
      acc.totalProtein += nutrition.protein;
      acc.totalCarbohydrate += nutrition.carbohydrates;
      acc.totalSugar += nutrition.sugars;
      acc.totalFat += nutrition.fat;
      acc.totalSaturatedFat += nutrition.saturatedFat;
      acc.totalSodium += nutrition.sodium;
      acc.totalFibre += nutrition.fibre;
      acc.totalWeight += item.quantity;
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
    energy: servings > 0 ? roundToTwo(totals.totalEnergy / servings) : 0,
    protein: servings > 0 ? roundToTwo(totals.totalProtein / servings) : 0,
    carbohydrates: servings > 0 ? roundToTwo(totals.totalCarbohydrate / servings) : 0,
    sugars: servings > 0 ? roundToTwo(totals.totalSugar / servings) : 0,
    fat: servings > 0 ? roundToTwo(totals.totalFat / servings) : 0,
    saturatedFat: servings > 0 ? roundToTwo(totals.totalSaturatedFat / servings) : 0,
    sodium: servings > 0 ? roundToTwo(totals.totalSodium / servings) : 0,
    fibre: servings > 0 ? roundToTwo(totals.totalFibre / servings) : 0,
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

export function calculateNipPanel(values: { energy: number; protein: number; carbohydrates: number; sugars: number; fat: number; saturatedFat: number; sodium: number; fibre: number }) {
  return {
    energyPer100g: roundToTwo(values.energy),
    proteinPer100g: roundToTwo(values.protein),
    carbohydratePer100g: roundToTwo(values.carbohydrates),
    sugarPer100g: roundToTwo(values.sugars),
    fatPer100g: roundToTwo(values.fat),
    saturatedFatPer100g: roundToTwo(values.saturatedFat),
    sodiumPer100g: roundToTwo(values.sodium),
    fibrePer100g: roundToTwo(values.fibre),
  };
}
