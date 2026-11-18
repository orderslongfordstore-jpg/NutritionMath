import { calculateBatchNutrition } from './batchNutrition';
import { calculateMealAssembly } from './mealAssembly';
import type {
  BatchCalculationInput,
  BatchRecord,
  MealAssemblyInput,
  MealAssemblyRecord,
  RecipeIngredient,
  RecipeVersion,
  SavedRecipe,
} from '../types';

export interface SaveRecipeVersionInput {
  name: string;
  ingredients: RecipeIngredient[];
  servings: number;
  recipeId?: string;
}

export interface CreateBatchRecordInput extends Omit<BatchCalculationInput, 'recipeVersion'> {
  recipeVersionId: string;
  batchCode: string;
}

/**
 * Async repository boundary for a future authenticated storage adapter.
 * Implementations must preserve recipe-version IDs on batches and enforce
 * ownership remotely. No remote adapter or authorization assumption is made here.
 */
export interface NutritionRepository {
  listRecipes(): Promise<SavedRecipe[]>;
  saveRecipeVersion(input: SaveRecipeVersionInput): Promise<RecipeVersion>;
  getRecipeVersion(id: string): Promise<RecipeVersion | null>;
  listBatches(recipeVersionId?: string): Promise<BatchRecord[]>;
  createBatch(input: CreateBatchRecordInput): Promise<BatchRecord>;
  listMealAssemblies(): Promise<MealAssemblyRecord[]>;
  createMealAssembly(input: MealAssemblyInput): Promise<MealAssemblyRecord>;
}

function createId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function cloneRecipeIngredient(line: RecipeIngredient): RecipeIngredient {
  return { ...line, ingredient: { ...line.ingredient, allergens: [...line.ingredient.allergens] } };
}

function cloneRecipeVersion(version: RecipeVersion): RecipeVersion {
  return { ...version, ingredients: version.ingredients.map(cloneRecipeIngredient) };
}

function cloneBatch(batch: BatchRecord): BatchRecord {
  return {
    ...batch,
    retentionFactors: { ...batch.retentionFactors },
    recipeIngredients: batch.recipeIngredients.map(cloneRecipeIngredient),
    additions: batch.additions.map(cloneRecipeIngredient),
    discardedMaterials: batch.discardedMaterials.map(cloneRecipeIngredient),
    calculation: {
      ...batch.calculation,
      totalNutrients: { ...batch.calculation.totalNutrients },
      per100g: { ...batch.calculation.per100g },
      perServing: { ...batch.calculation.perServing },
      issues: batch.calculation.issues.map((issue) => ({ ...issue })),
    },
  };
}

function cloneMealAssembly(record: MealAssemblyRecord): MealAssemblyRecord {
  return {
    ...record,
    components: record.components.map((component) => ({ ...component })),
    calculation: {
      ...record.calculation,
      componentAllocations: record.calculation.componentAllocations.map((allocation) => ({
        ...allocation,
        perPortionNutrients: { ...allocation.perPortionNutrients },
      })),
      totalNutrients: { ...record.calculation.totalNutrients },
      perServing: { ...record.calculation.perServing },
      per100g: { ...record.calculation.per100g },
      issues: record.calculation.issues.map((entry) => ({ ...entry })),
    },
  };
}

/** Session-only in-memory adapter. Data is lost when its instance/page is discarded. */
export class SessionNutritionRepository implements NutritionRepository {
  private readonly recipes = new Map<string, SavedRecipe>();
  private readonly batches: BatchRecord[] = [];
  private readonly mealAssemblies: MealAssemblyRecord[] = [];

  async listRecipes(): Promise<SavedRecipe[]> {
    return Array.from(this.recipes.values(), (recipe) => ({
      ...recipe,
      versions: recipe.versions.map(cloneRecipeVersion),
    }));
  }

