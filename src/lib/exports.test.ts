import { describe, expect, it } from 'vitest';
import { createIngredientsWorkbook, createRecipePdf, createRecipeWorkbook } from './exports';
import type { Ingredient } from '../types';
import { AFCD_DISTRIBUTION_NOTICE } from './afcdLicense';

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
  category: 'Grains',
  sourceType: 'manufacturer-label',
  sourceReference: 'Example package panel; manually entered',
  sourceUrl: 'https://example.test/nutrition',
  sourceStatus: 'unverified',
};

describe('data exports', () => {
  it('creates an ingredient workbook with numeric nutrient cells and formula-safe text', async () => {
    const workbook = await createIngredientsWorkbook([ingredient]);
    const worksheet = workbook.getWorksheet('Ingredients');

    expect(worksheet).toBeDefined();
    expect(worksheet?.getCell('A2').value).toBe("'=HYPERLINK(\"https://example.test\",\"click\")");
    expect(worksheet?.getCell('G2').value).toBe(1450);
    expect(worksheet?.getCell('P2').value).toBe('gluten');
    expect(worksheet?.getCell('B2').value).toBe('Grains');
    expect(worksheet?.getCell('S2').value).toBe('Example package panel; manually entered');
    expect(worksheet?.getCell('T2').value).toBe('https://example.test/nutrition');
    expect(worksheet?.getCell('A1').value).toBe('Ingredient');

    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
  });

  it('includes AFCD attribution and limitations when AFCD profiles are exported', async () => {
    const workbook = await createIngredientsWorkbook([{ ...ingredient, id: 'afcd-F002594', sourceType: 'afcd' }]);
    const notice = workbook.getWorksheet('AFCD Licence and Use');
    expect(notice?.getCell('A2').value).toContain('Australian Food Composition Database');
    expect(notice?.getCell('A3').value).toContain('selected four-profile subset');
    expect(notice?.getCell('A5').value).toContain('There are limitations associated with food composition databases');
    expect(notice?.getCell('A6').value).toContain('provided “as-is”');
    expect(notice?.getCell('A7').value).toContain('Data User Licence Agreement');
    expect(notice?.getCell('A7').value).toContain(AFCD_DISTRIBUTION_NOTICE.split(' ').slice(-1)[0]);
    expect(workbook.getWorksheet('Ingredients')?.getCell('U2').value).toContain('Data User Licence Agreement');
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
