export const AFCD_ATTRIBUTION = 'Australian Food Composition Database (AFCD), Release 3.0, Food Standards Australia New Zealand (FSANZ).';
export const AFCD_LICENSE_URI = 'https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement';
export const AFCD_AUSTRALIAN_DATA_NOTICE = 'This work is based on Australian data. Australian data may not be appropriate for use in other countries.';
export const AFCD_CHANGE_NOTICE = 'NutritionPro includes a selected four-profile subset of AFCD Release 3.0, with NutritionPro identifiers and category/source metadata added. The subset is not the complete AFCD. Nutrient values are copied as generic composition references; AFCD does not establish brand/SKU composition or allergen status.';
export const AFCD_LIMITATION_STATEMENT = 'There are limitations associated with food composition databases. Food composition data used in the database or databases may represent an average of the nutrient content of a particular sample of foods and ingredients, determined at a particular time. The nutrient composition of foods and ingredients can vary substantially between batches and brands because of a number of factors, including changes in season, processing practices and ingredient source, and methods of calculation.';
export const AFCD_WARRANTY_DISCLAIMER = 'AFCD data is provided “as-is”. Except where stated in the Data User Licence Agreement or otherwise agreed in writing, FSANZ makes no representations, warranties or conditions concerning the contents or accuracy of the Work, including errors whether or not discoverable, to the full extent permitted by applicable law.';

export const AFCD_DISTRIBUTION_NOTICE = [
  AFCD_ATTRIBUTION,
  AFCD_CHANGE_NOTICE,
  AFCD_AUSTRALIAN_DATA_NOTICE,
  AFCD_LIMITATION_STATEMENT,
  AFCD_WARRANTY_DISCLAIMER,
  `AFCD Data User Licence Agreement: ${AFCD_LICENSE_URI}`,
].join(' ');
