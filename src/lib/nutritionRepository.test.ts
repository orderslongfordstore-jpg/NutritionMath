import { describe, expect, it } from 'vitest';
import { SessionNutritionRepository } from './nutritionRepository';
import { calculateIngredientNutrition, calculateRecipeTotals } from './nutrition';
import {
  afcdChickenBreastRaw,
  afcdScrambledEggWithMilkPrepared,
  afcdWhiteRiceUncooked,
} from '../test/fixtures/afcdRelease3';
import type { RecipeIngredient } from '../types';

const recipeLines: RecipeIngredient[] = [
  { ingredient: afcdChickenBreastRaw, quantity: 400 },
  { ingredient: afcdWhiteRiceUncooked, quantity: 200 },
];
const testRetention = { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 } as const;
const testRetentionSource = 'Test fixture only: explicit 100% retention factors; not a production recommendation.';

describe('AFCD Release 3 meal calculation fixture', () => {
  it('calculates an ingredient portion from its sourced per-100-g profile', () => {
    expect(calculateIngredientNutrition(afcdChickenBreastRaw, 150)).toEqual({
      energy: 618,
      protein: 33.75,
      carbohydrates: 0,
      sugars: 0,
      fat: 1.2,
      saturatedFat: 0.38,
      sodium: 72,
      fibre: 0,
    });
  });

  it('calculates recipe totals and servings from chicken and uncooked rice AFCD profiles', () => {
    const result = calculateRecipeTotals(recipeLines, 2);

    expect(result.isValid).toBe(true);
    expect(result.totalWeight).toBe(600);
    expect(result.totalEnergy).toBe(4492);
    expect(result.totalProtein).toBe(104);
    expect(result.totalCarbohydrate).toBe(148);
    expect(result.per100g.energy).toBe(748.67);
    expect(result.per100g.protein).toBe(17.33);
    expect(result.perServing.energy).toBe(2246);
    expect(result.perServing.protein).toBe(52);
  });

  it('matches the AFCD prepared scrambled-egg composite profile when modeled as a 100-g reference input', () => {
    const result = calculateRecipeTotals([
      { ingredient: afcdScrambledEggWithMilkPrepared, quantity: 100 },
    ], 1);

    expect(result.isValid).toBe(true);
    expect(result.totalWeight).toBe(100);
    expect(result.per100g).toMatchObject({
      energy: 504,
      protein: 10.8,
      carbohydrates: 2.1,
      sugars: 2,
      fat: 7.7,
      saturatedFat: 2.55,
      sodium: 128,
      fibre: 0,
    });
  });
});

