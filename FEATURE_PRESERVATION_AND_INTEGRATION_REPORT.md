# NutritionPro Feature-Preservation and Integration Report

**Updated:** 13 November 2026
**Development branch:** `development/nutritionpro-foundation`
**Implementation commit:** `4c343c3454ec06fb4d3581961681eca8bdaf5d08`
**GitHub Actions:** passed — run [43225894268](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43225894268)
**Scope:** Work only on the authorized development branch. No production Render service or Supabase project was contacted or changed.

## Current result

The development foundation now contains native Supabase Auth client flows; session-only ingredient management; named recipe versions and exact-version batch records; measured cooked-yield calculations; an FSANZ-informed draft NIP; a printable, batch-linked label draft; and existing CSV/XLSX/PDF draft exports. A separate local-only workspace is available by explicit choice when no Supabase client is configured. If a public Supabase client is configured, protected workspaces continue to require an authenticated user.

The NIP and label features remain calculation and review drafts, not an approval of compliance. No separate staging Supabase project is approved. Real Auth, database persistence, RLS and the production app were not tested in this milestone.

## Source identity and safety boundaries

The user-designated development source is `orderslongfordstore-jpg/NutritionMath`, branch `development/nutritionpro-foundation`. The user confirmed it is a new development foundation, not verified original production source. The formerly supplied `orderslongfordstore-jpg/nutritionPro` source URL was inaccessible through the available GitHub access; the live Render application has not been proven to match this branch.

The production Supabase project `nfzsjmzpiweeqtkypcgn` remains untouched and inaccessible to the development session. The user explicitly rejected `NutrientsMath` project `ndvjrsegapfhnhrjypck`; it was not contacted in this milestone. No replacement or staging database was created or connected. No Render environment settings, production records, `main` branch or live deployment were changed. No service-role key is used or included in the frontend.

## Implemented development features

### Auth and local access

The Vite client supports Supabase email/password sign-in and sign-up, PKCE session restoration, sign-out, password recovery and password update. Forms remain disabled when Supabase is not configured. In that no-client case only, users may explicitly enter a session-only local workspace. Its persistent on-screen warning states that work is unauthenticated, not synced or durable, and is cleared on page reload. When a valid public Supabase client is configured, ingredient, recipe and label workspaces remain gated on authentication. Auth flows remain mock-tested only.

The browser SPA uses `@supabase/supabase-js` browser session persistence; it does not implement `@supabase/ssr` or an HttpOnly cookie session. Real Auth redirects, account creation, recovery, sign-out against a project and callback allow-lists remain unverified.

### Recipes, versions and batch calculations

Recipes can be named, snapshotted as immutable in-memory versions and reloaded at an exact version. Session batch records retain the source recipe/version ID and batch code. The calculator scales recipe lines, additions and recorded discarded outputs, and keeps distinct values for raw ingredient weight, added material, total pre-cook input, measured cooked batch weight, calculated cooking loss/gain, declared discarded weight, final finished-product weight, portion weight, whole-portion count and remainder. Nutrition per 100 g and per portion is based on the calculated retained totals and measured finished yield; it does not equate raw input weight with cooked finished weight.

The app documents its material calculation assumption: nutrient retention is assumed except for explicitly recorded discard values. It does not currently apply AFCD cooking retention factors or a validated prepared-meal process model. Batch, recipe-version and ingredient records live only in the session adapter; they disappear when the app/page state is discarded.

### FSANZ-informed draft NIP

`src/lib/fsanzNip.ts` builds the ordinary solid-food panel row set in Schedule 12 order: Energy (kJ), Protein (g), Fat total (g) with saturated fat as a sub-row, Carbohydrate (g) with sugars as a sub-row, and Sodium (mg). Fibre is not shown as an unconditional ordinary row; the user can mark it applicable. The calculation requires a finite positive finished-product yield, serving weight and package serving count, then calculates both columns from batch nutrient totals without altering the underlying calculation engine.

The implementation displays no more than three significant figures. FSANZ's Code specifies this maximum; it does not prescribe a general decimal-place or tie-breaking convention. The software's `Intl.NumberFormat` choice is explicitly disclosed as an implementation convention, not represented as a separate statutory rule. No optional “LESS THAN” substitution is made. Tests cover row order, values, units, conditional fibre, missing nutrients, zero and non-finite inputs.

This is a limited draft. Product/claim-triggered rows, fibre's special required-zero treatment when applicable, the optional low-value expressions, liquid-food per-100-mL formatting, exemptions, classification and other full-Code exceptions still need review. The implementation baseline and sources are recorded in [FSANZ_IMPLEMENTATION_BASELINE.md](FSANZ_IMPLEMENTATION_BASELINE.md). It is not a product-specific compliance determination.

