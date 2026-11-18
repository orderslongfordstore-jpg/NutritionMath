import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { calculateBatchNutrition } from '../lib/batchNutrition';
import { calculateMealAssembly } from '../lib/mealAssembly';
import { afcdChickenBreastRaw, afcdTapWater, afcdWhiteRiceUncooked } from '../test/fixtures/afcdRelease3';
import type { BatchRecord, MealAssemblyRecord, RecipeVersion } from '../types';
import { createEmptyFoodLabelDraft, LabelBuilder, type FoodLabelDraft } from './LabelBuilder';

const recipeVersion: RecipeVersion = {
  id: 'recipe-v1',
  recipeId: 'recipe-1',
  name: 'Chicken and rice meal',
  version: 1,
  ingredients: [
    { ingredient: afcdChickenBreastRaw, quantity: 400 },
    { ingredient: afcdWhiteRiceUncooked, quantity: 200 },
  ],
  servings: 2,
  createdAt: '2026-11-12T00:00:00.000Z',
};

const calculation = calculateBatchNutrition({
  recipeVersion,
  scaleFactor: 1,
  retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
  retentionSource: 'Test fixture only: explicit 100% retention factors; not a production recommendation.',
  additions: [{ ingredient: afcdTapWater, quantity: 400 }],
  discardedMaterials: [],
  cookedBatchWeightGrams: 850,
  portionWeightGrams: 400,
});

const batch: BatchRecord = {
  id: 'batch-1',
  recipeId: recipeVersion.recipeId,
  recipeVersionId: recipeVersion.id,
  recipeName: recipeVersion.name,
  recipeVersion: recipeVersion.version,
  batchCode: 'MEAL-001',
  recordedAt: '2026-11-12T00:00:00.000Z',
  scaleFactor: 1,
  retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
  retentionSource: 'Test fixture only: explicit 100% retention factors; not a production recommendation.',
  recipeIngredients: recipeVersion.ingredients,
  additions: [{ ingredient: afcdTapWater, quantity: 400 }],
  discardedMaterials: [],
  cookedBatchWeightGrams: 850,
  portionWeightGrams: 400,
  calculation,
};

const mashRecipe: RecipeVersion = { ...recipeVersion, id: 'mash-v1', recipeId: 'mash-1', name: 'Mashed potato', ingredients: [{ ingredient: afcdWhiteRiceUncooked, quantity: 300 }] };
const mashCalculation = calculateBatchNutrition({
  recipeVersion: mashRecipe, scaleFactor: 1,
  retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
  retentionSource: 'Test fixture only: explicit 100% retention factors; not a production recommendation.',
  additions: [], discardedMaterials: [], cookedBatchWeightGrams: 500, portionWeightGrams: 200,
});
const mashBatch: BatchRecord = {
  id: 'mash-1', recipeId: mashRecipe.recipeId, recipeVersionId: mashRecipe.id, recipeName: mashRecipe.name, recipeVersion: 1,
  batchCode: 'MASH-01', recordedAt: '2026-11-12T00:00:00.000Z', scaleFactor: 1,
  retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
  retentionSource: 'Test fixture only: explicit 100% retention factors; not a production recommendation.',
  recipeIngredients: mashRecipe.ingredients, additions: [], discardedMaterials: [], cookedBatchWeightGrams: 500, portionWeightGrams: 200, calculation: mashCalculation,
};
const curryMashMeal: MealAssemblyRecord = {
  id: 'meal-1', mealName: 'Curry sausages and mash', batchCode: 'MEAL-01', recordedAt: '2026-11-12T00:00:00.000Z',
  components: [{ batchRecordId: batch.id, portionWeightGrams: 400 }, { batchRecordId: mashBatch.id, portionWeightGrams: 200 }],
  calculation: calculateMealAssembly([
    { batchRecordId: batch.id, portionWeightGrams: 400 }, { batchRecordId: mashBatch.id, portionWeightGrams: 200 },
  ], [batch, mashBatch]),
};

function LabelHarness({ onPrintDraft = vi.fn(), onExportPdf = vi.fn(), onExportXlsx = vi.fn() }: { onPrintDraft?: () => void; onExportPdf?: () => void; onExportXlsx?: () => void }) {
  const [draft, setDraft] = useState<FoodLabelDraft>(() => ({
    ...createEmptyFoodLabelDraft(),
    productName: 'Chicken and rice meal',
    supplierBusinessName: 'Example Food Business',
    supplierBusinessAddress: '1 Test Road, Sydney NSW 2000',
    productionDate: '2026-11-18',
    batchRecordId: `batch:${batch.id}`,
    ingredientsDeclaration: 'Chicken, rice, water.',
    containsDeclaration: 'Allergen declaration reviewed for the product.',
    storageInstructions: 'Keep refrigerated.',
    dateMarkText: '12/11/2026',
    servingsPerPackage: '1',
  }));
  return <LabelBuilder batches={[batch]} mealAssemblies={[]} draft={draft} onDraftChange={setDraft} onPrintDraft={onPrintDraft} onExportPdf={onExportPdf} onExportXlsx={onExportXlsx} exporting={false} />;
}

