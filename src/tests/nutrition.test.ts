import { describe, expect, it } from 'vitest';
import {
  calculateIngredientNutrition,
  calculateRecipeTotals,
  roundToTwo,
} from '../lib/nutrition';
import type { Ingredient } from '../types';

const oats: Ingredient = {
  id: 'oats', name: 'Oats', energy: 1500, protein: 12, carbohydrates: 65,
  sugars: 2, fat: 8, saturatedFat: 1.5, sodium: 10, fibre: 9,
  servingSize: 50, allergens: [],
};
const milk: Ingredient = {
  id: 'milk', name: 'Milk', energy: 250, protein: 3.5, carbohydrates: 5,
  sugars: 5, fat: 1, saturatedFat: 0.5, sodium: 40, fibre: 0,
  servingSize: 100, allergens: ['Milk'],
};

describe('nutrition calculations', () => {
  it('scales ingredient nutrients and energy according to grams', () => {
    expect(calculateIngredientNutrition(oats, 50)).toEqual({
      energy: 750, protein: 6, carbohydrates: 32.5, sugars: 1,
      fat: 4, saturatedFat: 0.75, sodium: 5, fibre: 4.5,
    });
  });

  it('calculates total weight and exact nutrient totals for a recipe', () => {
    const result = calculateRecipeTotals([
      { ingredient: oats, quantity: 200 },
      { ingredient: milk, quantity: 100 },
    ], 2);
    expect(result.totalWeight).toBe(300);
    expect(result.totalEnergy).toBe(3250);
    expect(result.totalProtein).toBe(27.5);
  });

  it('calculates nutrition per 100 g using weighted ingredient amounts', () => {
    const result = calculateRecipeTotals([
      { ingredient: oats, quantity: 200 },
      { ingredient: milk, quantity: 100 },
    ], 2);
    expect(result.per100g.energy).toBeCloseTo(1083.33, 2);
    expect(result.per100g.protein).toBeCloseTo(9.17, 2);
    expect(result.per100g.sodium).toBe(20);
  });

  it('calculates nutrition per serving', () => {
    const result = calculateRecipeTotals([
      { ingredient: oats, quantity: 200 },
      { ingredient: milk, quantity: 100 },
    ], 2);
    expect(result.perServing.energy).toBe(1625);
    expect(result.perServing.protein).toBe(13.75);
    expect(result.perServing.carbohydrates).toBe(67.5);
  });

  it('scales all nutrients correctly for a doubled batch', () => {
    const oneBatch = calculateRecipeTotals([{ ingredient: oats, quantity: 100 }], 1);
    const doubleBatch = calculateRecipeTotals([{ ingredient: oats, quantity: 200 }], 1);
    expect(doubleBatch.totalWeight).toBe(oneBatch.totalWeight * 2);
    expect(doubleBatch.totalEnergy).toBe(oneBatch.totalEnergy * 2);
    expect(doubleBatch.totalProtein).toBe(oneBatch.totalProtein * 2);
    expect(doubleBatch.per100g.energy).toBe(oneBatch.per100g.energy);
  });

  it('returns zero nutrient densities for a zero-weight recipe', () => {
    const result = calculateRecipeTotals([]);
    expect(result.totalWeight).toBe(0);
    expect(result.per100g.energy).toBe(0);
    expect(result.per100g.protein).toBe(0);
  });

  it('handles negative, NaN and infinite input quantities safely', () => {
    for (const invalidQuantity of [-10, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
      const result = calculateIngredientNutrition(oats, invalidQuantity);
      expect(Object.values(result).every(Number.isFinite)).toBe(true);
      expect(result.energy).toBe(0);
    }
  });

  it('prevents invalid recipe quantities from contaminating totals', () => {
    const result = calculateRecipeTotals([
      { ingredient: oats, quantity: 100 },
      { ingredient: milk, quantity: Number.POSITIVE_INFINITY },
      { ingredient: milk, quantity: Number.NaN },
      { ingredient: milk, quantity: -25 },
    ]);
    expect(result.totalWeight).toBe(100);
    expect(result.totalEnergy).toBe(1500);
    expect(Object.values(result.per100g).every(Number.isFinite)).toBe(true);
  });

  it('treats negative, NaN and infinite nutrient values as zero', () => {
    const invalidNutrients = {
      energy: Number.POSITIVE_INFINITY,
      protein: Number.NaN,
      carbohydrates: -1,
      sugars: Number.NEGATIVE_INFINITY,
      fat: 4,
      saturatedFat: 1,
      sodium: 20,
      fibre: 2,
    };
    expect(calculateIngredientNutrition(invalidNutrients, 100)).toEqual({
      energy: 0, protein: 0, carbohydrates: 0, sugars: 0,
      fat: 4, saturatedFat: 1, sodium: 20, fibre: 2,
    });
  });

  it('prevents overflow from invalidly large nutrient values', () => {
    const result = calculateIngredientNutrition({
      energy: Number.MAX_VALUE, protein: 1, carbohydrates: 1, sugars: 1,
      fat: 1, saturatedFat: 1, sodium: 1, fibre: 1,
    }, Number.MAX_VALUE);
    expect(result.energy).toBe(0);
    expect(Object.values(result).every(Number.isFinite)).toBe(true);
  });

  it('uses a safe serving count for zero servings', () => {
    expect(calculateRecipeTotals([{ ingredient: oats, quantity: 100 }], 0).perServing.energy).toBe(1500);
  });

  it('rounds nutrient values to two decimal places and handles non-finite values', () => {
    expect(roundToTwo(7.456)).toBe(7.46);
    expect(roundToTwo(12.004)).toBe(12);
    expect(roundToTwo(Number.POSITIVE_INFINITY)).toBe(0);
    expect(roundToTwo(Number.NaN)).toBe(0);
  });
});
