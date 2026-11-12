# Australian Food-Labelling Implementation Baseline

**Research checked:** 12 November 2026
**Scope:** Draft software behavior for NutritionPro; not legal advice or a product-specific compliance determination.

## Nutrition Information Panel

For packaged food subject to the Code’s labelling provisions, the default NIP rules require the Schedule 12 structure unless an exemption or special-purpose format applies. The applicability decision is product- and claim-dependent, so do not force one NIP format for every food. The ordinary S12—2 panel has the heading “NUTRITION INFORMATION”, servings per package, serving size, and columns for quantity per serving and per 100 g or 100 mL. The unit quantity is 100 g for solid/semi-solid food and 100 mL for beverages/other liquids. The ordinary row order is Energy; Protein; Fat, total, with saturated fat as a sub-row; Carbohydrate, with sugars as a sub-row; Sodium; then claim-triggered other nutrients or substances. Units are prescribed by nutrient. [1] [2]

Dietary fibre is not a routine row in the ordinary S12—2 panel. Certain claims about fibre, sugars or other carbohydrate trigger the S12—3 declaration; if fibre is absent when the declaration is required, the Code says to show “0”. Other claims and calculation methods can trigger additional information, including specified fatty acids, unavailable carbohydrate, phytosterols, galactose, potassium or omega-3 values. These triggers must remain conditional, not become a universal row set. [1] [2] [3]

The binding display rule is **no more than three significant figures** for average energy and nutrient/bioactive quantities. The Code does not establish a general decimal-place rule or a universal rounding/tie-breaking method. It permits specified low-value expressions: energy below 40 kJ may be shown as “LESS THAN 40 kJ”; listed macronutrient/fatty-acid/fibre values below 1 g may be shown as “LESS THAN 1 g”; sodium or potassium below 5 mg may be shown as “LESS THAN 5 mg”. Each comparison is made separately for the serving and unit-quantity values, and the alternatives are permitted rather than mandatory. When fibre declaration is required and absent, “0” is specifically required. [1]

FSANZ’s older Nutrition Panel Calculator notes describe its own three-significant-figure method, including a ties-to-even note, and nutrient-specific decimal display conventions. Those are calculator conventions, not additional universal Code requirements or analytical tolerances. NutritionPro must retain precise internal calculations, keep any chosen display method explicit, and must not label calculator conventions as statutory rules. [4]

## Ingredients and allergens

A statement of ingredients is generally required for food for sale under the relevant labelling rules, subject to stated exceptions. Ingredients are named using an allowed common, true-nature or conditional generic name and are listed in descending order of ingoing weight. Compound-ingredient breakdown, reconstitution, water/volatile ingredients, additives and processing aids have their own conditions. A named compound ingredient at 5% or more generally requires all components in brackets; below 5%, specified mandatory-declaration ingredients and additives performing a technological purpose in the final food remain relevant. Infant food has a different rule. Additives use the applicable class name and permitted additive name/code, subject to special cases. [7] [11] [12] [13]

An ingredient database can suggest names and calculate an ordering only from verified formula weights and supplier/process information. It cannot establish what was actually used, removed or processed, whether an additive’s technological purpose remains in the final food, or whether a compound-ingredient exception applies. Keep the product’s declared ingredient text reviewable and linked to its source facts.

Schedule 9 foods and derivatives must be declared when present as ingredients—including components of compound ingredients—as food additives or their components, or as processing aids or their components, subject to specific exemptions. Covered foods include added sulphites at 10 mg/kg or more; gluten-containing barley, oats and rye; wheat whether or not it contains gluten; named tree nuts; crustacea; egg; fish; lupin; milk; marine mollusc; peanut; sesame seed; and soybean. Schedule 9’s exact required names depend on whether the declaration is in the ingredient list or elsewhere. The Code requires the allergen name to be bold in the ingredient statement, with specified size, contrast and adjacency rules. A separate “Contains” statement must list the required names and no other words, in the same field of view as and directly next to—but distinctly separated from—the ingredient statement. [9] [10]

Do not infer allergen presence, absence, gluten status, sulphite thresholds, exemptions or cross-contact from nutrient values. Collect verified supplier and formulation facts. FSANZ describes precautionary allergen labelling (“may contain”) as voluntary and unregulated; keep it separate from the mandatory “Contains” declaration. [16] [17] [18]

## Date marking, storage and lot identification

Where date-marking information is required, use-by is the mark when the food is estimated not to be safe to consume after that date; otherwise best-before is the default. A limited bread alternative exists for bread with a shelf life under seven days. Food must not be sold after its use-by date. The Code specifies wording and date-component format, with narrow exceptions such as the two-year best-before rule (not for infant formula), an individual ice-cream/ice-confection portion, and a limited small-package rule. Do not treat these as broad category exemptions. [19] [21]

Storage/use directions are required when needed to ensure the food keeps until its date mark or when health or safety requires the directions. The Code does not give a universal shelf-life formula; the responsible supplier needs product-specific evidence to choose and substantiate the date and storage assumptions. Software must not infer a safe shelf life from generic ingredient data. [20] [22]

Where the labelling provisions require lot identification, the Code definition is a number or other information identifying both the premises where the food was prepared or packed and the lot it belongs to. The cited provisions do not prescribe a universal literal label word, code syntax or lot-specific position. The two stated exceptions are narrow. FSANZ recommends additional internal traceability records, but those operational recommendations are not all mandatory consumer-label fields. [24] [25] [26]

