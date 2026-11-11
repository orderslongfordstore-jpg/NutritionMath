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
