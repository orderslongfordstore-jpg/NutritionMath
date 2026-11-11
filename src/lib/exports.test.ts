import { describe, expect, it } from 'vitest';
import { createIngredientsWorkbook, createRecipePdf, createRecipeWorkbook } from './exports';
import type { Ingredient } from '../types';

const ingredient: Ingredient = {
  id: 'ingredient-1',
  name: '=HYPERLINK("https://example.test","click")',
  code: 'FLOUR-01',
  brand: 'Example brand',
  origin: 'Australia',
  energy: 1450,
  protein: 12.5,
  carbohydrates: 70,
  sugars: 2,
  fat: 1.5,
  saturatedFat: 0.4,
  sodium: 20,
  fibre: 4,
  servingSize: 100,
  allergens: ['gluten'],
};

describe('data exports', () => {
  it('creates an ingredient workbook with numeric nutrient cells and formula-safe text', async () => {
    const workbook = await createIngredientsWorkbook([ingredient]);
    const worksheet = workbook.getWorksheet('Ingredients');

    expect(worksheet).toBeDefined();
    expect(worksheet?.getCell('A2').value).toBe("'=HYPERLINK(\"https://example.test\",\"click\")");
    expect(worksheet?.getCell('E2').value).toBe(1450);
    expect(worksheet?.getCell('N2').value).toBe('gluten');
    expect(worksheet?.getCell('A1').value).toBe('Ingredient');

    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
  });

  it('creates an explicitly non-regulatory recipe worksheet using the established calculation engine', async () => {
    const workbook = await createRecipeWorkbook([{ ingredient, quantity: 100 }], 2);
    const worksheet = workbook.getWorksheet('Recipe draft');

    expect(worksheet?.getCell('A1').value).toBe('NutritionPro recipe calculation worksheet');
    expect(worksheet?.getCell('A2').value).toContain('Not a validated FSANZ Nutrition Information Panel');
    expect(worksheet?.getCell('B3').value).toBe(2);
    expect(worksheet?.getCell('B6').value).toBe(1450);
    expect(worksheet?.getCell('C6').value).toBe(725);
    expect(worksheet?.getCell('A16').value).toBe("'=HYPERLINK(\"https://example.test\",\"click\")");
  });

  it('creates an actual, paginated PDF draft with a non-regulatory disclaimer', async () => {
    const pdf = await createRecipePdf([{ ingredient, quantity: 100 }], 2);
    const pdfBytes = new Uint8Array(pdf.output('arraybuffer'));
    const pdfText = new TextDecoder().decode(pdfBytes);

    expect(pdf.getNumberOfPages()).toBe(1);
    expect(pdfText.startsWith('%PDF-')).toBe(true);
    expect(pdfText).toContain('not a validated FSANZ Nutrition Information Panel or label');
  });
});
