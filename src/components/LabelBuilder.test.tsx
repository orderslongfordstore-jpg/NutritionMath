import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { calculateBatchNutrition } from '../lib/batchNutrition';
import { afcdChickenBreastRaw, afcdTapWater, afcdWhiteRiceUncooked } from '../test/fixtures/afcdRelease3';
import type { BatchRecord, RecipeVersion } from '../types';
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
  additions: [{ ingredient: afcdTapWater, quantity: 400 }],
  discardedMaterials: [],
  cookedBatchWeightGrams: 850,
  portionWeightGrams: 400,
  calculation,
};

function LabelHarness({ onPrintDraft = vi.fn() }: { onPrintDraft?: () => void }) {
  const [draft, setDraft] = useState<FoodLabelDraft>(() => ({
    ...createEmptyFoodLabelDraft(),
    productName: 'Chicken and rice meal',
    batchRecordId: batch.id,
    ingredientsDeclaration: 'Chicken, rice, water.',
    containsDeclaration: 'Allergen declaration reviewed for the product.',
    storageInstructions: 'Keep refrigerated.',
    dateMarkText: '12/11/2026',
    servingsPerPackage: '1',
  }));
  return <LabelBuilder batches={[batch]} draft={draft} onDraftChange={setDraft} onPrintDraft={onPrintDraft} />;
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
});
