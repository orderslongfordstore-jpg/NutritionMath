import { describe, expect, it } from 'vitest';
import { calculateBatchNutrition } from './batchNutrition';
import { afcdChickenBreastRaw, afcdTapWater, afcdWhiteRiceUncooked } from '../test/fixtures/afcdRelease3';
import type { BatchCalculationInput, Ingredient, RecipeVersion } from '../types';

const chicken = afcdChickenBreastRaw;
const rice = afcdWhiteRiceUncooked;
const water = afcdTapWater;
// Test-only measured-output profile to exercise nutrient removal; not an AFCD food record.
const drainedCookingLiquid: Ingredient = {
  id: 'drained-liquid', name: 'Measured drained cooking liquid', energy: 0, protein: 0, carbohydrates: 0, sugars: 0,
  fat: 0, saturatedFat: 0, sodium: 200, fibre: 0, servingSize: 100, allergens: [],
};
const recipeVersion: RecipeVersion = {
  id: 'recipe-v1', recipeId: 'meal-prep', name: 'Chicken and rice meal', version: 1,
  ingredients: [{ ingredient: chicken, quantity: 400 }, { ingredient: rice, quantity: 200 }],
  servings: 2, createdAt: '2026-11-12T00:00:00.000Z',
};
const baseInput: BatchCalculationInput = {
  recipeVersion,
  scaleFactor: 1,
  additions: [{ ingredient: water, quantity: 400 }],
  discardedMaterials: [{ ingredient: drainedCookingLiquid, quantity: 50 }],
  cookedBatchWeightGrams: 850,
  portionWeightGrams: 400,
};

