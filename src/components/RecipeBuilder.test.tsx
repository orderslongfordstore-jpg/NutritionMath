import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecipeBuilder } from './RecipeBuilder';
import type { Ingredient, RecipeIngredient } from '../types';

const ingredient: Ingredient = {
  id: 'ingredient-1',
  name: 'Oat flour',
  energy: 1500,
  protein: 13,
  carbohydrates: 60,
  sugars: 1,
  fat: 7,
  saturatedFat: 1,
  sodium: 10,
  fibre: 9,
  servingSize: 100,
  allergens: ['gluten'],
};

function renderBuilder(recipeIngredients: RecipeIngredient[] = [{ ingredient, quantity: 100 }], servings = '1') {
  const onExportXlsx = vi.fn();
  const onExportPdf = vi.fn();
  render(
    <RecipeBuilder
      ingredients={[ingredient]}
      recipeIngredients={recipeIngredients}
      servings={servings}
      onServingsChange={vi.fn()}
      onAddRecipeItem={vi.fn()}
      onRecipeChange={vi.fn()}
      onExportXlsx={onExportXlsx}
      onExportPdf={onExportPdf}
      exporting={false}
    />,
  );
  return { onExportXlsx, onExportPdf };
}

describe('RecipeBuilder export controls', () => {
  it('enables both worksheet exports only for a usable recipe and calls the requested action', () => {
    const { onExportXlsx, onExportPdf } = renderBuilder();
    const xlsxButton = screen.getByRole('button', { name: 'Export recipe worksheet' });
    const pdfButton = screen.getByRole('button', { name: 'Export PDF worksheet' });

    expect(xlsxButton).toBeEnabled();
    expect(pdfButton).toBeEnabled();
    fireEvent.click(xlsxButton);
    fireEvent.click(pdfButton);
    expect(onExportXlsx).toHaveBeenCalledOnce();
    expect(onExportPdf).toHaveBeenCalledOnce();
  });

  it('disables exports when there are no recipe lines or serving data is invalid', () => {
    renderBuilder([], '0');
    expect(screen.getByRole('button', { name: 'Export recipe worksheet' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Export PDF worksheet' })).toBeDisabled();
  });
});
