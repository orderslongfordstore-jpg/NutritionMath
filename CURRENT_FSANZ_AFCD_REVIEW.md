# Current FSANZ and AFCD review for NutritionPro

**Checked:** 13 November 2026. This is implementation guidance, not legal advice or a product-specific compliance determination. The Federal Register is authoritative; FSANZ consolidated compilations are reference-only and may lag.

## Nutrition Information Panel

The current Federal Register record identifies Standard 1.2.8 compilation F2026C00411 C06 dated 30 April 2026. Standard 1.2.8—6 requires servings per package (or an appropriate unit for variable quantity), average serving quantity, and average nutrient values per serving and per unit quantity. For solids/semi-solids the serving quantity is in grams and the unit quantity is 100 g. Energy and listed nutrients use prescribed units; applicable claim-linked nutrients may add rows. Values are limited to three significant figures. Below-threshold “LESS THAN” text is permitted for particular nutrients; it is not a universal rounding convention. Fibre has a claim-triggered declaration in applicable cases and must follow Schedule 11 calculation rules. [1]

**Unresolved before calling the implementation a literal prescribed panel:** the research extraction did not expose the full Schedule 12 S12—2 table. The exact official heading, row arrangement and alternatives must be verified from the complete instrument/download. The current app's row order is a software implementation based on earlier review; do not present it as a fully validated facsimile until the table is inspected. Claims, exemptions, fibre handling, low-value displays and liquid panels need a product-specific rules review. [1] [2] [3]

## Ingredients, allergens, date marks and identity

The verified Standard 1.2.4 rules require ingredients in descending ingoing weight, with specific rules for names, compound ingredients, water/volatile loss, reconstitution, additives and processing aids. This requires formula and supplier/process facts; sorting partial user entries is not enough. [4] [5]

Standard 1.2.3 and Schedule 9 require allergen names from actual ingredients, additives and processing aids; on ordinary packaged foods there are separate ingredient-list and summary-statement rules. Schedule 9 has specific names, formatting and exemptions. Precautionary “may contain” statements are separate and voluntary; nutrition values cannot establish allergen presence or absence. Currentness should be checked before a legal-rule release. [6] [7] [8]

Use-by versus best-before depends on product safety/quality evidence and package/storage assumptions. The Code specifies date wording and interval-dependent formats. Required storage statements depend on the product's needs; no particular evidence-dossier format was identified in the cited clauses. Do not set shelf life or storage facts from generic ingredient data. [9] [10] [11]

Applicable packaged food labels require the food name, lot identification and supplier name/business address in Australia or New Zealand, subject to exceptions. Lot identification must identify both preparation/packing premises and lot. Australian country-of-origin labelling is a separate Australian Consumer Law system and depends on origin/process facts. [12] [13] [14]

## AFCD source and use

FSANZ's official data-files page lists AFCD Release 3 workbooks for food details, nutrient profiles, recipes, nutrient details, food-group information and a reference list. AFCD values are generic reference composition data, not current branded supplier label data. Preserve food ID, release, units and derivation/source. Missing values are unavailable, not zero. [15] [16] [17]

The AFCD Release 3 overview and current data-files page differ in the listed workbook inventory (Retention Factors versus Reference List). Inspect the actually linked workbooks before designing a production ingestion flow. FSANZ's AFCD Data User Licence Agreement requires attribution and includes ShareAlike, source, changes, limitation/data-country statements and no-endorsement conditions for distributed work; review the licence against the intended application distribution architecture. [18] [19]

The licence's required **Limitation of Data Statement** is: “There are limitations associated with food composition databases. Food composition data used in the database or databases may represent an average of the nutrient content of a particular sample of foods and ingredients, determined at a particular time. The nutrient composition of foods and ingredients can vary substantially between batches and brands because of a number of factors, including changes in season, processing practices and ingredient source, and methods of calculation.” It also requires a statement that the work is based on Australian data and Australian data may not be appropriate in other countries. The exported/profile notice includes these statements and the licence link. [19]

### Official-source recheck — 18 November 2026

FSANZ's currently published consumer NIP page continues to describe average quantities per serving and per 100 g (or per 100 mL for liquids), the core nutrient rows, and extra declarations when a nutrition claim requires them. It describes fibre as not always required and gives examples of claim triggers. This guidance does not replace the Code or resolve all Schedule 12 variants, exemptions or product-specific rules. [20]

The current FSANZ data-files page labels the linked workbook set “AFCD Release 3” and states that nutrient profiles contain 58 values per food; this implementation still ships only a selected four-profile subset. The official licence also expressly states that derivatives may be distributed only under its terms, requires preserving licence/warranty notices, and provides the data “as-is” while disclaiming representations and warranties about content/accuracy subject to applicable law. The in-app/export notice and repository AFCD notice now include the attribution, change description, required data statements, as-is warranty disclaimer and licence URL. [19] [21]

## Sources

[1]: https://www.legislation.gov.au/F2015L00395/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.8 – Nutrition information requirements"
[2]: https://www.legislation.gov.au/F2015L00481/latest/text "Australia New Zealand Food Standards Code – Schedule 11 – Calculation of values for nutrition information panel"
[3]: https://www.legislation.gov.au/F2015L00482/latest/text "Australia New Zealand Food Standards Code – Schedule 12 – Nutrition information panels"
[4]: https://www.legislation.gov.au/F2015L00392/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.4 – Statement of ingredients"
[5]: https://www.foodstandards.gov.au/consumer/labelling/ingredients "Ingredient lists and percentage labelling"
[6]: https://www.legislation.gov.au/F2015L00397/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.3 – Allergen and other declarations"
[7]: https://www.legislation.gov.au/F2015L00479/latest/text "Australia New Zealand Food Standards Code – Schedule 9 – Mandatory declarations"
[8]: https://www.foodstandards.gov.au/consumer/labelling/allergen-labelling "Allergen labelling for consumers"
[9]: https://www.legislation.gov.au/F2015L00401/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.5 – Date marking"
[10]: https://www.legislation.gov.au/F2015L00393/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.6 – Directions for use and storage"
[11]: https://www.foodstandards.gov.au/consumer/labelling/dates "Use-by and best-before dates"
[12]: https://www.legislation.gov.au/F2015L00386/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.1 – Labelling requirements"
[13]: https://www.legislation.gov.au/F2015L00389/latest/text "Australia New Zealand Food Standards Code – Standard 1.2.2 – Food identification"
[14]: https://www.foodstandards.gov.au/consumer/labelling/coo "Country of origin labelling"
[15]: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files "Australian Food Composition Database data files"
[16]: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/about-afcd "About the Australian Food Composition Database"
[17]: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/branded-food-database "Australian Branded Food Database"
[18]: https://www.foodstandards.gov.au/sites/default/files/2025-12/About%20the%20Australian%20Food%20Composition%20Database%20-%20Release%203.pdf "About the Australian Food Composition Database – Release 3"
[19]: https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement "AFCD Data User Licence Agreement"
[20]: https://www.foodstandards.gov.au/consumer/labelling/panels "Nutrition information panels — current FSANZ consumer guidance, updated 20 October 2025"
[21]: https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files "AFCD data files — current official workbook list, updated 23 December 2025"
