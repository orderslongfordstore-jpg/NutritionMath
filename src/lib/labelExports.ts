import type { DraftNipResult } from './fsanzNip';
import { AFCD_DISTRIBUTION_NOTICE } from './afcdLicense';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const WATERMARK = 'DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE';
const DISCLAIMER = 'DRAFT ONLY. This document is not a compliance determination or commercial approval. Verify current Food Standards Code requirements, supplier/product facts and final artwork before sale.';

export type LabelExportData = {
  productName: string;
  supplierBusinessName: string;
  supplierBusinessAddress: string;
  productIdentifier: string;
  productionDate: string;
  batchCode: string;
  recordName: string;
  retentionEvidence: string;
  ingredientsDeclaration: string;
  containsDeclaration: string;
  mayContainStatement: string;
  storageInstructions: string;
  dateMarkType: string;
  dateMarkText: string;
  servingsPerPackage: string;
  servingSizeGrams: number | null;
  includeDietaryFibre: boolean;
  nip: DraftNipResult | null;
  afcdUsed: boolean;
};

function safeText(value: string, maxLength = 4000): string {
  return value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function safeCell(value: string | number | boolean | null | undefined): string | number | boolean | null {
  if (typeof value === 'string') return /^[\s\u0000-\u001f]*[=+\-@]/.test(value) ? `'${value}` : value;
  return value ?? null;
}

export async function createFoodLabelWorkbook(data: LabelExportData) {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'NutritionPro';
  workbook.subject = 'Draft food label for review; not a regulatory compliance determination';

  const label = workbook.addWorksheet('Label draft');
  label.columns = [{ width: 34 }, { width: 100 }];
  label.addRows([
    ['DRAFT STATUS', safeCell(WATERMARK)],
    ['Product name', safeCell(data.productName || 'Not supplied')],
    ['Supplier business name', safeCell(data.supplierBusinessName || 'Not supplied')],
    ['Supplier business address', safeCell(data.supplierBusinessAddress || 'Not supplied')],
    ['Product identifier / SKU / barcode', safeCell(data.productIdentifier || 'Not supplied')],
    ['Production date', safeCell(data.productionDate || 'Not supplied')],
    ['Batch / lot identification', safeCell(data.batchCode || 'Not supplied')],
    ['Linked production record', safeCell(data.recordName || 'Not selected')],
    ['Explicit nutrient-retention factors and source/method', safeCell(data.retentionEvidence || 'Not available — NIP must not be used')],
    ['Serving size (g)', data.servingSizeGrams],
    ['Servings per package', safeCell(data.servingsPerPackage || 'Not supplied')],
    ['Ingredients declaration', safeCell(data.ingredientsDeclaration || 'Not supplied')],
    ['Mandatory allergen declaration', safeCell(data.containsDeclaration || 'Not supplied')],
    ['Precautionary statement', safeCell(data.mayContainStatement || 'Not supplied')],
    ['Storage instructions', safeCell(data.storageInstructions || 'Not supplied')],
    ['Date mark type', safeCell(data.dateMarkType)],
    ['Date mark text', safeCell(data.dateMarkText || 'Not supplied')],
    ['Dietary fibre included', data.includeDietaryFibre],
    ['Draft disclaimer', safeCell(DISCLAIMER)],
  ]);
  label.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
  label.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4D21F' } };
  label.getColumn(2).alignment = { wrapText: true, vertical: 'top' };
  label.views = [{ state: 'frozen', ySplit: 1 }];

  const nip = workbook.addWorksheet('Draft NIP');
  nip.columns = [{ width: 32 }, { width: 28 }, { width: 28 }];
  nip.addRow(['DRAFT NUTRITION INFORMATION — NOT APPROVED']);
  nip.addRow(['Product', safeCell(data.productName || 'Not supplied')]);
  nip.addRow(['Serving size (g)', data.servingSizeGrams]);
  nip.addRow(['Servings per package', safeCell(data.servingsPerPackage || 'Not supplied')]);
  nip.addRow(['Nutrient', 'Average quantity per serving', 'Average quantity per 100 g']);
  if (data.nip?.isValid) {
    for (const row of data.nip.rows) nip.addRow([safeCell(`${row.label} (${row.unit})`), safeCell(row.perServingText), safeCell(row.per100gText)]);
    nip.addRow(['Display convention', safeCell(data.nip.displayConvention)]);
  } else {
    nip.addRow(['NIP status', 'Unavailable — select a valid measured batch and enter valid package/serving data']);
  }
  nip.addRow(['Disclaimer', safeCell(DISCLAIMER)]);
  if (data.afcdUsed) {
    const source = workbook.addWorksheet('AFCD Licence and Use');
    source.columns = [{ width: 120 }];
    source.addRow([safeCell(AFCD_DISTRIBUTION_NOTICE)]);
    source.getColumn(1).alignment = { wrapText: true, vertical: 'top' };
  }
  return workbook;
}

export async function createFoodLabelPdf(data: LabelExportData) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const left = 15;
  const right = pageWidth - 15;
  let y = 15;

  const safeDisplay = (value: string) => safeText(value || 'Not supplied');
  const addPageIfNeeded = (height: number) => {
    if (y + height <= pageHeight - 18) return;
    doc.addPage();
    y = 15;
  };
  const addTextBlock = (title: string, value: string, bold = false) => {
    const text = doc.splitTextToSize(`${safeDisplay(title)}: ${safeDisplay(value)}`, right - left);
    const height = text.length * 5 + 3;
    addPageIfNeeded(height);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.text(text, left, y);
    y += height;
  };

  doc.setFillColor(255, 235, 130);
  doc.rect(left, y, right - left, 14, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(WATERMARK, left + 3, y + 8, { maxWidth: right - left - 6 });
  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(safeDisplay(data.productName || 'Product name not supplied'), left, y, { maxWidth: right - left });
  y += 9;
  addTextBlock('Supplier business name', data.supplierBusinessName);
  addTextBlock('Supplier business address', data.supplierBusinessAddress);
  addTextBlock('Product identifier / SKU / barcode', data.productIdentifier);
  addTextBlock('Production date', data.productionDate);
  addTextBlock('Batch / lot identification', data.batchCode);
  addTextBlock('Linked production record', data.recordName);
  addTextBlock('Explicit nutrient-retention factors and source/method', data.retentionEvidence);
  addTextBlock('Serving size (g)', data.servingSizeGrams === null ? '' : String(data.servingSizeGrams));
  addTextBlock('Servings per package', data.servingsPerPackage);
  addTextBlock('Ingredients', data.ingredientsDeclaration);
  addTextBlock('Mandatory allergen declaration', data.containsDeclaration);
  addTextBlock('Precautionary statement', data.mayContainStatement);
  addTextBlock('Storage instructions', data.storageInstructions);
  addTextBlock(data.dateMarkType || 'Date mark', data.dateMarkText);

  y += 4;
  addPageIfNeeded(20);
  doc.setFillColor(0, 0, 0);
  doc.rect(left, y, right - left, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NUTRITION INFORMATION — DRAFT', left + 3, y + 5.5);
  doc.setTextColor(0, 0, 0);
  y += 11;
  if (data.nip?.isValid) {
    const colA = left + 2;
    const colB = left + 112;
    const colC = right - 2;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nutrient', colA, y);
    doc.text('Per serving', colB, y, { align: 'right' });
    doc.text('Per 100 g', colC, y, { align: 'right' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    for (const row of data.nip.rows) {
      addPageIfNeeded(7);
      doc.text(safeDisplay(`${row.label} (${row.unit})`), colA, y, { maxWidth: 90 });
      doc.text(safeDisplay(row.perServingText), colB, y, { align: 'right' });
      doc.text(safeDisplay(row.per100gText), colC, y, { align: 'right' });
      doc.setDrawColor(180, 180, 180);
      doc.line(left, y + 2, right, y + 2);
      y += 6;
    }
    addTextBlock('Display convention', data.nip.displayConvention);
  } else {
    addTextBlock('NIP status', 'Unavailable. A valid measured production record and servings per package are required.');
  }
  if (data.afcdUsed) addTextBlock('AFCD source and licence notice', AFCD_DISTRIBUTION_NOTICE);
  y += 3;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const disclaimerLines = doc.splitTextToSize(DISCLAIMER, right - left);
  addPageIfNeeded(disclaimerLines.length * 4 + 3);
  doc.text(disclaimerLines, left, y);
  return doc;
}

async function downloadWorkbook(workbook: Awaited<ReturnType<typeof createFoodLabelWorkbook>>, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: XLSX_MIME });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadFoodLabelXlsx(data: LabelExportData) {
  await downloadWorkbook(await createFoodLabelWorkbook(data), 'nutritionpro-food-label-draft.xlsx');
}

export async function downloadFoodLabelPdf(data: LabelExportData) {
  const doc = await createFoodLabelPdf(data);
  doc.save('nutritionpro-food-label-draft.pdf');
}
