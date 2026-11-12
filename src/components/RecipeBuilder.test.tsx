import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { RecipeBuilder } from './RecipeBuilder';
import { afcdChickenBreastRaw, afcdWhiteRiceUncooked } from '../test/fixtures/afcdRelease3';
import type { RecipeIngredient, RecipeVersion, SavedRecipe } from '../types';

const ingredient = afcdChickenBreastRaw;
const rice = afcdWhiteRiceUncooked;
const sampleRecipeLines: RecipeIngredient[] = [
  { ingredient, quantity: 400 },
  { ingredient: rice, quantity: 200 },
];

const savedVersion: RecipeVersion = {
  id: 'recipe-version-1', recipeId: 'recipe-1', name: 'Chicken and rice meal', version: 1,
  ingredients: sampleRecipeLines, servings: 2, createdAt: '2026-11-12T00:00:00.000Z',
};
const savedRecipe: SavedRecipe = { id: 'recipe-1', name: savedVersion.name, versions: [savedVersion] };

function renderBuilder(recipeIngredients: RecipeIngredient[] = sampleRecipeLines, servings = '2') {
  const onExportXlsx = vi.fn();
  const onExportPdf = vi.fn();
  const onSaveRecipeVersion = vi.fn();
  const onLoadRecipeVersion = vi.fn();
  render(
    <RecipeBuilder
      ingredients={[ingredient, rice]}
      recipeIngredients={recipeIngredients}
      servings={servings}
      onServingsChange={vi.fn()}
      onAddRecipeItem={vi.fn()}
      onRecipeChange={vi.fn()}
      onExportXlsx={onExportXlsx}
      onExportPdf={onExportPdf}
      exporting={false}
      recipeName="Chicken and rice meal"
      currentRecipeId={null}
      currentRecipeVersion={null}
      savedRecipes={[savedRecipe]}
      onRecipeNameChange={vi.fn()}
      onSaveRecipeVersion={onSaveRecipeVersion}
      onLoadRecipeVersion={onLoadRecipeVersion}
    />,
  );
  return { onExportXlsx, onExportPdf, onSaveRecipeVersion, onLoadRecipeVersion };
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

describe('RecipeBuilder version controls', () => {
  it('saves a valid named recipe version and loads the selected immutable version', () => {
    const { onSaveRecipeVersion, onLoadRecipeVersion } = renderBuilder();
    const saveButton = screen.getByRole('button', { name: 'Save named recipe version' });
    expect(saveButton).toBeEnabled();
    fireEvent.click(saveButton);
    expect(onSaveRecipeVersion).toHaveBeenCalledOnce();

    fireEvent.change(screen.getByLabelText('Load saved recipe version'), { target: { value: savedVersion.id } });
    expect(onLoadRecipeVersion).toHaveBeenCalledWith(savedVersion);
  });
});
