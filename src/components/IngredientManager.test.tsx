import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IngredientManager } from './IngredientManager';
import type { Ingredient } from '../types';

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

describe('IngredientManager XLSX export control', () => {
  it('runs the XLSX export callback for an available ingredient list', () => {
    const onExportXlsx = vi.fn();
    render(
      <IngredientManager
        ingredients={[ingredient]}
        onSaveIngredient={vi.fn()}
        onDeleteIngredient={vi.fn()}
        onExportCsv={vi.fn()}
        onExportXlsx={onExportXlsx}
        exporting={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));
    expect(onExportXlsx).toHaveBeenCalledOnce();
  });

  it('disables the XLSX export while an export is in progress', () => {
    render(
      <IngredientManager
        ingredients={[ingredient]}
        onSaveIngredient={vi.fn()}
        onDeleteIngredient={vi.fn()}
        onExportCsv={vi.fn()}
        onExportXlsx={vi.fn()}
        exporting
      />,
    );

    expect(screen.getByRole('button', { name: 'Preparing XLSX…' })).toBeDisabled();
  });
});