  async saveRecipeVersion(input: SaveRecipeVersionInput): Promise<RecipeVersion> {
    const name = input.name.trim();
    if (!name) throw new Error('Enter a recipe name before saving a version.');
    if (!Array.isArray(input.ingredients) || input.ingredients.length === 0) {
      throw new Error('Add at least one ingredient before saving a recipe version.');
    }
    if (!Number.isSafeInteger(input.servings) || input.servings < 1) {
      throw new Error('Recipe servings must be a positive whole number.');
    }
    for (const [index, line] of input.ingredients.entries()) {
      if (!line?.ingredient || !Number.isFinite(line.quantity) || line.quantity <= 0) {
        throw new Error(`Recipe ingredient ${index + 1} must have a source ingredient and a finite positive quantity.`);
      }
    }

    let recipe = input.recipeId ? this.recipes.get(input.recipeId) : undefined;
    if (input.recipeId && !recipe) throw new Error('The selected recipe is not available in this browser session.');
    if (recipe && recipe.name !== name) throw new Error('Save a renamed recipe as a new recipe, not as a version of a differently named recipe.');
    if (!recipe) {
      recipe = { id: createId('recipe'), name, versions: [] };
      this.recipes.set(recipe.id, recipe);
    }

    const version: RecipeVersion = {
      id: createId('recipe-version'),
      recipeId: recipe.id,
      name: recipe.name,
      version: recipe.versions.length + 1,
      ingredients: input.ingredients.map(cloneRecipeIngredient),
      servings: input.servings,
      createdAt: new Date().toISOString(),
    };
    recipe.versions.push(version);
    return cloneRecipeVersion(version);
  }

  async getRecipeVersion(id: string): Promise<RecipeVersion | null> {
    for (const recipe of this.recipes.values()) {
      const version = recipe.versions.find((entry) => entry.id === id);
      if (version) return cloneRecipeVersion(version);
    }
    return null;
  }

  async listBatches(recipeVersionId?: string): Promise<BatchRecord[]> {
    return this.batches
      .filter((batch) => !recipeVersionId || batch.recipeVersionId === recipeVersionId)
      .map(cloneBatch);
  }

  async createBatch(input: CreateBatchRecordInput): Promise<BatchRecord> {
    const batchCode = input.batchCode.trim();
    if (!batchCode) throw new Error('Enter a batch identification code before saving the batch record.');
    const recipeVersion = await this.getRecipeVersion(input.recipeVersionId);
    if (!recipeVersion) throw new Error('A saved recipe version is required to create a batch record.');

    const calculation = calculateBatchNutrition({ ...input, recipeVersion });
    if (!calculation.isValid) {
      throw new Error(calculation.issues.map((issue) => issue.message).join(' '));
    }
    const record: BatchRecord = {
      id: createId('batch'),
      recipeId: recipeVersion.recipeId,
      recipeVersionId: recipeVersion.id,
      recipeName: recipeVersion.name,
      recipeVersion: recipeVersion.version,
      batchCode,
      recordedAt: new Date().toISOString(),
      scaleFactor: input.scaleFactor,
      retentionFactors: { ...input.retentionFactors },
      retentionSource: input.retentionSource,
      recipeIngredients: recipeVersion.ingredients.map(cloneRecipeIngredient),
      additions: input.additions.map(cloneRecipeIngredient),
      discardedMaterials: input.discardedMaterials.map(cloneRecipeIngredient),
      cookedBatchWeightGrams: input.cookedBatchWeightGrams,
      portionWeightGrams: input.portionWeightGrams,
      calculation,
    };
    this.batches.push(record);
    return cloneBatch(record);
  }

  async listMealAssemblies(): Promise<MealAssemblyRecord[]> {
    return this.mealAssemblies.map(cloneMealAssembly);
  }

  async createMealAssembly(input: MealAssemblyInput): Promise<MealAssemblyRecord> {
    const mealName = input.mealName.trim();
    const batchCode = input.batchCode.trim();
    if (!mealName) throw new Error('Enter a meal name before recording the assembly.');
    if (!batchCode) throw new Error('Enter a meal batch identification code before recording the assembly.');
    const calculation = calculateMealAssembly(input.components, this.batches);
    if (!calculation.isValid) throw new Error(calculation.issues.map((entry) => entry.message).join(' '));
    const record: MealAssemblyRecord = {
      id: createId('meal-assembly'),
      mealName,
      batchCode,
      recordedAt: new Date().toISOString(),
      components: input.components.map((component) => ({ ...component })),
      calculation,
    };
    this.mealAssemblies.push(record);
    return cloneMealAssembly(record);
  }
}
