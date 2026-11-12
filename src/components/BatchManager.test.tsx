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

    expect(screen.getByText('2 / 0 g')).toBeInTheDocument();
    const saveButton = screen.getByRole('button', { name: 'Save session batch record' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);

    await waitFor(() => expect(onSaveBatch).toHaveBeenCalledWith({
      recipeVersionId: version.id,
      batchCode: 'MEAL-001',
      scaleFactor: 1,
      additions: [],
      discardedMaterials: [],
      cookedBatchWeightGrams: 90,
      portionWeightGrams: 45,
    }));
  });

  it('keeps batch creation disabled until a recipe version and valid measured weights are supplied', () => {
    renderManager();
    expect(screen.getByRole('button', { name: 'Save session batch record' })).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Recipe version'), { target: { value: version.id } });
    fireEvent.change(screen.getByLabelText('Batch code / identification'), { target: { value: 'MEAL-002' } });
    fireEvent.change(screen.getByLabelText('Measured cooked batch weight before discards (g)'), { target: { value: '0' } });
    fireEvent.change(screen.getByLabelText('Finished portion weight (g)'), { target: { value: '40' } });
    expect(screen.getByRole('button', { name: 'Save session batch record' })).toBeDisabled();
  });
});
