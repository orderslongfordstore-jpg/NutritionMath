import { describe, expect, it } from 'vitest';
import { calculateIngredientNutrition, calculateNipPanel, calculateRecipeTotals, roundToTwo } from '../lib/nutrition';

describe('Nutrition calculations', () => {
  it('calculates nutrient values for a partial ingredient quantity', () => {
    const result = calculateIngredientNutrition(
      {
        energy: 2000,
        protein: 20,
        carbohydrates: 50,
        sugars: 12,
        fat: 10,
        saturatedFat: 4,
        sodium: 300,
        fibre: 8,
      },
      250,
    );

    expect(result.energy).toBe(5000);
    expect(result.protein).toBe(50);
    expect(result.carbohydrates).toBe(125);
    expect(result.sugars).toBe(30);
    expect(result.fat).toBe(25);
    expect(result.saturatedFat).toBe(10);
    expect(result.sodium).toBe(750);
    expect(result.fibre).toBe(20);
  });

  it('calculates total recipe weight and per-100g values', () => {
    const recipe = [
      {
        ingredient: {
          id: 'ing-1',
          name: 'Oats',
          energy: 1500,
          protein: 12,
          carbohydrates: 65,
          sugars: 2,
          fat: 8,
          saturatedFat: 1.5,
          sodium: 10,
          fibre: 9,
          servingSize: 50,
          allergens: [],
        },
        quantity: 200,
      },
      {
        ingredient: {
          id: 'ing-2',
          name: 'Milk',
          energy: 250,
          protein: 3.5,
          carbohydrates: 5,
          sugars: 5,
          fat: 1,
          saturatedFat: 0.5,
          sodium: 40,
          fibre: 0,
          servingSize: 100,
          allergens: ['Milk'],
        },
        quantity: 100,
      },
    ];

    const results = calculateRecipeTotals(recipe, 2);

    expect(results.totalWeight).toBe(300);
    expect(results.totalEnergy).toBeGreaterThan(0);
    expect(results.per100g.energy).toBeGreaterThan(0);
    expect(results.perServing.energy).toBeGreaterThan(0);
  });

  it('calculates correct serving values for two portions', () => {
    const result = calculateRecipeTotals(
      [
        {
          ingredient: {
            id: 'a',
            name: 'Apple',
            energy: 200,
            protein: 0.5,
            carbohydrates: 14,
            sugars: 10,
            fat: 0.2,
            saturatedFat: 0,
            sodium: 1,
            fibre: 2.4,
            servingSize: 100,
            allergens: [],
          },
          quantity: 200,
        },
      ],
      2,
    );

    expect(result.perServing.energy).toBe(200);
    expect(result.perServing.protein).toBe(0.5);
    expect(result.perServing.carbohydrates).toBe(14);
  });

  it('handles zero and invalid input without crashing', () => {
    expect(calculateRecipeTotals([], 0).totalWeight).toBe(0);
    expect(calculateIngredientNutrition({
      energy: 0,
      protein: 0,
      carbohydrates: 0,
      sugars: 0,
      fat: 0,
      saturatedFat: 0,
      sodium: 0,
      fibre: 0,
    }, -50)).toEqual({
      energy: 0,
      protein: 0,
      carbohydrates: 0,
      sugars: 0,
      fat: 0,
      saturatedFat: 0,
      sodium: 0,
      fibre: 0,
    });
  });

  it('rounds nutrient values to two decimal places', () => {
    expect(roundToTwo(7.456)).toBe(7.46);
    expect(roundToTwo(12.004)).toBe(12);
  });

  it('builds a valid FSANZ nutrition panel summary', () => {
    const panel = calculateNipPanel({
      energy: 1450,
      protein: 20,
      carbohydrates: 38,
      sugars: 9,
      fat: 16,
      saturatedFat: 6,
      sodium: 280,
      fibre: 7,
    });

    expect(panel.energyPer100g).toBe(1450);
    expect(panel.proteinPer100g).toBe(20);
    expect(panel.carbohydratePer100g).toBe(38);
    expect(panel.sodiumPer100g).toBe(280);
    expect(panel.fatPer100g).toBe(16);
  });
});
