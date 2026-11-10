export type Nutrients = {
  energyKj?: number;
  proteinG?: number;
  fatG?: number;
  saturatedG?: number;
  carbohydrateG?: number;
  sugarsG?: number;
  sodiumMg?: number;
};

export type Ingredient = {
  id: string;
  name: string;
  unit: "g" | "kg" | "mL";
  nutrientsPer100: Nutrients;
};

export type RecipeLine = { ingredient: Ingredient; quantity: number; unit: "g" | "kg" | "mL" };

export type RecipeResult = {
  batchWeightG: number;
  nutrients: Nutrients;
  per100G: Nutrients;
  perServing: Nutrients;
  servings: number;
  completeness: "complete" | "partial";
};

const KEYS: (keyof Nutrients)[] = ["energyKj", "proteinG", "fatG", "saturatedG", "carbohydrateG", "sugarsG", "sodiumMg"];
const toGrams = (quantity: number, unit: RecipeLine["unit"]) => unit === "kg" ? quantity * 1000 : quantity;

export function calculateRecipe(lines: RecipeLine[], cookedBatchWeightG: number | undefined, servings: number): RecipeResult {
  const nutrients: Nutrients = {};
  let rawWeight = 0;
  let complete = true;
  for (const line of lines) {
    const grams = toGrams(line.quantity, line.unit);
    rawWeight += grams;
    for (const key of KEYS) {
      const value = line.ingredient.nutrientsPer100[key];
      if (value === undefined) complete = false;
      nutrients[key] = (nutrients[key] ?? 0) + (value ?? 0) * grams / 100;
    }
  }
  const batchWeightG = cookedBatchWeightG && cookedBatchWeightG > 0 ? cookedBatchWeightG : rawWeight;
  const per100G: Nutrients = {};
  const perServing: Nutrients = {};
  for (const key of KEYS) {
    if (nutrients[key] !== undefined) {
      per100G[key] = nutrients[key]! * 100 / batchWeightG;
      perServing[key] = nutrients[key]! / Math.max(1, servings);
    }
  }
  return { batchWeightG, nutrients, per100G, perServing, servings: Math.max(1, servings), completeness: complete ? "complete" : "partial" };
}

export const formatNutrient = (key: keyof Nutrients, value: number | undefined) => value === undefined ? "—" : key === "energyKj" || key === "sodiumMg" ? Math.round(value).toString() : value.toFixed(1);
