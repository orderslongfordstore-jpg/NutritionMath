# Australian Food Composition Database (AFCD) data notice

This notice applies to the selected AFCD-derived nutrient values in `src/lib/afcdProfiles.ts` and the reference catalog in `src/lib/afcdCatalog.ts`. It does not represent that unrelated NutritionPro code or user-entered data is AFCD material.

## Attribution and changes

**Australian Food Composition Database (AFCD), Release 3.0, Food Standards Australia New Zealand (FSANZ).** Source: [official FSANZ AFCD data files](https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files). Food keys and field mappings are documented in [`AFCD_TEST_FIXTURE_NOTES.md`](AFCD_TEST_FIXTURE_NOTES.md).

NutritionPro reproduces a selected four-profile subset of AFCD Release 3.0, assigns NutritionPro identifiers and source/category metadata, and provides a small importable generic-food reference catalog. It is not the complete AFCD. The values are generic food-composition references, not measurements or nutrition-panel data for any branded SKU. Empty allergen arrays are placeholders and do not assert allergen absence. Other changes, product-specific interpretations and processing assumptions are not supplied by AFCD.

## Required data statements

> There are limitations associated with food composition databases. Food composition data used in the database or databases may represent an average of the nutrient content of a particular sample of foods and ingredients, determined at a particular time. The nutrient composition of foods and ingredients can vary substantially between batches and brands because of a number of factors, including changes in season, processing practices and ingredient source, and methods of calculation.

This work is based on Australian data. Australian data may not be appropriate for use in other countries.

## Licence

The AFCD-derived subset in this repository is distributed under the FSANZ licence based on [Creative Commons Attribution-ShareAlike 3.0 Australia](https://creativecommons.org/licenses/by-sa/3.0/au/deed.en). The full [FSANZ AFCD Data User Licence Agreement](https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement) requires attribution and that AFCD derivatives remain under that licence; it also requires the limitation and Australian-data statements, preservation of notices, and allows recipients to exercise the same licence rights. It prohibits implying FSANZ endorsement and technological restrictions inconsistent with recipient rights. These conditions apply to AFCD-derived material, not unrelated NutritionPro code or user-provided data; they do not make the whole application licensed under CC BY-SA. The licence provides AFCD data “as-is” and disclaims warranties about contents and accuracy, subject to applicable law. Consult the full agreement before redistribution or changing delivery of AFCD-derived data.

**No FSANZ sponsorship, endorsement, connection, warranty or approval is stated or implied.** The FSANZ logo and Commonwealth coat of arms are not used.

The in-app AFCD catalog notice and AFCD-containing ingredient exports carry the attribution, changes, limitation statement, Australian-data statement and licence URI. Ingredient exports distinguish AFCD profiles from branded supplier records.
