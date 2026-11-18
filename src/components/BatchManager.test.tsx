import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BatchManager } from './BatchManager';
import { afcdChickenBreastRaw } from '../test/fixtures/afcdRelease3';
import type { RecipeVersion, SavedRecipe } from '../types';

const ingredient = afcdChickenBreastRaw;
const version: RecipeVersion = {
  id: 'recipe-v1', recipeId: 'recipe-1', name: 'Chicken meal', version: 1,
  ingredients: [{ ingredient, quantity: 100 }], servings: 1, createdAt: '2026-11-12T00:00:00.000Z',
};
const recipes: SavedRecipe[] = [{ id: 'recipe-1', name: version.name, versions: [version] }];

function renderManager(onSaveBatch = vi.fn().mockResolvedValue(undefined)) {
  render(<BatchManager ingredients={[ingredient]} recipes={recipes} batches={[]} onSaveBatch={onSaveBatch} />);
  return onSaveBatch;
}

describe('BatchManager', () => {
  it('creates a batch from a selected immutable recipe version and measured yield', async () => {
    const onSaveBatch = renderManager();
    fireEvent.change(screen.getByLabelText('Recipe version'), { target: { value: version.id } });
    fireEvent.change(screen.getByLabelText('Batch code / identification'), { target: { value: 'MEAL-001' } });
    fireEvent.change(screen.getByLabelText('Measured cooked batch weight before discards (g)'), { target: { value: '90' } });
    fireEvent.change(screen.getByLabelText('Finished portion weight (g)'), { target: { value: '45' } });
    const retention = { energy: '100', protein: '100', carbohydrates: '100', sugars: '100', fat: '100', 'saturated fat': '100', sodium: '100', fibre: '100' };
    for (const [nutrient, value] of Object.entries(retention)) fireEvent.change(screen.getByLabelText(`${nutrient[0].toUpperCase()}${nutrient.slice(1)} retention (%)`), { target: { value } });
    fireEvent.change(screen.getByLabelText('Retention source / method (required)'), { target: { value: 'Test fixture only.' } });

    expect(screen.getByText('2 / 0 g')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: 'Save session batch record' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSaveBatch).toHaveBeenCalledWith({
      recipeVersionId: version.id,
      batchCode: 'MEAL-001',
      scaleFactor: 1,
      retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
      retentionSource: 'Test fixture only.',
      additions: [],
      discardedMaterials: [],
      cookedBatchWeightGrams: 90,
      portionWeightGrams: 45,
    }));
  });

  it('keeps batch creation disabled until a recipe, measured weights and sourced retention factors are supplied', () => {
    renderManager();
    expect(screen.getByRole('button', { name: 'Save session batch record' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Recipe version'), { target: { value: version.id } });
    fireEvent.change(screen.getByLabelText('Batch code / identification'), { target: { value: 'MEAL-002' } });
    fireEvent.change(screen.getByLabelText('Measured cooked batch weight before discards (g)'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Finished portion weight (g)'), { target: { value: '40' } });
    expect(screen.getByRole('button', { name: 'Save session batch record' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Energy retention (%)'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Retention source / method (required)'), { target: { value: 'Explicit source' } });
    expect(screen.getByRole('button', { name: 'Save session batch record' })).toBeDisabled();
  });
});
