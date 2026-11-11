import { describe, expect, it } from 'vitest';
import { calculateIngredientNutrition, calculateRecipeTotals } from '../lib/nutrition';

const sampleIngredient = {
  id: 'test-ingredient',
  name: 'Test ingredient',
  energy: 1000,
  protein: 10,
  carbohydrates: 20,
  sugars: 5,
  fat: 4,
  saturatedFat: 1,
  sodium: 100,
  fibre: 3,
  servingSize: 50,
  allergens: [],
};

describe('nutrition calculation regression checks', () => {
  it('scales ingredient nutrients by grams', () => {
    expect(calculateIngredientNutrition(sampleIngredient, 50)).toEqual({
      energy: 500,
      protein: 5,
      carbohydrates: 10,
      sugars: 2.5,
      fat: 2,
      saturatedFat: 0.5,
      sodium: 50,
      fibre: 1.5,
    });
  });

  it('returns zero nutrient values for an empty recipe', () => {
    const result = calculateRecipeTotals([]);
    expect(result.totalWeight).toBe(0);
    expect(result.per100g.energy).toBe(0);
    expect(result.perServing.protein).toBe(0);
  });
});