## Implementation boundary

NutritionPro can calculate draft values from verified ingredients, batch inputs, measured final yield and explicitly recorded discarded material. It cannot establish product classification, label applicability, an exemption, a legally sufficient ingredient/allergen declaration, a validated use-by/best-before date, absence of cross-contact or correct final artwork by arithmetic alone. Generated output must remain visibly marked **DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE** until a responsible person reviews the product facts and final artwork. The application must not claim FSANZ compliance.

The current researched standards and claims are an implementation baseline, not a complete product-specific regulatory audit. Before any commercial release, re-check the authoritative Federal Register text and all relevant schedules/food-specific standards for the actual prepared-meal product, package, claims and sale channel.

## Research limitations to resolve before production release

The research confirmed the key operative NIP text in Standard 1.2.8 and Schedule 12, but Schedule 11 S11—2(3) and Schedule 13’s small-package particulars were not independently opened for this pass. The ingredient/additive research referenced Schedules 10, 7 and 8 without independently confirming each table. The allergen research did not independently open the current Standard 1.2.1 packaging-specific text. The lot research inspected a 2024 Standard 1.2.2 compilation but did not confirm whether a later compilation changes those clauses. These are explicit verification gaps, not findings that the provisions are absent. Re-open the authoritative current text and relevant tables before implementing exception-specific compliance logic.

## References

[1]: https://www.legislation.gov.au/F2015L00395/latest/text "Australia New Zealand Food Standards Code Standard 1.2.8 Nutrition information requirements"
[2]: https://www.legislation.gov.au/F2015L00482/latest/text "Australia New Zealand Food Standards Code Schedule 12 Nutrition information panels"
[3]: https://www.legislation.gov.au/F2015L00481/latest/text "Australia New Zealand Food Standards Code Schedule 11 Calculation of values for nutrition information panel"
[4]: https://www.foodstandards.gov.au/sites/default/files/2023-12/npc-explanatory-notes-2011.pdf "Nutrition Panel Calculator Explanatory Notes"
[5]: https://www.foodstandards.gov.au/consumer/labelling/panels "Nutrition information panels"
[6]: https://www.foodstandards.gov.au/food-standards-code/legislation "Food Standards Code legislation"
[7]: https://www.legislation.gov.au/F2015L00392/latest/text "Australia New Zealand Food Standards Code Standard 1.2.4 Statement of ingredients"
[8]: https://www.legislation.gov.au/F2015L00386/latest/text "Australia New Zealand Food Standards Code Standard 1.2.1 Requirements to have labels or otherwise provide information"
[9]: https://www.legislation.gov.au/F2015L00397/2024-10-29/2024-10-29/text/original/epub/OEBPS/document_1/document_1.html "Australia New Zealand Food Standards Code Standard 1.2.3 Warning statements advisory statements and declarations"
[10]: https://www.legislation.gov.au/F2015L00479/2021-02-25/2021-02-25/text/original/epub/OEBPS/document_1/document_1.html "Australia New Zealand Food Standards Code Schedule 9 Mandatory advisory statements and declarations"
[11]: https://www.legislation.gov.au/F2015L00480/latest/text "Australia New Zealand Food Standards Code Schedule 10 Generic names of ingredients"
[12]: https://www.legislation.gov.au/F2015L00477/latest/text "Australia New Zealand Food Standards Code Schedule 7 Food additive class names"
[13]: https://www.legislation.gov.au/F2015L00478/latest/text "Australia New Zealand Food Standards Code Schedule 8 Food additive names and code numbers"
[14]: https://www.foodstandards.gov.au/consumer/labelling/ingredients "Ingredient lists and percentage labelling"
[15]: https://www.foodstandards.gov.au/consumer/labelling/Labelling-of-food-additives "Food additive labelling"
[16]: https://www.foodstandards.gov.au/business/labelling/allergen-labelling "Allergen labelling for food businesses"
[17]: https://www.foodstandards.gov.au/consumer/foodallergies/Allergen-labelling-exemptions "Product exemptions from allergen labelling"
[18]: https://www.foodstandards.gov.au/consumer/foodallergies/food-allergen-portal/Information-for-health-professionals "Information for health professionals"
[19]: https://www.legislation.gov.au/F2015L00401/latest/text "Australia New Zealand Food Standards Code Standard 1.2.5 Date marking of food for sale"
[20]: https://www.legislation.gov.au/F2015L00393/latest/text "Australia New Zealand Food Standards Code Standard 1.2.6 Directions for use and storage"
[21]: https://www.foodstandards.gov.au/sites/default/files/2026-10/Food%20Standards%20Code%20-%20Compilation%20%28October%202026%29.pdf "Food Standards Code Compilation October 2026 reference compilation"
[22]: https://www.foodstandards.gov.au/consumer/labelling/dates "Use-by and best-before dates"
[23]: https://www.foodstandards.gov.au/news/we-hear-you-lets-clear-confusion-around-food-date-labels "Food date labels clarification"
[24]: https://www.legislation.gov.au/F2015L00389/latest/text "Australia New Zealand Food Standards Code Standard 1.2.2 Food identification"
[25]: https://www.legislation.gov.au/F2015L00385/2026-06-09/2026-06-09/text/original/epub/OEBPS/document_1/document_1.html "Australia New Zealand Food Standards Code Standard 1.1.2 Definitions"
[26]: https://www.foodstandards.gov.au/business/food-safety/food-traceability "Food traceability"