describe('calculateBatchNutrition', () => {
  it('uses measured cooked yield rather than treating raw input weight as finished food', () => {
    const result = calculateBatchNutrition(baseInput);

    expect(result.isValid).toBe(true);
    expect(result.rawIngredientWeightGrams).toBe(600);
    expect(result.addedMaterialWeightGrams).toBe(400);
    expect(result.totalInputWeightGrams).toBe(1000);
    expect(result.cookedBatchWeightGrams).toBe(850);
    expect(result.cookingWeightLossGrams).toBe(150);
    expect(result.discardedMaterialWeightGrams).toBe(50);
    expect(result.finalFinishedWeightGrams).toBe(800);
    expect(result.portions).toBe(2);
    expect(result.remainderWeightGrams).toBe(0);
  });

  it('subtracts declared drained nutrients and calculates per 100 g and per portion of finished food', () => {
    const result = calculateBatchNutrition(baseInput);

    expect(result.totalNutrients.energy).toBe(4492);
    expect(result.totalNutrients.protein).toBe(104);
    expect(result.totalNutrients.carbohydrates).toBe(148);
    expect(result.totalNutrients.saturatedFat).toBeCloseTo(1.34);
    expect(result.totalNutrients.sodium).toBe(106);
    expect(result.per100g.energy).toBe(561.5);
    expect(result.per100g.protein).toBe(13);
    expect(result.per100g.sodium).toBe(13.25);
    expect(result.perServing.energy).toBe(2246);
    expect(result.perServing.protein).toBe(52);
    expect(result.perServing.sodium).toBe(53);
  });

  it('scales recipe ingredients, additions, and discarded material together', () => {
    const result = calculateBatchNutrition({ ...baseInput, scaleFactor: 2, cookedBatchWeightGrams: 1700 });

    expect(result.isValid).toBe(true);
    expect(result.rawIngredientWeightGrams).toBe(1200);
    expect(result.addedMaterialWeightGrams).toBe(800);
    expect(result.totalInputWeightGrams).toBe(2000);
    expect(result.cookingWeightLossGrams).toBe(300);
    expect(result.finalFinishedWeightGrams).toBe(1600);
    expect(result.portions).toBe(4);
    expect(result.per100g).toEqual(calculateBatchNutrition(baseInput).per100g);
    expect(result.perServing).toEqual(calculateBatchNutrition(baseInput).perServing);
  });

  it('reports net cooking weight gain instead of assuming loss when measured cooked yield is higher', () => {
    const result = calculateBatchNutrition({ ...baseInput, cookedBatchWeightGrams: 1100 });

    expect(result.isValid).toBe(true);
    expect(result.cookingWeightLossGrams).toBe(0);
    expect(result.cookingWeightGainGrams).toBe(100);
    expect(result.finalFinishedWeightGrams).toBe(1050);
  });

  it('rejects zero or non-finite cooked and portion weights', () => {
    const zeroCooked = calculateBatchNutrition({ ...baseInput, cookedBatchWeightGrams: 0 });
    const infinitePortion = calculateBatchNutrition({ ...baseInput, portionWeightGrams: Number.POSITIVE_INFINITY });

    expect(zeroCooked.isValid).toBe(false);
    expect(zeroCooked.issues.some((issue) => issue.code === 'invalid_cooked_weight')).toBe(true);
    expect(infinitePortion.isValid).toBe(false);
    expect(infinitePortion.issues.some((issue) => issue.code === 'invalid_portion_weight')).toBe(true);
    expect(Object.values(infinitePortion.per100g).every(Number.isFinite)).toBe(true);
  });

  it('rejects a discard heavier than the cooked batch and negative retained nutrients', () => {
    const discardTooHeavy = calculateBatchNutrition({
      ...baseInput,
      discardedMaterials: [{ ingredient: water, quantity: 900 }],
    });
    const nutrientOverdraw = calculateBatchNutrition({
      ...baseInput,
      discardedMaterials: [{ ingredient: { ...drainedCookingLiquid, sodium: 1000 }, quantity: 100 }],
    });

    expect(discardTooHeavy.isValid).toBe(false);
    expect(discardTooHeavy.issues.some((issue) => issue.code === 'discard_exceeds_cooked_weight')).toBe(true);
    expect(nutrientOverdraw.isValid).toBe(false);
    expect(nutrientOverdraw.issues.some((issue) => issue.code === 'discard_nutrients_exceed_input')).toBe(true);
  });

  it('rejects invalid scale, recipe, final yield and portion-count scenarios', () => {
    const zeroScale = calculateBatchNutrition({ ...baseInput, scaleFactor: 0 });
    const emptyRecipe = calculateBatchNutrition({ ...baseInput, recipeVersion: { ...recipeVersion, ingredients: [] } });
    const tooSmall = calculateBatchNutrition({ ...baseInput, portionWeightGrams: 900 });

    expect(zeroScale.isValid).toBe(false);
    expect(zeroScale.issues.some((issue) => issue.code === 'invalid_batch_scale')).toBe(true);
    expect(emptyRecipe.isValid).toBe(false);
    expect(emptyRecipe.issues.some((issue) => issue.code === 'empty_batch_recipe')).toBe(true);
    expect(tooSmall.isValid).toBe(false);
    expect(tooSmall.issues.some((issue) => issue.code === 'zero_portions')).toBe(true);
  });

  it('rejects missing ingredient nutrient data and keeps failed output finite', () => {
    const missingNutrient = { ...chicken, fibre: undefined } as unknown as Ingredient;
    const result = calculateBatchNutrition({
      ...baseInput,
      recipeVersion: { ...recipeVersion, ingredients: [{ ingredient: missingNutrient, quantity: 400 }] },
      additions: [],
      discardedMaterials: [],
      cookedBatchWeightGrams: 350,
    });

    expect(result.isValid).toBe(false);
    expect(result.issues.some((issue) => issue.code.includes('missing_nutrient'))).toBe(true);
    expect(Object.values(result.totalNutrients).every(Number.isFinite)).toBe(true);
    expect(Object.values(result.per100g).every(Number.isFinite)).toBe(true);
  });
});
