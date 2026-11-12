# Australian Food Composition Database test-fixture source

**Dataset:** Food Standards Australia New Zealand (FSANZ), Australian Food Composition Database (AFCD), Release 3.0. The workbook files are available from the official [FSANZ data-files page](https://www.foodstandards.gov.au/data-files). The inspected files were the [Food Details workbook](https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Food%20Details.xlsx), [Nutrient Profiles workbook](https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Nutrient%20profiles.xlsx), and [Recipes workbook](https://www.foodstandards.gov.au/sites/default/files/2025-12/AFCD%20Release%203%20-%20Recipes.xlsx).

The nutrient figures below are per 100 g from the `All solids & liquids per 100 g` sheet. The recipe file was used to inspect ingredient weights and yield for AFCD recipe F003732. Values are dataset evidence, not supplier-specific facts for any commercial product. Empty allergen arrays in the test fixture are placeholders only; AFCD nutrient records do not establish allergen status.

| AFCD key and food | Derivation | Energy with dietary fibre equated (kJ) | Protein (g) | Available carbohydrate without sugar alcohols (g) | Total sugars (g) | Total fat (g) | Total saturated fatty acids, equated (g) | Sodium (mg) | Dietary fibre (g) |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| F002594 — Chicken, breast, lean flesh, raw | Analysed | 412 | 22.5 | 0 | 0 | 0.8 | 0.25 | 48 | 0 |
| F007682 — Rice, white, uncooked | Analysed | 1,422 | 7 | 74 | 0 | 0.9 | 0.17 | 1 | 0.8 |
| F009527 — Water, tap | Analysed | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 0 |
| F003732 — Egg, chicken, whole, scrambled, with regular-fat cow's milk, no fat added | Recipe | 504 | 10.8 | 2.1 | 2 | 7.7 | 2.55 | 128 | 0 |

AFCD recipe F003732 comprises 0.2 g ground black pepper (F006618), 45 g regular-fat cow's milk (F005634), and 102 g raw whole egg (F003729), with a reported total weight change of −10%. AFCD's prepared composite profile F003732 is therefore included as a separate per-100-g engine benchmark, not as proof that NutritionPro's current batch model reproduces AFCD's process/retention calculations. The model currently assumes nutrient retention except for explicitly recorded discarded materials, and applies no AFCD retention factors.

The chicken-and-rice batch fixture uses 400 g chicken, 200 g uncooked rice and 400 g tap water, with an 850 g measured cooked weight, 50 g discarded-output quantity and 400 g portion. Those quantities are illustrative test inputs, not an AFCD-published recipe or a validated cooking-yield study. The synthetic 50 g drained-output nutrient profile exists only to test explicit nutrient subtraction; it is not an AFCD record or production example.