describe('LabelBuilder', () => {
  it('shows a batch-linked Australian-style draft NIP and keeps the output visibly unapproved', () => {
    render(<LabelHarness />);

    expect(screen.getByText('DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE')).toBeInTheDocument();
    expect(screen.getByText('NUTRITION INFORMATION')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /average quantity per serving/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /average quantity per 100 g/i })).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Energy \(kJ\).*2,110.*528/ })).toBeInTheDocument();
    expect(screen.getByText('Ingredients:')).toBeInTheDocument();
    expect(screen.getByText(/Example Food Business/)).toBeInTheDocument();
    expect(screen.getByText('Production date:')).toBeInTheDocument();
    expect(screen.getByText('2026-11-18')).toBeInTheDocument();
    expect(screen.queryByText('Dietary fibre (g)')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Print draft for review' })).toBeDisabled();
  });

  it('requires all product-specific checks before printing a review draft', () => {
    const onPrintDraft = vi.fn();
    render(<LabelHarness onPrintDraft={onPrintDraft} />);
    const button = screen.getByRole('button', { name: 'Print draft for review' });

    fireEvent.click(screen.getByLabelText('Ingredient names and order checked against the final formula and supplier specifications'));
    fireEvent.click(screen.getByLabelText('Mandatory allergen and any separate precautionary wording reviewed for this product'));
    fireEvent.click(screen.getByLabelText('Storage and date mark supported by product-specific safety and shelf-life evidence'));

    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onPrintDraft).toHaveBeenCalledOnce();
  });

  it('runs actual export handlers for the draft PDF and XLSX actions', () => {
    const onExportPdf = vi.fn();
    const onExportXlsx = vi.fn();
    render(<LabelHarness onExportPdf={onExportPdf} onExportXlsx={onExportXlsx} />);
    fireEvent.click(screen.getByRole('button', { name: 'Export label draft PDF' }));
    fireEvent.click(screen.getByRole('button', { name: 'Export label draft XLSX' }));
    expect(onExportPdf).toHaveBeenCalledOnce();
    expect(onExportXlsx).toHaveBeenCalledOnce();
  });

  it('calculates a draft NIP from the combined 600 g plated meal and measured component yields', () => {
    const draft = { ...createEmptyFoodLabelDraft(), productName: 'Curry sausages and mash', batchRecordId: `meal:${curryMashMeal.id}`, servingsPerPackage: '2' };
    render(<LabelBuilder batches={[batch, mashBatch]} mealAssemblies={[curryMashMeal]} draft={draft} onDraftChange={vi.fn()} onPrintDraft={vi.fn()} onExportPdf={vi.fn()} onExportXlsx={vi.fn()} exporting={false} />);
    expect(screen.getByRole('status').textContent).toContain('MEAL-01');
    expect(screen.getByRole('status').textContent).toContain('1200 g');
    expect(screen.getByRole('row', { name: /Energy \(kJ\).*3,820.*637/ })).toBeInTheDocument();
  });

  it('suggests descending ingoing weight only from user-verified sources and waits for explicit insertion', () => {
    const verifiedSausage = { ...afcdChickenBreastRaw, id: 'sku-sausage', name: 'Sausage SKU', sourceType: 'manufacturer-label' as const, sourceStatus: 'user-verified' as const, sourceReference: 'Supplier panel checked', sourceUrl: 'https://example.test/sausage' };
    const verifiedPotato = { ...afcdWhiteRiceUncooked, id: 'sku-potato', name: 'Potato SKU', sourceType: 'manufacturer-label' as const, sourceStatus: 'user-verified' as const, sourceReference: 'Supplier panel checked', sourceUrl: 'https://example.test/potato' };
    const version: RecipeVersion = { ...recipeVersion, id: 'verified-v1', name: 'Verified meal', ingredients: [{ ingredient: verifiedSausage, quantity: 600 }, { ingredient: verifiedPotato, quantity: 400 }] };
    const verifiedCalculation = calculateBatchNutrition({
      recipeVersion: version, scaleFactor: 1,
      retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
      retentionSource: 'Test fixture only.', additions: [], discardedMaterials: [], cookedBatchWeightGrams: 950, portionWeightGrams: 475,
    });
    const verifiedBatch: BatchRecord = {
      ...batch, id: 'verified-batch', recipeVersionId: version.id, recipeName: version.name, recipeIngredients: version.ingredients,
      additions: [], discardedMaterials: [], cookedBatchWeightGrams: 950, portionWeightGrams: 475, calculation: verifiedCalculation,
    };
    const draft = { ...createEmptyFoodLabelDraft(), productName: 'Verified meal', batchRecordId: `batch:${verifiedBatch.id}` };
    function Harness() {
      const [currentDraft, setCurrentDraft] = useState(draft);
      return <LabelBuilder batches={[verifiedBatch]} mealAssemblies={[]} draft={currentDraft} onDraftChange={setCurrentDraft} onPrintDraft={vi.fn()} onExportPdf={vi.fn()} onExportXlsx={vi.fn()} exporting={false} />;
    }
    render(<Harness />);

    const list = screen.getByRole('list');
    expect(list.textContent?.indexOf('Sausage SKU')).toBeLessThan(list.textContent?.indexOf('Potato SKU') ?? -1);
    expect(screen.getByLabelText(/Ingredients declaration/)).toHaveValue('');
    fireEvent.click(screen.getByRole('button', { name: 'Insert names in this draft' }));
    expect(screen.getByLabelText(/Ingredients declaration/)).toHaveValue('Sausage SKU, Potato SKU');
  });
});
