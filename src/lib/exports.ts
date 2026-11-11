import { calculateIngredientNutrition, calculateRecipeTotals, roundToTwo } from './nutrition';
import type { Ingredient, RecipeIngredient } from '../types';

const xlsxMimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function safeSpreadsheetText(value: string | undefined): string {
  const raw = value ?? '';
  return /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? `'${raw}` : raw;
}

async function createWorkbook() {
  const ExcelJS = await import('exceljs');
  return new ExcelJS.Workbook();
}

export async function createIngredientsWorkbook(ingredients: Ingredient[]) {
  const workbook = await createWorkbook();
  workbook.creator = 'NutritionPro';
  workbook.subject = 'Ingredient nutrient data';
  const worksheet = workbook.addWorksheet('Ingredients');
  worksheet.columns = [
    { header: 'Ingredient', key: 'name', width: 30 },
    { header: 'Code', key: 'code', width: 18 },
    { header: 'Brand', key: 'brand', width: 24 },
    { header: 'Origin', key: 'origin', width: 20 },
    { header: 'Energy (kJ/100 g)', key: 'energy', width: 20 },
    { header: 'Protein (g/100 g)', key: 'protein', width: 20 },
    { header: 'Carbohydrate (g/100 g)', key: 'carbohydrates', width: 24 },
    { header: 'Sugars (g/100 g)', key: 'sugars', width: 20 },
    { header: 'Fat (g/100 g)', key: 'fat', width: 18 },
    { header: 'Saturated fat (g/100 g)', key: 'saturatedFat', width: 24 },
    { header: 'Sodium (mg/100 g)', key: 'sodium', width: 20 },
    { header: 'Fibre (g/100 g)', key: 'fibre', width: 18 },
    { header: 'Serving size (g)', key: 'servingSize', width: 18 },
    { header: 'Allergens', key: 'allergens', width: 35 },
  ];
  for (const ingredient of ingredients) {
    worksheet.addRow({
      name: safeSpreadsheetText(ingredient.name),
      code: safeSpreadsheetText(ingredient.code),
      brand: safeSpreadsheetText(ingredient.brand),
      origin: safeSpreadsheetText(ingredient.origin),
      energy: roundToTwo(ingredient.energy),
      protein: roundToTwo(ingredient.protein),
      carbohydrates: roundToTwo(ingredient.carbohydrates),
      sugars: roundToTwo(ingredient.sugars),
      fat: roundToTwo(ingredient.fat),
      saturatedFat: roundToTwo(ingredient.saturatedFat),
      sodium: roundToTwo(ingredient.sodium),
      fibre: roundToTwo(ingredient.fibre),
      servingSize: roundToTwo(ingredient.servingSize),
      allergens: safeSpreadsheetText(ingredient.allergens.join('; ')),
    });
  }
  worksheet.getRow(1).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 1 }];
  worksheet.autoFilter = {
    from: 'A1',
    to: `N${Math.max(1, ingredients.length + 1)}`,
  };
  return workbook;
}

export async function createRecipeWorkbook(recipeIngredients: RecipeIngredient[], servings: number) {
  const workbook = await createWorkbook();
  workbook.creator = 'NutritionPro';
  workbook.subject = 'Internal recipe calculation worksheet';
  const worksheet = workbook.addWorksheet('Recipe draft');
  worksheet.columns = [
    { width: 42 },
    { width: 24 },
    { width: 24 },
    { width: 24 },
  ];

  worksheet.addRow(['NutritionPro recipe calculation worksheet']);
  worksheet.addRow(['Internal calculation only. Not a validated FSANZ Nutrition Information Panel or label.']);
  worksheet.addRow(['Servings', servings]);

  const summary = calculateRecipeTotals(recipeIngredients, servings);
  worksheet.addRow(['Total recipe weight (g)', summary.totalWeight]);
  worksheet.addRow(['Nutrient', 'Per 100 g', 'Per serving', 'Units']);
  const nutrientRows: Array<[string, number, number, string]> = [
    ['Energy', summary.per100g.energy, summary.perServing.energy, 'kJ'],
    ['Protein', summary.per100g.protein, summary.perServing.protein, 'g'],
    ['Carbohydrate', summary.per100g.carbohydrates, summary.perServing.carbohydrates, 'g'],
    ['Sugars', summary.per100g.sugars, summary.perServing.sugars, 'g'],
    ['Fat', summary.per100g.fat, summary.perServing.fat, 'g'],
    ['Saturated fat', summary.per100g.saturatedFat, summary.perServing.saturatedFat, 'g'],
    ['Sodium', summary.per100g.sodium, summary.perServing.sodium, 'mg'],
    ['Fibre', summary.per100g.fibre, summary.perServing.fibre, 'g'],
  ];
  nutrientRows.forEach((row) => worksheet.addRow(row));
  worksheet.addRow([]);
  worksheet.addRow(['Ingredient', 'Quantity (g)', 'Energy (kJ)', 'Allergens entered']);
  for (const entry of recipeIngredients) {
    const lineNutrition = calculateIngredientNutrition(entry.ingredient, entry.quantity);
    worksheet.addRow([
      safeSpreadsheetText(entry.ingredient.name),
      roundToTwo(entry.quantity),
      lineNutrition.energy,
      safeSpreadsheetText(entry.ingredient.allergens.join('; ') || 'None entered'),
    ]);
  }
  worksheet.getRow(1).font = { bold: true, size: 14 };
  worksheet.getRow(2).font = { italic: true };
  worksheet.getRow(5).font = { bold: true };
  worksheet.getRow(15).font = { bold: true };
  worksheet.views = [{ state: 'frozen', ySplit: 5 }];

  if (summary.issues.length > 0) {
    worksheet.addRow([]);
    worksheet.addRow(['Calculation review notes']);
    worksheet.getRow(worksheet.rowCount).font = { bold: true };
    summary.issues.forEach((issue) => worksheet.addRow([safeSpreadsheetText(issue.message)]));
  }
  return workbook;
}

