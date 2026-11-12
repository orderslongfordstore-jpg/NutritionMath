export interface Ingredient {
  id: string;
  name: string;
  code?: string;
  brand?: string;
  energy: number;
  protein: number;
  carbohydrates: number;
  sugars: number;
  fat: number;
  saturatedFat: number;
  sodium: number;
  fibre: number;
  servingSize: number;
  allergens: string[];
  origin?: string;
}

export interface RecipeIngredient {
  ingredient: Ingredient;
  quantity: number;
}

export type NutrientValues = Pick<
  Ingredient,
  'energy' | 'protein' | 'carbohydrates' | 'sugars' | 'fat' | 'saturatedFat' | 'sodium' | 'fibre'
>;

export interface RecipeVersion {
  id: string;
  recipeId: string;
  name: string;
  version: number;
  ingredients: RecipeIngredient[];
  servings: number;
  createdAt: string;
}

export interface SavedRecipe {
  id: string;
  name: string;
  versions: RecipeVersion[];
}

export interface BatchCalculationInput {
  recipeVersion: RecipeVersion;
  scaleFactor: number;
  additions: RecipeIngredient[];
  discardedMaterials: RecipeIngredient[];
  cookedBatchWeightGrams: number;
  portionWeightGrams: number;
}

export interface BatchNutritionSummary {
  rawIngredientWeightGrams: number;
  addedMaterialWeightGrams: number;
  totalInputWeightGrams: number;
  cookedBatchWeightGrams: number;
  cookingWeightLossGrams: number;
  cookingWeightGainGrams: number;
  discardedMaterialWeightGrams: number;
  finalFinishedWeightGrams: number;
  portionWeightGrams: number;
  portions: number;
  remainderWeightGrams: number;
  totalNutrients: NutrientValues;
  per100g: NutrientValues;
  perServing: NutrientValues;
  isValid: boolean;
  issues: NutritionCalculationIssue[];
}

export interface BatchRecord {
  id: string;
  recipeId: string;
  recipeVersionId: string;
  recipeName: string;
  recipeVersion: number;
  batchCode: string;
  recordedAt: string;
  scaleFactor: number;
  additions: RecipeIngredient[];
  discardedMaterials: RecipeIngredient[];
  cookedBatchWeightGrams: number;
  portionWeightGrams: number;
  calculation: BatchNutritionSummary;
}

export interface NutritionCalculationIssue {
  code: string;
  severity: 'error' | 'warning';
  message: string;
  itemIndex?: number;
  nutrient?: string;
}

export interface NutritionSummary {
  totalWeight: number;
  totalEnergy: number;
  totalProtein: number;
  totalCarbohydrate: number;
  totalSugar: number;
  totalFat: number;
  totalSaturatedFat: number;
  totalSodium: number;
  totalFibre: number;
  per100g: {
    energy: number;
    protein: number;
    carbohydrates: number;
    sugars: number;
    fat: number;
    saturatedFat: number;
    sodium: number;
    fibre: number;
  };
  perServing: {
    energy: number;
    protein: number;
    carbohydrates: number;
    sugars: number;
    fat: number;
    saturatedFat: number;
    sodium: number;
    fibre: number;
  };
  isValid: boolean;
  issues: NutritionCalculationIssue[];
}
