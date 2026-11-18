import { describe, expect, it } from 'vitest';
import type { BatchRecord, BatchNutritionSummary, NutrientValues } from '../types';
import { calculateMealAssembly } from './mealAssembly';

const emptyNutrients = (): NutrientValues => ({
  energy: 0, protein: 0, carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, sodium: 0, fibre: 0,
});

function batch(id: string, name: string, batchCode: string, finishedWeight: number, totals: NutrientValues): BatchRecord {
  const per100g = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, (value / finishedWeight) * 100])) as NutrientValues;
  const perServing = Object.fromEntries(Object.entries(totals).map(([key, value]) => [key, value / 5])) as NutrientValues;
  const calculation: BatchNutritionSummary = {
    rawIngredientWeightGrams: finishedWeight,
    addedMaterialWeightGrams: 0,
    totalInputWeightGrams: finishedWeight,
    cookedBatchWeightGrams: finishedWeight,
    cookingWeightLossGrams: 0,
    cookingWeightGainGrams: 0,
    discardedMaterialWeightGrams: 0,
    finalFinishedWeightGrams: finishedWeight,
    portionWeightGrams: finishedWeight / 5,
    portions: 5,
    remainderWeightGrams: 0,
    totalNutrients: totals,
    per100g,
    perServing,
    isValid: true,
    issues: [],
  };
  return {
    id, recipeId: `recipe-${id}`, recipeVersionId: `version-${id}`, recipeName: name, recipeVersion: 1,
    batchCode, recordedAt: '2026-11-13T00:00:00.000Z', scaleFactor: 1,
    retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
    retentionSource: 'Test fixture only.', recipeIngredients: [], additions: [], discardedMaterials: [],
    cookedBatchWeightGrams: finishedWeight, portionWeightGrams: finishedWeight / 5, calculation,
  };
}

const curry = batch('curry', 'Curry sausages', 'CUR-01', 2000, {
  energy: 20000, protein: 1000, carbohydrates: 400, sugars: 200, fat: 800, saturatedFat: 300, sodium: 6000, fibre: 100,
});
const mash = batch('mash', 'Mashed potato', 'MASH-01', 1600, {
  energy: 12800, protein: 640, carbohydrates: 2400, sugars: 160, fat: 160, saturatedFat: 80, sodium: 3200, fibre: 320,
});

// Independent arithmetic: curry 2,000/400 = 5 meals; mash 1,600/200 = 8,
// so curry limits output to 5. Per meal: 10,000/2,000*400 = 4,000 kJ
// plus 12,800/1,600*200 = 1,600 kJ; total 5,600 kJ per 600 g meal.
describe('calculateMealAssembly', () => {
  it('combines exact curry and mash plated weights and uses the limiting component yield', () => {
    const result = calculateMealAssembly([
      { batchRecordId: 'curry', portionWeightGrams: 400 },
      { batchRecordId: 'mash', portionWeightGrams: 200 },
    ], [curry, mash]);

    expect(result.isValid).toBe(true);
    expect(result.servingWeightGrams).toBe(600);
    expect(result.portions).toBe(5);
    expect(result.finishedMealWeightGrams).toBe(3000);
    expect(result.perServing.energy).toBe(5600);
    expect(result.perServing.protein).toBe(280);
    expect(result.per100g.energy).toBe(933.33);
    expect(result.totalNutrients.energy).toBe(28000);
    expect(result.componentAllocations.map((item) => item.weightUsedGrams)).toEqual([2000, 1000]);
    expect(result.componentAllocations.map((item) => item.weightLeftoverGrams)).toEqual([0, 600]);
  });

  it('preserves distinct batch identities and records per-component contribution', () => {
    const result = calculateMealAssembly([
      { batchRecordId: 'curry', portionWeightGrams: 400 },
      { batchRecordId: 'mash', portionWeightGrams: 200 },
    ], [curry, mash]);

    expect(result.componentAllocations.map((item) => [item.componentName, item.componentBatchCode])).toEqual([
      ['Curry sausages', 'CUR-01'], ['Mashed potato', 'MASH-01'],
    ]);
    expect(result.componentAllocations[0]?.perPortionNutrients.energy).toBe(4000);
    expect(result.componentAllocations[1]?.perPortionNutrients.energy).toBe(1600);
  });

  it('rejects a missing selected component batch', () => {
    const result = calculateMealAssembly([
      { batchRecordId: 'curry', portionWeightGrams: 400 },
      { batchRecordId: 'missing', portionWeightGrams: 200 },
    ], [curry]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((item) => item.code === 'meal_component_batch_missing')).toBe(true);
  });

  it('rejects one-component assemblies and duplicate batch selection', () => {
    expect(calculateMealAssembly([{ batchRecordId: 'curry', portionWeightGrams: 400 }], [curry]).isValid).toBe(false);
    const duplicate = calculateMealAssembly([
      { batchRecordId: 'curry', portionWeightGrams: 400 },
      { batchRecordId: 'curry', portionWeightGrams: 200 },
    ], [curry]);
    expect(duplicate.isValid).toBe(false);
    expect(duplicate.issues.some((item) => item.code === 'meal_component_duplicate')).toBe(true);
  });

  it('rejects zero, negative and non-finite component weights', () => {
    for (const portionWeightGrams of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      const result = calculateMealAssembly([
        { batchRecordId: 'curry', portionWeightGrams: 400 },
        { batchRecordId: 'mash', portionWeightGrams },
      ], [curry, mash]);
      expect(result.isValid).toBe(false);
    }
  });

  it('rejects a component batch without one complete serving', () => {
    const result = calculateMealAssembly([
      { batchRecordId: 'curry', portionWeightGrams: 400 },
      { batchRecordId: 'mash', portionWeightGrams: 2000 },
    ], [curry, mash]);
    expect(result.isValid).toBe(false);
    expect(result.issues.some((item) => item.code === 'meal_component_insufficient_yield')).toBe(true);
  });
});
