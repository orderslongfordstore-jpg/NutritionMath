# NutritionMath development roadmap

NutritionMath is an independent Australian nutrition, food production and labelling platform. Work proceeds one stage at a time; completion and approval of each stage precedes the next. Later features described here are planned, not available in Stage 1.

1. **Foundation, branding, authentication and dashboard:** Establish the React/TypeScript/Vite client, Node/Express server, Supabase Authentication, responsive dashboard, configuration, basic security, tests and build. The user-approved separate NutritionMath Supabase project has been created in Sydney and configured locally. Do not modify the former shared NutritionPro project or its users, passwords, settings or data. Verify the independent project's redirect and email configuration and complete live authentication tests before calling Stage 1 fully verified.
2. **Ingredients and suppliers:** Business-team-shared ingredient and supplier records, source and units, missing nutrients represented as NULL, supplier and product data, and secure workspace membership and cross-business access controls.
3. **Recipe builder and calculation engine:** Independently tested, shared nutrition calculation engine; ingredient weights, editable recipes, scaling and servings; incomplete calculations when source nutrient values are missing. Use the documented weight/100 × per-100 g contribution, divide totals by the finished edible batch weight × 100, and calculate per-serving values from per-100 g values.
4. **Production batches:** Batch records, processing/yield adjustments, finished edible weights and traceability.
5. **Australian Nutrition Information Panels:** Per-serving and per-100 g quantities, configurable documented rounding, missing-data warnings, and regulatory verification. Do not claim compliance without verification.
6. **Food label designer:** Product and ingredient declarations, allergen information, storage instructions, batch identification, print layouts and PDF generation.
7. **Costing and profitability:** Ingredient costs, recipe and production costs, margins and related reporting.
8. **Import, export and reporting:** Validated data import, reports and spreadsheet exports with explicit provenance and data quality.
9. **Security, traceability and comprehensive testing:** Review isolation, access controls, auditability and regression/security coverage across the application.
10. **Production deployment and final verification:** Render deployment configuration, production environment and secrets, operational checks, final verification and release documentation.

## Data and regulatory notes

The project-shared FSANZ Nutrition Panel Calculator dataset document is explanatory material, not the food-level dataset itself. A later import must use the companion Food Details and Nutrient Profiles data, preserve source attribution and per-100 g edible-portion units, and distinguish the dataset's available-carbohydrate conventions from other sources. Seven mandatory nutrients are covered by that dataset; dietary fibre cannot be assumed to be zero. Never silently convert a missing value to zero or present calculated labels as legally verified.
