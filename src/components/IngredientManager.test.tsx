import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { IngredientManager } from './IngredientManager';
import type { Ingredient } from '../types';

const ingredient: Ingredient = {
  id: 'ingredient-1', name: 'Oat flour', energy: 1500, protein: 13, carbohydrates: 60, sugars: 1,
  fat: 7, saturatedFat: 1, sodium: 10, fibre: 9, servingSize: 100, allergens: ['gluten'],
};
const afcdReference: Ingredient = {
  ...ingredient,
  id: 'afcd-F002594',
  name: 'Chicken, breast, lean flesh, raw',
  sourceType: 'afcd',
  sourceStatus: 'source-checked',
  sourceReference: 'AFCD Release 3.0; Public Food Key F002594',
  sourceUrl: 'https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files',
  allergens: [],
};

const renderManager = (props: Partial<React.ComponentProps<typeof IngredientManager>> = {}) => render(
  <IngredientManager
    ingredients={[]}
    onSaveIngredient={vi.fn()}
    onDeleteIngredient={vi.fn()}
    onExportCsv={vi.fn()}
    onExportXlsx={vi.fn()}
    exporting={false}
    {...props}
  />,
);

describe('IngredientManager source records', () => {
  it('imports a generic AFCD profile with its food key and explicit reference metadata', () => {
    const onSaveIngredient = vi.fn();
    renderManager({ referenceIngredients: [afcdReference], onSaveIngredient });

    fireEvent.click(screen.getByRole('button', { name: 'Add reference' }));
    expect(onSaveIngredient).toHaveBeenCalledWith(expect.objectContaining({
      id: 'afcd-F002594', sourceType: 'afcd', sourceStatus: 'source-checked',
      sourceReference: 'AFCD Release 3.0; Public Food Key F002594', allergens: [],
      sourceUrl: 'https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files',
    }));
    expect(screen.getByText(/not brand\/SKU nutrient data/)).toBeInTheDocument();
  });

  it('allows category, brand, barcode, manufacturer-label source and review status to be entered', () => {
    const onSaveIngredient = vi.fn();
    renderManager({ onSaveIngredient });
    fireEvent.change(screen.getByLabelText('Ingredient name'), { target: { value: 'Sausage example' } });
    fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'Meat and poultry' } });
    fireEvent.change(screen.getByLabelText('Brand (if applicable)'), { target: { value: 'Example brand' } });
    fireEvent.change(screen.getByLabelText('Barcode (optional)'), { target: { value: '9300000000012' } });
    fireEvent.change(screen.getByLabelText('Nutrient source type'), { target: { value: 'manufacturer-label' } });
    fireEvent.change(screen.getByLabelText('Source verification'), { target: { value: 'user-verified' } });
    fireEvent.change(screen.getByLabelText('Nutrient data source / reference'), { target: { value: 'Example label per 100 g; user checked' } });
    fireEvent.change(screen.getByLabelText('Source URL'), { target: { value: 'https://example.test/nutrition' } });
    for (const [label, value] of [
      ['Energy (kJ/100 g)', '500'], ['Protein (g/100 g)', '5'], ['Carbohydrate (g/100 g)', '30'],
      ['Sugars (g/100 g)', '1'], ['Fat (g/100 g)', '10'], ['Saturated fat (g/100 g)', '3'],
      ['Sodium (mg/100 g)', '400'], ['Fibre (g/100 g)', '2'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Add ingredient' }));

    expect(onSaveIngredient).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Sausage example', category: 'Meat and poultry', brand: 'Example brand', barcode: '9300000000012',
      sourceType: 'manufacturer-label', sourceStatus: 'user-verified',
      sourceReference: 'Example label per 100 g; user checked',
      sourceUrl: 'https://example.test/nutrition',
    }));
  });

  it('rejects a non-HTTP(S) nutrient source URL', () => {
    const onSaveIngredient = vi.fn();
    renderManager({ onSaveIngredient });
    fireEvent.change(screen.getByLabelText('Ingredient name'), { target: { value: 'Unsafe source' } });
    fireEvent.change(screen.getByLabelText('Source URL'), { target: { value: 'javascript:alert(1)' } });
    for (const [label, value] of [
      ['Energy (kJ/100 g)', '1'], ['Protein (g/100 g)', '1'], ['Carbohydrate (g/100 g)', '1'],
      ['Sugars (g/100 g)', '1'], ['Fat (g/100 g)', '1'], ['Saturated fat (g/100 g)', '1'],
      ['Sodium (mg/100 g)', '1'], ['Fibre (g/100 g)', '1'],
    ]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Add ingredient' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Source URL must use HTTP or HTTPS');
    expect(onSaveIngredient).not.toHaveBeenCalled();
  });
});

describe('IngredientManager XLSX export control', () => {
  it('runs the XLSX export callback for an available ingredient list', () => {
    const onExportXlsx = vi.fn();
    renderManager({ ingredients: [ingredient], onExportXlsx });
    fireEvent.click(screen.getByRole('button', { name: 'Export XLSX' }));
    expect(onExportXlsx).toHaveBeenCalledOnce();
  });

  it('disables the XLSX export while an export is in progress', () => {
    renderManager({ ingredients: [ingredient], exporting: true });
    expect(screen.getByRole('button', { name: 'Preparing XLSX…' })).toBeDisabled();
  });
});