### AFCD-grounded tests

The test fixtures use verified AFCD Release 3 profiles for raw chicken breast (F002594), uncooked white rice (F007682), tap water (F009527), and the prepared scrambled-egg-with-milk composite (F003732). Direct ingredient and chicken/rice recipe totals are regression-tested, as is the composite's published per-100-g result. Recipe quantities and process weights in the batch case are explicitly illustrative and are not described as an AFCD-published prepared-meal formula or validated cooking-yield study. Nutrient-profile data do not establish allergen status; fixture allergen arrays are placeholders only. Detailed field mappings and process limitations are in [AFCD_TEST_FIXTURE_NOTES.md](AFCD_TEST_FIXTURE_NOTES.md).

### Printable label draft and exports

The printable label uses a selected session batch and contains a product name, user-entered ingredient declaration, user-entered allergen wording, optional separate precautionary wording, batch-linked draft NIP, servings/portion size, user-entered storage instructions, batch identifier and user-entered best-before/use-by text. Product-specific source-fact review confirmations are required before print is enabled. The layout permanently displays **DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE** and states that printing is not approval. It does not infer allergens or generate legally sufficient ingredient declarations, choose date marks, substantiate shelf life or validate final commercial artwork.

Existing ingredient CSV/XLSX exports and recipe-calculation XLSX/PDF worksheets remain. No NIP/batch report exports or ingredient PDF export have been added.

## Files changed in this milestone

- `src/types.ts`, `src/lib/batchNutrition.ts`, `src/lib/batchNutrition.test.ts`: recipe/version/batch types and measured-yield calculation.
- `src/lib/nutritionRepository.ts`, `src/lib/nutritionRepository.test.ts`: async data-access boundary with a session-only adapter, version linkage and AFCD ingredient/recipe reference tests; no remote adapter.
- `src/components/RecipeBuilder.tsx`, `src/components/RecipeBuilder.test.tsx`, `src/components/BatchManager.tsx`, `src/components/BatchManager.test.tsx`: saved recipe versions and batch workflow.
- `src/lib/fsanzNip.ts`, `src/lib/fsanzNip.test.ts`, `src/components/LabelBuilder.tsx`, `src/components/LabelBuilder.test.tsx`: draft NIP, label and print flow.
- `src/test/fixtures/afcdRelease3.ts`, `AFCD_TEST_FIXTURE_NOTES.md`: sourced nutrient fixtures and provenance limitations.
- `src/App.tsx`, `src/App.test.tsx`, `src/styles.css`: workflow wiring, explicit no-config local-only access, auth boundaries and responsive/print styles.
- `FSANZ_IMPLEMENTATION_BASELINE.md`, `TODO.md`, `README.md`: regulatory source baseline, outcomes and current development status.

## Local validation and CI

On 13 November 2026, the final local-only access change passed `npm ci`, `npx tsc -b --pretty false`, `npm test` (55 tests across 12 files), `npm run build`, `npm audit --omit=dev` (zero reported production/runtime vulnerabilities) and `git diff --check`.

The Vite build passed but warns that the separately loaded ExcelJS bundle is approximately 939 kB minified / 271 kB gzip. This is a known page-load/download-size trade-off. `npm ci` also reports existing transitive package deprecation warnings; they did not fail the build or audit.

The implementation was pushed to `development/nutritionpro-foundation` as `4c343c3454ec06fb4d3581961681eca8bdaf5d08`. GitHub Actions run [43225894268](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43225894268) completed successfully for that exact SHA. Previous Auth and XLSX/PDF branch CI runs also passed: [Auth run 43114463371](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43114463371) and [export run 43116172481](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43116172481).

## Remaining work

1. Obtain explicit approval for a separate non-production Supabase project before any Auth/database integration. Then inspect its actual schema and Auth settings, design an additive ownership model, connect persistence and test negative cross-user RLS cases. Do not use either existing project named above.
2. Review product/process assumptions and AFCD retention-factor handling for prepared meals; the batch model must not be treated as laboratory or process-validation evidence.
3. Complete the applicable current Code research for actual products and claims. Implement and test required triggered nutrients, low-value displays, liquid panels, exceptions, and presentation details before any commercial label use.
4. Add persistent recipe/ingredient/batch storage, verified source/provenance fields, broader report exports, and final artwork review only after the domain and approved schema are available.
5. Repeat device/browser mobile and accessibility checks on the finished workflows. No final mobile smoke test was performed in this milestone.
6. Do not merge to `main`, change Render production settings or deploy without explicit user approval.
