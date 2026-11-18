import { describe, expect, it } from 'vitest';
import { normalizeMassToGrams } from './units';

describe('normalizeMassToGrams', () => {
  it('converts only exact g/kg mass quantities to grams', () => {
    expect(normalizeMassToGrams(7.2, 'kg')).toBe(7200);
    expect(normalizeMassToGrams(160, 'g')).toBe(160);
    expect(normalizeMassToGrams(8, 'L')).toBeNull();
    expect(normalizeMassToGrams(3, 'cup')).toBeNull();
    expect(normalizeMassToGrams(4, 'tablespoon')).toBeNull();
    expect(normalizeMassToGrams(1, 'bunch')).toBeNull();
  });

  it('rejects negative, non-finite and overflowing mass values', () => {
    expect(normalizeMassToGrams(-1, 'g')).toBeNull();
    expect(normalizeMassToGrams(Number.NaN, 'g')).toBeNull();
    expect(normalizeMassToGrams(Number.POSITIVE_INFINITY, 'kg')).toBeNull();
    expect(normalizeMassToGrams(Number.MAX_SAFE_INTEGER, 'kg')).toBeNull();
  });
});