async function downloadWorkbook(workbook: Awaited<ReturnType<typeof createWorkbook>>, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const bytes = new Uint8Array(buffer);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const file = new Blob([arrayBuffer], { type: xlsxMimeType });
  const url = URL.createObjectURL(file);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadIngredientsXlsx(ingredients: Ingredient[]) {
  const workbook = await createIngredientsWorkbook(ingredients);
  await downloadWorkbook(workbook, 'nutritionpro-ingredients.xlsx');
}

export async function downloadRecipeXlsx(recipeIngredients: RecipeIngredient[], servings: number) {
  const workbook = await createRecipeWorkbook(recipeIngredients, servings);
  await downloadWorkbook(workbook, 'nutritionpro-recipe-draft.xlsx');
}

function safePdfText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\uffff]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 240);
}

export async function createRecipePdf(recipeIngredients: RecipeIngredient[], servings: number) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 15;
  const right = 195;
  let y = 14;

  doc.setFillColor(255, 214, 0);
  doc.roundedRect(left, y, right - left, 16, 2, 2, 'F');
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('NutritionPro recipe worksheet', left + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Internal calculation only - not a validated FSANZ Nutrition Information Panel or label.', left + 4, y + 12);
  y += 24;

  const summary = calculateRecipeTotals(recipeIngredients, servings);
  doc.setFontSize(10);
  doc.text(`Servings: ${servings}`, left, y);
  doc.text(`Total recipe weight: ${summary.totalWeight} g`, 90, y);
  y += 9;

  const drawHeader = (labels: string[], x: number[], widths: number[]) => {
    doc.setFillColor(0, 0, 0);
    doc.rect(left, y, right - left, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    labels.forEach((label, index) => doc.text(label, x[index], y + 5.5, { maxWidth: widths[index] }));
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    y += 10;
  };

  drawHeader(['Nutrient', 'Per 100 g', 'Per serving', 'Units'], [left + 2, 100, 140, 178], [75, 28, 32, 14]);
  const nutrientRows: Array<[string, number, number, string]> = [
    ['Energy', summary.per100g.energy, summary.perServing.energy, 'kJ'],
    ['Protein', summary.per100g.protein, summary.perServing.protein, 'g'],
    ['Carbohydrate', summary.per100g.carbohydrates, summary.perServing.carbohydrates, 'g'],
    ['Sugars', summary.per100g.sugars, summary.perServing.sugars, 'g'],
    ['Fat', summary.per100g.fat, summary.perServing.fat, 'g'],
    ['Saturated fat', summary.per100g.saturatedFat, summary.perServing.saturatedFat, 'g'],
    ['Sodium', summary.per100g.sodium, summary.perServing.sodium, 'mg'],
    ['Fibre', summary.per100g.fibre, summary.perServing.fibre, 'g'],
  ];
  doc.setFontSize(9);
  for (const [name, per100g, perServing, unit] of nutrientRows) {
    doc.text(name, left + 2, y + 4.5);
    doc.text(String(per100g), 126, y + 4.5, { align: 'right' });
    doc.text(String(perServing), 166, y + 4.5, { align: 'right' });
    doc.text(unit, 178, y + 4.5, { align: 'right' });
    doc.setDrawColor(210, 210, 210);
    doc.line(left, y + 7, right, y + 7);
    y += 8;
  }

  y += 8;
  if (y + 18 > pageHeight - 16) {
    doc.addPage();
    y = 18;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Recipe ingredients', left, y);
  y += 5;
  drawHeader(['Ingredient', 'Quantity (g)', 'Energy (kJ)', 'Allergens entered'], [left + 2, 101, 134, 157], [78, 30, 34, 37]);

  for (const entry of recipeIngredients) {
    const nutrition = calculateIngredientNutrition(entry.ingredient, entry.quantity);
    const nameLines = doc.splitTextToSize(safePdfText(entry.ingredient.name), 72).slice(0, 2);
    const allergenText = safePdfText(entry.ingredient.allergens.join(', ') || 'None entered');
    const allergenLines = doc.splitTextToSize(allergenText, 35).slice(0, 2);
    const rowHeight = Math.max(8, Math.max(nameLines.length, allergenLines.length) * 4 + 2);
    if (y + rowHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
    doc.text(nameLines, left + 2, y + 4);
    doc.text(String(roundToTwo(entry.quantity)), 128, y + 4, { align: 'right' });
    doc.text(String(nutrition.energy), 153, y + 4, { align: 'right' });
    doc.text(allergenLines, 158, y + 4);
    doc.setDrawColor(210, 210, 210);
    doc.line(left, y + rowHeight, right, y + rowHeight);
    y += rowHeight;
  }

  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    doc.setPage(page);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Internal worksheet only - ingredient data and calculations require independent review before use.', left, pageHeight - 8);
    doc.text(`Page ${page} of ${totalPages}`, right, pageHeight - 8, { align: 'right' });
  }
  return doc;
}

export async function downloadRecipePdf(recipeIngredients: RecipeIngredient[], servings: number) {
  const document = await createRecipePdf(recipeIngredients, servings);
  document.save('nutritionpro-recipe-draft.pdf');
}
