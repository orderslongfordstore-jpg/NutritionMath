import {
  afcdChickenBreastRaw,
  afcdScrambledEggWithMilkPrepared,
  afcdTapWater,
  afcdWhiteRiceUncooked,
} from './afcdProfiles';
import type { Ingredient } from '../types';

export const AFCD_RELEASE_3_SOURCE = 'https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files';

/** A deliberately small offline reference sample; not the complete AFCD or a branded-food catalogue. */
export const AFCD_REFERENCE_CATALOG: Ingredient[] = [
  { ...afcdChickenBreastRaw, category: 'Meat and poultry', sourceType: 'afcd', sourceReference: 'AFCD Release 3.0; Public Food Key F002594; Nutrient Profiles, All solids & liquids per 100 g', sourceUrl: AFCD_RELEASE_3_SOURCE, sourceStatus: 'source-checked' },
  { ...afcdWhiteRiceUncooked, category: 'Grains', sourceType: 'afcd', sourceReference: 'AFCD Release 3.0; Public Food Key F007682; Nutrient Profiles, All solids & liquids per 100 g', sourceUrl: AFCD_RELEASE_3_SOURCE, sourceStatus: 'source-checked' },
  { ...afcdTapWater, category: 'Water and beverages', sourceType: 'afcd', sourceReference: 'AFCD Release 3.0; Public Food Key F009527; Nutrient Profiles, All solids & liquids per 100 g', sourceUrl: AFCD_RELEASE_3_SOURCE, sourceStatus: 'source-checked' },
  { ...afcdScrambledEggWithMilkPrepared, category: 'Prepared foods', sourceType: 'afcd', sourceReference: 'AFCD Release 3.0; Public Food Key F003732; composite recipe profile; not a branded product', sourceUrl: AFCD_RELEASE_3_SOURCE, sourceStatus: 'source-checked' },
];

export function getAfcdReferenceCopy(ingredientId: string): Ingredient | undefined {
  const match = AFCD_REFERENCE_CATALOG.find((ingredient) => ingredient.id === ingredientId);
  return match
    ? { ...match, allergens: [] }
    : undefined;
}
