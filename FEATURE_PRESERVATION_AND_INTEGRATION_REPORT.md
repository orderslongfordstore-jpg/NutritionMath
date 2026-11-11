# NutritionPro Feature-Preservation and Integration Report

**Updated:** 12 November 2026
**Development branch:** `development/nutritionpro-foundation`
**Application-code milestone:** `aaa1bccbae41438e86edbdd620530038e5525cda`
**Scope:** Continue the NutritionPro development foundation without changing the live Render service or any Supabase project.

## Executive summary

The accessible branch now has a guarded native Supabase Auth client foundation, session-local ingredient CRUD and recipe calculations, and genuine browser-generated XLSX/PDF exports for supported draft data. It remains a prototype: there is no approved or configured staging Supabase project, no remote registration/login test, no database persistence or RLS integration, no validated FSANZ Nutrition Information Panel (NIP), and no production deployment.

The application code and its dependency manifest contain no Manus OAuth provider, Manus callback route, or Manus authentication dependency. That finding is limited to this accessible development source. The live Render application and its existing settings were not changed, and their current authentication behavior has not been reverified in this development stage.

The XLSX and PDF outputs are limited to ingredient data and an internal recipe-calculation worksheet. They are explicitly not compliant consumer labels or validated NIPs. Existing arithmetic in `src/lib/nutrition.ts` was reused unchanged for these exports.

## Source identity and access limits

The user-designated development source is `orderslongfordstore-jpg/NutritionMath`, branch `development/nutritionpro-foundation`. The user confirmed that this is the authorized development foundation, not verified original production source code. The supplied `orderslongfordstore-jpg/nutritionPro` URL previously returned 404 through the connected GitHub access. Historical inspection found the Render-linked repository's `main` snapshot did not contain the app source present on this development branch. Therefore, the development source cannot be certified as identical to the code serving the live URL `https://nutritionpro.onrender.com`.

The supplied production Supabase project `nfzsjmzpiweeqtkypcgn` was not accessible to the connected Supabase tools in the prior audit. Its schema, users, records, Auth configuration and RLS policies therefore remain unverified. The separate `NutrientsMath` project `ndvjrsegapfhnhrjypck` was explicitly rejected for NutritionPro staging. Historical read-only inspection recorded tables and deny-all policies there, but it is not authorized and was not contacted or modified in this development continuation. No staging project is approved.

No Render environment settings, production database records, GitHub `main` branch or live deployment were modified. No production deployment was attempted.

## Current feature status

| Area | Current development-branch state | Still incomplete / not verified |
|---|---|---|
| Manus authentication | No Manus auth provider, callback route or SDK/dependency is present in application source or its package manifest. | This does not alter or prove the configuration of the live Render service, which remains untouched. |
| Supabase Auth | Client flows exist for email/password sign-in, registration, session restoration, sign-out, password recovery and password update. PKCE is configured; protected workspaces fail closed when public Supabase configuration is absent. | Uses `@supabase/supabase-js` browser storage (`persistSession`), not `@supabase/ssr` or an HttpOnly cookie session. Forms are disabled with blank config. All Auth tests are mocked; real Auth is unverified. |
| Ingredient management | Session-local create/edit/delete/search with per-100-g nutrient validation and allergen text. CSV export remains formula-injection hardened; XLSX ingredient export is available. | No database persistence, categories or verified source/provenance model. No import workflow or ingredient PDF export. |
| Recipes and calculation | Current draft supports ingredient lines, gram quantities, servings, totals per serving/per 100 g and invalid-input warnings. | Recipes are not named, saved or restored. No production batch records, scale-up/down, cooked-yield adjustment, lot traceability or persistence. |
| XLSX/PDF exports | Client-generated `.xlsx` ingredient workbook, recipe calculation workbook, and recipe calculation PDF. The workbook/PDF carry a non-regulatory disclaimer and use the existing calculation engine. | No workbook/report export for NIPs, batches or labels; no consumer-label PDF. These outputs do not establish regulatory compliance. |
| Australian NIP / labels | Internal arithmetic preview and an honest empty label state; calculations are not described as a compliant NIP. | No formal FSANZ display rounding/formatting, product/yield validation, verified ingredient/allergen declaration or reviewed printable label. |
| UI and mobile | Responsive black/white/yellow styling and protected workspaces are present. Historical smoke test at 390×844 covered earlier dashboard, ingredient and recipe paths. | The 390×844 smoke test was not repeated after adding export controls. Final authenticated/data-backed breakpoints and accessibility are not yet verified. |

## Authentication and security details

The browser client reads only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the checked-in `.env.example` placeholders remain blank. No service-role key is used or present in application source. The browser client sets `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`, and `flowType: 'pkce'`. Because this is a Vite single-page app, current session persistence uses the Supabase JS browser-storage behavior; it should not be described as an `@supabase/ssr` cookie-backed implementation.

The login/register/recovery/update/logout component tests use mocked Supabase methods and do not contact any Supabase project. A real account lifecycle, callback URL allow-list, database access, RLS enforcement and negative cross-user access have not been tested. No database migrations or schema changes were made.

