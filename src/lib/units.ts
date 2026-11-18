export type MassUnit = 'g' | 'kg';

/** Converts only supported mass units. Volume and household measures have no implicit density. */
export function normalizeMassToGrams(value: number, unit: MassUnit | string): number | null {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) return null;
  if (unit === 'g') return value;
  if (unit === 'kg') {
    const grams = value * 1000;
    return Number.isFinite(grams) && grams <= Number.MAX_SAFE_INTEGER ? grams : null;
  }
  return null;
}
