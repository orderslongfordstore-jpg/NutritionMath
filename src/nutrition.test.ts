import { describe, expect, it } from "vitest";
import { calculateRecipe, type Ingredient } from "../shared/nutrition";

const oats: Ingredient = { id: "oats", name: "Oats", unit: "g", nutrientsPer100: { energyKj: 1500, proteinG: 13 } };
const milk: Ingredient = { id: "milk", name: "Milk", unit: "mL", nutrientsPer100: { energyKj: 250, proteinG: 3.4, fatG: 3.5, saturatedG: 2.3, carbohydrateG: 5, sugarsG: 5, sodiumMg: 40 } };

describe("calculateRecipe", () => {
  it("converts kilograms and calculates per-100g and per-serving values", () => {
    const result = calculateRecipe([{ ingredient: oats, quantity: 1, unit: "kg" }], 800, 8);
    expect(result.batchWeightG).toBe(800);
    expect(result.nutrients.energyKj).toBe(15000);
    expect(result.per100G.energyKj).toBe(1875);
    expect(result.perServing.proteinG).toBeCloseTo(16.25);
  });
  it("marks a result partial when a nutrient is missing, without inventing it", () => {
    const result = calculateRecipe([{ ingredient: oats, quantity: 100, unit: "g" }, { ingredient: milk, quantity: 100, unit: "mL" }], undefined, 2);
    expect(result.completeness).toBe("partial");
    expect(result.nutrients.fatG).toBeCloseTo(3.5);
    expect(result.nutrients.sodiumMg).toBeCloseTo(40);
  });
});
