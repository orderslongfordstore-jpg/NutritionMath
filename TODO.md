# NutritionPro Outcomes

## 1. Calculation correctness and regression coverage — in progress

- Resolve all existing errors, including the non-finite nutrition calculation problem.
- Validate NaN values; Infinity and negative Infinity; negative ingredient quantities; zero quantities; missing nutrient values; invalid recipe weights; invalid serving counts; extremely large numbers; and division by zero.
- Add meaningful regression tests. Do not weaken or delete tests to obtain a pass.
- Keep the existing working calculation implementation where possible; define visible behavior for invalid or unrepresentable inputs rather than silently returning misleading values.

## 2. Ingredient management

- Create, edit and delete ingredients; support ingredient search.
- Store and display nutrient values per 100 g, including energy in kJ, protein, fat, saturated fat, carbohydrates, sugars, sodium, fibre and other supported nutrients.
- Support ingredient categories and allergen information.
- Validate ingredient names, nutrient values, units and per-100-g basis; do not use fake data as a substitute for working data persistence.

## 3. Recipe builder and batch calculations

- Create and edit recipes; add multiple ingredients; enter ingredient quantities in grams.
- Calculate total ingredient weight and total nutrition; scale recipes and batches up or down.
- Calculate nutrition per 100 g and per serving; set serving sizes and number of servings.
- Account for final cooked batch weight where supplied.
- Save recipes and batch calculations with appropriate persistence and ownership.

## 4. Australian Nutrition Information Panels

- Generate Australian-style Nutrition Information Panels using FSANZ requirements as the regulatory reference.
- Display average quantity per serving and per 100 g.
- Correctly calculate energy, protein, fat, saturated fat, carbohydrate, sugars and sodium; include fibre where appropriate.
- Apply applicable rounding and presentation requirements.
- Do not claim regulatory compliance without validating the implementation against the relevant requirements and product-specific facts.

## 5. Food labels and exports

- Generate printable food labels containing product name, serving size, nutrition panel, ingredients declarations, allergen declarations and batch information; support PDF export.
- Provide PDF reports, Excel spreadsheets, ingredient reports, recipe reports, nutrition panels, saved recipes and batch calculations.
- Preserve explicit units, source data and review status. Harden exports against malformed CSV fields and spreadsheet formula injection.

## 6. Supabase authentication, persistence and database security

- Implement registration, login, logout, password reset and secure persistent session handling.
- Support user-specific ingredients and recipes, database persistence, appropriate validation and error handling, and database-enforced Row Level Security.
- Add reviewed database migrations. Inspect and document the actual schema; do not invent an existing schema.
- Do not expose service-role keys or secrets in frontend code.
- Do not modify the existing production Supabase project or its data. Use a separate development/staging configuration until the new application has been tested and approved. The accessible `NutrientsMath` project remains an unconfirmed candidate; no writes or account creation there until its staging status is confirmed.

## 7. Interface and mobile experience

- The finished product must be called NutritionPro.
- Use black, white and yellow branding; provide a clean professional layout, mobile-first design, iPhone-friendly controls, responsive desktop layout and simple navigation.
- Provide easy-to-use ingredient and recipe screens and clear nutrition calculations.
- Avoid a generic dashboard that looks finished but has no working functionality. Every major button and feature must actually work. Do not use fake data as a substitute or leave unfinished placeholder buttons.

## 8. Quality assurance and deployment preparation

- Complete and repeat the relevant validation: `npm ci`, TypeScript checks, all unit tests, nutrition calculation tests, application build, database migration validation, authentication checks, security checks, and mobile/desktop interface checks.
- GitHub Actions must finish successfully. Report the actual workflow URL and commit SHA. Do not claim a test passed unless it was executed and passed.
- Prepare deployment instructions with the correct build command, start command, environment-variable documentation, Supabase setup and migration instructions, and health-check endpoint if required.
- Do not deploy over the existing production NutritionPro website and do not change production environment variables or data.

## 9. Branch, commit and final delivery

- Work only on `development/nutritionpro-foundation`; never push development work to `main`.
- Commit completed changes to GitHub on that development branch and verify each stage before continuing.
- Do not delete useful existing functionality, fabricate test results, or claim completion while required features remain missing.
- Keep a clear record of changes and provide a final report covering inspection, errors found/fixed, completed and incomplete features, latest commit SHA, actual GitHub Actions URL/result, production-build status, whether Supabase staging works, deployment readiness and any remaining approval items.