describe('SessionNutritionRepository', () => {
  it('creates immutable named versions and returns cloned snapshots', async () => {
    const repository = new SessionNutritionRepository();
    const first = await repository.saveRecipeVersion({ name: 'Chicken and rice meal', ingredients: recipeLines, servings: 2 });
    const edited = recipeLines.map((line) => ({ ...line, quantity: line.quantity * 1.1 }));
    const second = await repository.saveRecipeVersion({ name: first.name, ingredients: edited, servings: 2, recipeId: first.recipeId });

    expect(first.version).toBe(1);
    expect(second.version).toBe(2);
    expect(second.recipeId).toBe(first.recipeId);
    expect(second.id).not.toBe(first.id);
    second.ingredients[0].ingredient.name = 'mutated outside repository';
    const loadedFirst = await repository.getRecipeVersion(first.id);
    expect(loadedFirst?.ingredients[0].ingredient.name).toBe('Chicken, breast, lean flesh, raw');
    const savedRecipes = await repository.listRecipes();
    expect(savedRecipes).toHaveLength(1);
    expect(savedRecipes[0].versions.map((version) => version.version)).toEqual([1, 2]);
  });

  it('links batch results to the exact saved recipe version used', async () => {
    const repository = new SessionNutritionRepository();
    const recipe = await repository.saveRecipeVersion({ name: 'Chicken and rice meal', ingredients: recipeLines, servings: 2 });
    const batch = await repository.createBatch({
      recipeVersionId: recipe.id,
      batchCode: 'MEAL-2026-11-12-01',
      scaleFactor: 1,
      retentionFactors: { ...testRetention }, retentionSource: testRetentionSource,
      additions: [],
      discardedMaterials: [],
      cookedBatchWeightGrams: 520,
      portionWeightGrams: 260,
    });

    expect(batch.recipeId).toBe(recipe.recipeId);
    expect(batch.recipeVersionId).toBe(recipe.id);
    expect(batch.recipeVersion).toBe(1);
    expect(batch.calculation.rawIngredientWeightGrams).toBe(600);
    expect(batch.calculation.finalFinishedWeightGrams).toBe(520);
    expect((await repository.listBatches(recipe.id)).map((record) => record.id)).toEqual([batch.id]);
    expect(await repository.listBatches('unknown-version')).toEqual([]);
  });

  it('records a combined meal from separate measured curry and mash batches with component leftovers', async () => {
    const repository = new SessionNutritionRepository();
    const curryRecipe = await repository.saveRecipeVersion({ name: 'Curry sausages', ingredients: recipeLines, servings: 2 });
    const mashRecipe = await repository.saveRecipeVersion({
      name: 'Mashed potato', ingredients: [{ ingredient: afcdWhiteRiceUncooked, quantity: 300 }], servings: 2,
    });
    const curryBatch = await repository.createBatch({
      recipeVersionId: curryRecipe.id, batchCode: 'CUR-01', scaleFactor: 1, retentionFactors: { ...testRetention }, retentionSource: testRetentionSource, additions: [], discardedMaterials: [],
      cookedBatchWeightGrams: 800, portionWeightGrams: 400,
    });
    const mashBatch = await repository.createBatch({
      recipeVersionId: mashRecipe.id, batchCode: 'MASH-01', scaleFactor: 1, retentionFactors: { ...testRetention }, retentionSource: testRetentionSource, additions: [], discardedMaterials: [],
      cookedBatchWeightGrams: 500, portionWeightGrams: 200,
    });

    const meal = await repository.createMealAssembly({
      mealName: 'Curry sausages and mash', batchCode: 'MEAL-01',
      components: [
        { batchRecordId: curryBatch.id, portionWeightGrams: 400 },
        { batchRecordId: mashBatch.id, portionWeightGrams: 200 },
      ],
    });

    expect(meal.calculation.isValid).toBe(true);
    expect(meal.calculation.servingWeightGrams).toBe(600);
    expect(meal.calculation.portions).toBe(2);
    expect(meal.calculation.finishedMealWeightGrams).toBe(1200);
    expect(meal.calculation.componentAllocations.map((component) => component.weightLeftoverGrams)).toEqual([0, 100]);
    meal.components[0].portionWeightGrams = 1;
    expect((await repository.listMealAssemblies())[0].components[0].portionWeightGrams).toBe(400);
  });

  it('rejects empty names, invalid servings, unknown versions and invalid batch math', async () => {
    const repository = new SessionNutritionRepository();
    await expect(repository.saveRecipeVersion({ name: ' ', ingredients: recipeLines, servings: 2 })).rejects.toThrow('Enter a recipe name');
    await expect(repository.saveRecipeVersion({ name: 'Dish', ingredients: recipeLines, servings: 0 })).rejects.toThrow('positive whole number');
    const recipe = await repository.saveRecipeVersion({ name: 'Dish', ingredients: recipeLines, servings: 2 });
    await expect(repository.createBatch({
      recipeVersionId: 'missing', batchCode: 'B-1', scaleFactor: 1, additions: [], discardedMaterials: [],
      retentionFactors: { ...testRetention }, retentionSource: testRetentionSource,
      cookedBatchWeightGrams: 500, portionWeightGrams: 250,
    })).rejects.toThrow('saved recipe version');
    await expect(repository.createBatch({
      recipeVersionId: recipe.id, batchCode: 'B-1', scaleFactor: 1, additions: [], discardedMaterials: [],
      retentionFactors: { ...testRetention }, retentionSource: testRetentionSource,
      cookedBatchWeightGrams: 0, portionWeightGrams: 250,
    })).rejects.toThrow('Measured cooked batch weight');
    expect(await repository.listBatches()).toHaveLength(0);
  });
});
