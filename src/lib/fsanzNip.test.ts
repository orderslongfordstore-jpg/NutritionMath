import { describe, expect, it } from 'vitest';
import { calculateDraftNip, formatNipNutrient } from './fsanzNip';
import type { NutrientValues } from '../types';

const afcdMealTotals: NutrientValues = {
  energy: 4492,
  protein: 104,
  carbohydrates: 148,
  sugars: 0,
  fat: 5,
  saturatedFat: 1.34,
  sodium: 206,
  fibre: 1.6,
};

const mealInput = {
  totalNutrients: afcdMealTotals,
  finalFinishedWeightGrams: 850,
  servingWeightGrams: 400,
  servingsPerPackage: 2,
  includeDietaryFibre: false,
};

describe('calculateDraftNip', () => {
  it('uses full-precision batch totals for the serving and per-100-g quantities', () => {
    const result = calculateDraftNip(mealInput);

    expect(result.isValid).toBe(true);
    expect(result.servingSizeText).toBe('400');
    expect(result.servingsPerPackageText).toBe('2');
    expect(result.rows.map((row) => row.key)).toEqual([
      'energy', 'protein', 'fat', 'saturatedFat', 'carbohydrates', 'sugars', 'sodium',
    ]);
    expect(result.rows[0]).toMatchObject({
      key: 'energy',
      label: 'Energy',
      unit: 'kJ',
      perServing: 4492 / 850 * 400,
      per100g: 4492 / 850 * 100,
      perServingText: '2,110',
      per100gText: '528',
    });
    expect(result.rows[1]).toMatchObject({
      key: 'protein', unit: 'g', perServingText: '48.9', per100gText: '12.2',
    });
    expect(result.rows[6]).toMatchObject({
      key: 'sodium', unit: 'mg', perServingText: '96.9', per100gText: '24.2',
    });
  });

  it('does not show dietary fibre in the ordinary panel unless the user marks it applicable', () => {
    const withoutFibre = calculateDraftNip(mealInput);
    const withFibre = calculateDraftNip({ ...mealInput, includeDietaryFibre: true });

    expect(withoutFibre.rows.some((row) => row.key === 'fibre')).toBe(false);
    expect(withFibre.rows[withFibre.rows.length - 1]).toMatchObject({
      key: 'fibre', label: 'Dietary fibre', unit: 'g', perServingText: '0.753', per100gText: '0.188',
    });
  });

  it('requires explicit usable values for every displayed nutrient and a valid finished yield and serving', () => {
    const missingRequired = calculateDraftNip({
      ...mealInput,
      totalNutrients: { ...afcdMealTotals, sodium: undefined },
    });
    const missingRequiredFibre = calculateDraftNip({
      ...mealInput,
      totalNutrients: { ...afcdMealTotals, fibre: undefined },
      includeDietaryFibre: true,
    });
    const invalidWeights = calculateDraftNip({
      ...mealInput,
      finalFinishedWeightGrams: 0,
      servingWeightGrams: Number.POSITIVE_INFINITY,
      servingsPerPackage: 0,
    });

    expect(missingRequired.isValid).toBe(false);
    expect(missingRequired.issues.some((issue) => issue.includes('Sodium'))).toBe(true);
    expect(missingRequiredFibre.isValid).toBe(false);
    expect(missingRequiredFibre.issues.some((issue) => issue.includes('Dietary fibre'))).toBe(true);
    expect(invalidWeights.isValid).toBe(false);
    expect(invalidWeights.rows).toHaveLength(0);
  });

  it('displays no more than three significant figures and keeps invalid display values blank', () => {
    expect(formatNipNutrient(1422)).toBe('1,420');
    expect(formatNipNutrient(0.123456)).toBe('0.123');
    expect(formatNipNutrient(0)).toBe('0');
    expect(formatNipNutrient(Number.NaN)).toBe('');
    expect(formatNipNutrient(-1)).toBe('');
  });
});
