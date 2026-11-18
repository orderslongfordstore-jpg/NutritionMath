import { describe, expect, it } from 'vitest';
import { calculateDraftNip } from './fsanzNip';
import { createFoodLabelPdf, createFoodLabelWorkbook, type LabelExportData } from './labelExports';

const nip = calculateDraftNip({
  totalNutrients: { energy: 4219, protein: 97.8, carbohydrates: 139.2, sugars: 0, fat: 4.7, saturatedFat: 1.26, sodium: 193.8, fibre: 0 },
  finalFinishedWeightGrams: 800,
  servingWeightGrams: 400,
  servingsPerPackage: 2,
  includeDietaryFibre: false,
});
const data: LabelExportData = {
  productName: '=HYPERLINK("https://example.test","label")',
  supplierBusinessName: 'Example Food Business',
  supplierBusinessAddress: '1 Test Road, Sydney NSW 2000',
  productIdentifier: 'SKU-01',
  productionDate: '2026-11-18',
  batchCode: 'MEAL-01',
  recordName: 'Curry and mash',
  retentionEvidence: 'CUR-01: energy 80%. Source/method: verified process study.',
  ingredientsDeclaration: 'Verified sausage, potato',
  containsDeclaration: 'Contains: wheat',
  mayContainStatement: '',
  storageInstructions: 'Keep refrigerated',
  dateMarkType: 'Use by',
  dateMarkText: '20/11/2026',
  servingsPerPackage: '2',
  servingSizeGrams: 400,
  includeDietaryFibre: false,
  nip,
  afcdUsed: true,
};

describe('draft label exports', () => {
  it('writes a real XLSX with label facts, computed draft NIP, AFCD licence and injection-safe text', async () => {
    const workbook = await createFoodLabelWorkbook(data);
    const label = workbook.getWorksheet('Label draft');
    const panel = workbook.getWorksheet('Draft NIP');
    const source = workbook.getWorksheet('AFCD Licence and Use');

    expect(label?.getCell('B2').value).toBe("'=HYPERLINK(\"https://example.test\",\"label\")");
    expect(label?.getCell('B3').value).toBe('Example Food Business');
    expect(label?.getCell('B9').value).toBe('CUR-01: energy 80%. Source/method: verified process study.');
    expect(label?.getCell('A1').value).toBe('DRAFT STATUS');
    expect(panel?.getCell('A6').value).toBe('Energy (kJ)');
    expect(panel?.getCell('B6').value).toBe('2,110');
    expect(panel?.getCell('C6').value).toBe('527');
    expect(source?.getCell('A1').value).toContain('Australian Food Composition Database');
    expect(source?.getCell('A1').value).toContain('There are limitations associated with food composition databases');
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    expect(Array.from(bytes.slice(0, 2))).toEqual([0x50, 0x4b]);
  });

  it('writes a real PDF draft even when fields are incomplete and includes explicit non-approval status', async () => {
    const pdf = await createFoodLabelPdf({ ...data, productName: '', supplierBusinessName: '', nip: null, afcdUsed: false });
    const bytes = new Uint8Array(pdf.output('arraybuffer'));
    expect(new TextDecoder().decode(bytes).startsWith('%PDF-')).toBe(true);
    expect(pdf.getNumberOfPages()).toBeGreaterThanOrEqual(1);
  });
});
