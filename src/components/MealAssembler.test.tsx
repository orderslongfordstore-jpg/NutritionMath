import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { calculateBatchNutrition } from '../lib/batchNutrition';
import { afcdChickenBreastRaw, afcdWhiteRiceUncooked } from '../test/fixtures/afcdRelease3';
import type { BatchRecord, RecipeVersion } from '../types';
import { MealAssembler } from './MealAssembler';

function makeBatch(id: string, name: string, code: string, ingredient: typeof afcdChickenBreastRaw): BatchRecord {
  const version: RecipeVersion = {
    id: `version-${id}`, recipeId: `recipe-${id}`, name, version: 1,
    ingredients: [{ ingredient, quantity: 100 }], servings: 1, createdAt: '2026-11-18T00:00:00.000Z',
  };
  const calculation = calculateBatchNutrition({
    recipeVersion: version, scaleFactor: 1,
    retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
    retentionSource: 'Test fixture only.', additions: [], discardedMaterials: [],
    cookedBatchWeightGrams: 1000, portionWeightGrams: 100,
  });
  return {
    id, recipeId: version.recipeId, recipeVersionId: version.id, recipeName: name, recipeVersion: 1,
    batchCode: code, recordedAt: '2026-11-18T00:00:00.000Z', scaleFactor: 1,
    retentionFactors: { energy: 1, protein: 1, carbohydrates: 1, sugars: 1, fat: 1, saturatedFat: 1, sodium: 1, fibre: 1 },
    retentionSource: 'Test fixture only.', recipeIngredients: version.ingredients, additions: [], discardedMaterials: [],
    cookedBatchWeightGrams: 1000, portionWeightGrams: 100, calculation,
  };
}

const componentBatches = [
  makeBatch('curry', 'Curry sausages', 'CUR-01', afcdChickenBreastRaw),
  makeBatch('mash', 'Mashed potato', 'MASH-01', afcdWhiteRiceUncooked),
];

describe('MealAssembler', () => {
  it('shows supplied plated weights and keeps saving disabled until valid measured component batches are selected', () => {
    render(<MealAssembler batches={[]} records={[]} onSave={vi.fn()} />);
    expect(screen.getByText(/400 g curry plus 200 g mash per meal/)).toBeInTheDocument();
    expect(screen.getAllByLabelText('Plated weight per meal (g)', { selector: 'input' })[0]).toHaveValue(400);
    expect(screen.getAllByLabelText('Plated weight per meal (g)', { selector: 'input' })[1]).toHaveValue(200);
    expect(screen.getByRole('button', { name: 'Save combined meal batch' })).toBeDisabled();
  });

  it('saves a 400 g curry plus 200 g mash assembly with exact batch IDs', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(<MealAssembler batches={componentBatches} records={[]} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText('Meal batch code'), { target: { value: 'MEAL-01' } });
    fireEvent.change(screen.getAllByLabelText('Measured cooked component batch')[0], { target: { value: 'curry' } });
    fireEvent.change(screen.getAllByLabelText('Measured cooked component batch')[1], { target: { value: 'mash' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save combined meal batch' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      mealName: 'Curry sausages and mash', batchCode: 'MEAL-01',
      components: [
        { batchRecordId: 'curry', portionWeightGrams: 400 },
        { batchRecordId: 'mash', portionWeightGrams: 200 },
      ],
    }));
  });
});
