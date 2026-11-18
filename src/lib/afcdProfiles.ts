import type { Ingredient } from '../types';

/**
 * AFCD Release 3.0 profiles per 100 g from FSANZ's All solids & liquids per 100 g sheet.
 * Keys, values and provenance notes are recorded in AFCD_TEST_FIXTURE_NOTES.md.
 * Empty allergen arrays are intentionally not interpreted as allergen-free claims.
 */
export const afcdChickenBreastRaw: Ingredient = {
  id: 'afcd-F002594', name: 'Chicken, breast, lean flesh, raw', energy: 412, protein: 22.5,
  carbohydrates: 0, sugars: 0, fat: 0.8, saturatedFat: 0.25, sodium: 48, fibre: 0, servingSize: 100, allergens: [],
};

export const afcdWhiteRiceUncooked: Ingredient = {
  id: 'afcd-F007682', name: 'Rice, white, uncooked', energy: 1422, protein: 7,
  carbohydrates: 74, sugars: 0, fat: 0.9, saturatedFat: 0.17, sodium: 1, fibre: 0.8, servingSize: 100, allergens: [],
};

export const afcdTapWater: Ingredient = {
  id: 'afcd-F009527', name: 'Water, tap', energy: 0, protein: 0,
  carbohydrates: 0, sugars: 0, fat: 0, saturatedFat: 0, sodium: 3, fibre: 0, servingSize: 100, allergens: [],
};

/** Published AFCD composite recipe profile, not the result of NutritionPro's process model. */
export const afcdScrambledEggWithMilkPrepared: Ingredient = {
  id: 'afcd-F003732', name: "Egg, chicken, whole, scrambled, with regular fat cow's milk, no fat added",
  energy: 504, protein: 10.8, carbohydrates: 2.1, sugars: 2, fat: 7.7,
  saturatedFat: 2.55, sodium: 128, fibre: 0, servingSize: 100, allergens: [],
};