## Export implementation and dependency checks

`src/lib/exports.ts` dynamically loads ExcelJS to create real `.xlsx` files in the browser and jsPDF to produce a recipe draft PDF. Export functions reuse `calculateRecipeTotals`, `calculateIngredientNutrition` and `roundToTwo`; they do not replace or alter the existing nutrition math. Spreadsheet text beginning with formula characters is prefixed safely, and PDF text is sanitized before rendering.

ExcelJS is lazy-loaded. The production build therefore reports a separate approximately 939 kB minified / 271 kB gzip ExcelJS chunk; the Vite build succeeds, but this is a known download-size trade-off to review. An npm audit found a moderate advisory in ExcelJS's transitive `uuid` dependency; the manifest now pins its compatible CommonJS dependency to patched `uuid@11.1.1`. `npm audit --omit=dev` then reported zero vulnerabilities.

First-party references used for these implementation choices include [ExcelJS browser documentation](https://www.npmjs.com/package/exceljs), [jsPDF browser usage and `doc.save`](https://github.com/parallax/jsPDF), and the [uuid security advisory](https://github.com/advisories/GHSA-w5hq-g745-h8pq). These library sources do not constitute nutrition-regulatory guidance.

## Files changed in the latest application-code milestone

- `src/lib/exports.ts` and `src/lib/exports.test.ts`: browser XLSX/PDF builders, safe text handling and file-download functions.
- `src/App.tsx`: guarded async export actions and status messages.
- `src/components/IngredientManager.tsx` and `src/components/IngredientManager.test.tsx`: ingredient XLSX control and UI tests.
- `src/components/RecipeBuilder.tsx` and `src/components/RecipeBuilder.test.tsx`: recipe XLSX/PDF controls and UI tests.
- `package.json` and `package-lock.json`: pinned ExcelJS/jsPDF dependencies and patched UUID override.

The preceding Auth milestone changed `src/lib/supabase.ts`, `src/context/AuthContext.tsx`, `src/components/AuthPanel.tsx`, `src/main.tsx`, `src/App.tsx`, styling, tests and development documentation. Auth code is committed at `d2950e293b0386585bd4a35d1d23e28a48ff9c7a`; the export milestone is committed at `aaa1bccbae41438e86edbdd620530038e5525cda`.

## Validation record

| Check | Result |
|---|---|
| `npm test` on export milestone | Passed: 32 tests across 7 test files, including 19 calculation cases, mocked Auth flows, export workbook/PDF generation, formula-safe data and export controls. |
| `npm run build` | Passed: TypeScript and Vite production build succeeded. Vite emitted the noted separate ExcelJS chunk-size warning. |
| `npm audit --omit=dev` | Passed after UUID override: 0 production/runtime vulnerabilities reported. |
| `git diff --check` | Passed before the export commit. |
| GitHub Actions – Auth milestone `d2950e2` | Passed; [run 43114463371](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43114463371). |
| GitHub Actions – XLSX/PDF milestone `aaa1bcc` | Passed; [run 43116172481](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43116172481). |
| Real Supabase registration/login/recovery, DB CRUD, RLS and production logs | Not tested; no staging project is approved and the specified production project remains inaccessible. |
| Render/production deployment | Not performed. |

## Remaining work and safe sequence

1. Wait for the user to provide or explicitly approve a separate, non-production Supabase project. Do not use either `nfzsjmzpiweeqtkypcgn` or the rejected `ndvjrsegapfhnhrjypck` for this work.
2. Once authorized, inspect that staging project's schema and Auth settings, design an additive ownership model/migration, and test registration, login, recovery, session behavior and RLS denial between users. Do not infer production schema or migrate existing accounts by email without a verified plan.
3. Implement persistence against the approved staging schema and preserve the established calculation engine. Add saved recipes/batches and final-yield handling only with reviewed domain requirements.
4. Research and implement FSANZ Schedule 12 presentation/rounding rules in a separate tested change before generating any label-like output. Keep draft warnings and provenance visible; obtain appropriate product-specific review.
5. Recheck iPhone layouts, accessibility, export behavior and build size after the final workflows exist. Report exact Render environment requirements only after staged tests pass. Do not change production configuration, merge to `main` or deploy without explicit approval.

## Regulatory references already identified for later review

The earlier research record identified official sources including [Food Standards Australia New Zealand Standard 1.2.8](https://www.legislation.gov.au/F2015L00395/latest/text), [Schedule 12](https://www.legislation.gov.au/F2015L00482/latest/text), [Schedule 11](https://www.legislation.gov.au/F2015L00481/latest/text), [Standard 1.2.4 (ingredients)](https://www.legislation.gov.au/F2015L00392/latest/text), [Standard 1.2.3 (allergen declarations)](https://www.legislation.gov.au/F2015L00397/latest/text), and [FSANZ allergen-labelling guidance](https://www.foodstandards.gov.au/business/labelling/allergen-labelling). A product's classification, preparation state, claims and supplied data can affect requirements; this report and the current prototype are not a product-specific legal or compliance determination.
