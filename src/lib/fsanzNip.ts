import type { NutrientValues } from '../types';

export interface DraftNipInput {
  /** Full-precision batch totals, before display rounding. */
  totalNutrients: Partial<NutrientValues>;
  finalFinishedWeightGrams: number;
  servingWeightGrams: number;
  servingsPerPackage: number;
  /** Fibre is not a universal row in the ordinary panel; enable only when applicable. */
  includeDietaryFibre: boolean;
}

export interface DraftNipRow {
  key: keyof NutrientValues;
  label: string;
  unit: 'kJ' | 'g' | 'mg';
  perServing: number;
  per100g: number;
  perServingText: string;
  per100gText: string;
  indented?: boolean;
}

export interface DraftNipResult {
  isValid: boolean;
  rows: DraftNipRow[];
  issues: string[];
  servingSizeText: string;
  servingsPerPackageText: string;
  displayConvention: string;
}

const MAX_NUTRIENT = Number.MAX_SAFE_INTEGER;
const DISPLAY_CONVENTION = 'Nutrient quantities are calculated from unrounded batch totals, then displayed to no more than three significant figures. The Code sets a maximum significant-figure count, not one universal decimal-place or tie-breaking rule; this software display method is an implementation choice.';

const baseRows: Array<{ key: keyof NutrientValues; label: string; unit: DraftNipRow['unit']; indented?: boolean }> = [
  { key: 'energy', label: 'Energy', unit: 'kJ' },
  { key: 'protein', label: 'Protein', unit: 'g' },
  { key: 'fat', label: 'Fat, total', unit: 'g' },
  { key: 'saturatedFat', label: 'Saturated', unit: 'g', indented: true },
  { key: 'carbohydrates', label: 'Carbohydrate', unit: 'g' },
  { key: 'sugars', label: 'Sugars', unit: 'g', indented: true },
  { key: 'sodium', label: 'Sodium', unit: 'mg' },
];

/**
 * Schedule 12 permits no more than three significant figures for average nutrient quantities.
 * This implementation chooses Intl's locale-aware rounding, without the optional "less than"
 * substitutions. Internal calculations are never changed by this display formatter.
 */
export function formatNipNutrient(value: number): string {
  if (!Number.isFinite(value) || value < 0) return '';
  if (value === 0) return '0';
  return new Intl.NumberFormat('en-AU', {
    useGrouping: true,
    maximumSignificantDigits: 3,
  }).format(value);
}

function isValidQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MAX_NUTRIENT;
}

export function calculateDraftNip(input: DraftNipInput): DraftNipResult {
  const issues: string[] = [];
  if (!isValidQuantity(input?.finalFinishedWeightGrams)) {
    issues.push('Final finished-product weight must be finite and greater than zero.');
  }
  if (!isValidQuantity(input?.servingWeightGrams)) {
    issues.push('Serving size must be finite and greater than zero.');
  }
  if (!isValidQuantity(input?.servingsPerPackage)) {
    issues.push('Servings per package must be finite and greater than zero.');
  }

  const rowSpecs = input?.includeDietaryFibre
    ? [...baseRows, { key: 'fibre' as const, label: 'Dietary fibre', unit: 'g' as const }]
    : baseRows;
  const rows: DraftNipRow[] = [];
  for (const spec of rowSpecs) {
    const total = input?.totalNutrients?.[spec.key];
    if (typeof total !== 'number' || !Number.isFinite(total) || total < 0 || total > MAX_NUTRIENT) {
      issues.push(`${spec.label} must have a verified finite, non-negative batch value before it can be shown.`);
      continue;
    }
    if (!isValidQuantity(input?.finalFinishedWeightGrams) || !isValidQuantity(input?.servingWeightGrams)) continue;
    const per100g = (total / input.finalFinishedWeightGrams) * 100;
    const perServing = (total / input.finalFinishedWeightGrams) * input.servingWeightGrams;
    if (![per100g, perServing].every((value) => Number.isFinite(value) && value >= 0 && value <= MAX_NUTRIENT)) {
      issues.push(`${spec.label} is outside the supported NIP calculation range.`);
      continue;
    }
    rows.push({
      ...spec,
      perServing,
      per100g,
      perServingText: formatNipNutrient(perServing),
      per100gText: formatNipNutrient(per100g),
    });
  }

  const servingsPerPackageText = isValidQuantity(input?.servingsPerPackage) ? String(input.servingsPerPackage) : '';
  const servingSizeText = isValidQuantity(input?.servingWeightGrams) ? String(input.servingWeightGrams) : '';
  return {
    isValid: issues.length === 0 && rows.length === rowSpecs.length,
    rows,
    issues,
    servingSizeText,
    servingsPerPackageText,
    displayConvention: DISPLAY_CONVENTION,
  };
}
