# NutritionPro feature-preservation and integration report

**Checked:** 19 November 2026. **Repository/branch:** `orderslongfordstore-jpg/NutritionMath`, `development/nutritionpro-foundation`. The code/toolchain follow-up is locally verified and awaits its branch commit and CI. The current foundation is authorized development work, not confirmed original production source code.

## Summary

The React 18 / TypeScript / Vite NutritionPro prototype now includes source-aware session-local ingredients and a small AFCD Release 3 reference subset; an editable, deliberately incomplete curry-sausages-and-mash case; g/kg recipe entry and immutable recipe versions; measured cooked batches with explicit sourced nutrient-retention factors; combined meal assembly; draft NIPs and linked label review copies; and browser PDF/XLSX exports. Existing nutrition calculations remain in place.

The development toolchain is updated to pinned Vite 6.4.6, Vitest 4.1.12 and `@vitejs/plugin-react` 5.2.0. `tsconfig.node.json` now uses ESM-aware `Bundler` resolution for the Vite config and plugin declarations. The clean install, TypeScript check, all **81 tests across 17 files**, production build and production-only dependency audit pass. The full development audit still reports one high-severity upstream Picomatch advisory across five dependency paths; no fixed release is published. This unresolved item is detailed with first-party references in [`DEPENDENCY_AUDIT.md`](DEPENDENCY_AUDIT.md).

## Curry sausages and mash: preserved facts and calculation blocker

The editable case contains only supplied wording and values: 7.2 kg sausages; 2 kg onions; 2 kg carrots; one bunch celery; 1 kg peas and corn; 100 g Keen's curry powder; garlic quantity unspecified; 160 g MAGGI chicken stock; 8 L water; 4 tablespoons fruit chutney; 3 cups cornflour; and Farm Frites mash with no amount or exact product/SKU. It shows the **12,460 g known g/kg subtotal** as incomplete; that subtotal excludes celery, garlic, 8 L water, kitchen-volume measures and mash. The supplied plated component weight remains 400 g curry + 200 g mash = 600 g.

The app does not guess celery/garlic/kitchen-measure quantities, peas/corn split, branded-product nutrition, cooked curry yield, finished mash yield or portion count. Therefore it provides **no real curry/mash nutrition, cost, cooked yield or commercial NIP**. Product identity and supplier label evidence, resolved weights, measured yields and reviewable cooking-retention evidence are still needed.

Separate AFCD regression fixtures demonstrate the software only; they are not the supplied branded recipe. A combined-meal draft-label test combines synthetic chicken/rice and rice-component batches using AFCD generic profiles and explicit test-only 100% retention factors. It verifies 400 g + 200 g = 600 g and synthetic energy values of 3,820 kJ per portion and 637 kJ/100 g, with 1,200 g for two meals. These are software regression expectations, not values for any sausage brand or Farm Frites product.

## Implemented features and remaining work

| Area | Implemented on this branch | Limitation / remaining work |
| --- | --- | --- |
| Ingredients | Session CRUD/search, per-100-g nutrients, category/brand/SKU/barcode, source type/reference/URL and review status; unsafe URL schemes rejected; CSV/XLSX exports | No persistent database, barcode lookup, complete AFCD import or recovered production schema |
| AFCD source | Four generic Release 3 profiles with food keys, provenance and official source link; attribution/change/limitation/Australian-data/as-is/license notices appear in UI and AFCD-containing exports | Small generic subset only; not branded data or an allergen database; no AFCD-absent-allergen inference |
| Recipes/units | g/kg quantities with exact kg↔g helper, named immutable snapshots and exact-version loading | No kitchen-unit or volume→mass conversion without measured mass or explicit density |
| Batch calculations | Formula scaling, additions/discards, measured cooked weight, final yield/loss, portions/remainder, nutrient totals and batch code | All eight nutrient-retention factors and source/method are blank-by-default and mandatory; operator inputs are not independently process-validated |
| Meal assembly | Combine separately prepared batch records by plated weights; calculate combined per-serving/per-100-g inputs, limiting meal yield and leftovers | Session-only; requires measured component batches and actual weights |
| Draft NIP | Batch/meal-linked solid-food draft, per-serving/per-100-g quantities, core rows and optional user-marked fibre; full precision until explicit ≤3-significant-figure software rounding | Not a compliance determination; product/claim-triggered rows, exceptions, liquid rules, fibre special cases and full Code review remain incomplete |
| Label review | Supplier/product/production facts, batch/meal link, user-supplied declarations and date/storage text, review confirmations; ingredient-order suggestion only from complete user-verified non-AFCD records, inserted only by user action | No commercial approval, final artwork, product-specific allergen/date/shelf-life decision, full compound ingredient/additive/processing-aid review or complete origin/packaging checks |
| Exports | Ingredient CSV/XLSX; recipe-calculation PDF/XLSX; label-draft PDF/XLSX, including source/retention evidence and draft warnings; spreadsheet formula-injection defenses | ExcelJS chunk warning above 500 kB; no database reports |
| Authentication | Native Supabase JS email/password, PKCE, browser session persistence, recovery/update/logout; mocked tests; explicitly chosen local-only session mode only when no public Supabase client is configured | Real registration/login/recovery/session restore unverified; configured workspaces still require Auth; local-only work is unauthenticated, unsynced and non-durable |

In configured Auth mode, the in-memory workspace is keyed by authenticated user ID. Signing out or switching identity synchronously unmounts and discards the previous user's ingredient/recipe/batch/meal/label session. An App-level regression verifies this same-tab boundary. This mitigates the prototype's cross-user session leakage; it is not a substitute for backend ownership and RLS.

## Cooking-retention model

The former implicit assumption of full nutrient retention has been removed. Batch calculation requires an explicit user factor for each of energy, protein, carbohydrate, sugars, fat, saturated fat, sodium and fibre, plus a source/method. Factors are applied to pre-discard nutrient values; declared measured discard nutrients are then deducted. Factors and source are saved in the session batch and shown in label preview/PDF/XLSX. No supplied factor or factor ordering is claimed scientifically valid for a particular process; independent review is necessary.

## FSANZ and AFCD evidence

The research record is [`CURRENT_FSANZ_AFCD_REVIEW.md`](CURRENT_FSANZ_AFCD_REVIEW.md), alongside [`FSANZ_IMPLEMENTATION_BASELINE.md`](FSANZ_IMPLEMENTATION_BASELINE.md) and [`AFCD_TEST_FIXTURE_NOTES.md`](AFCD_TEST_FIXTURE_NOTES.md). Official sources rechecked 18 November include [FSANZ Nutrition Information Panels](https://www.foodstandards.gov.au/consumer/labelling/panels), [AFCD Release 3 data files](https://www.foodstandards.gov.au/science-data/food-nutrient-databases/afcd/data-files) and the [AFCD Data User Licence Agreement](https://www.foodstandards.gov.au/science-data/monitoringnutrients/afcd/datauserlicenceagreement). The four-profile AFCD scope, attribution, changes, limitation/Australian-data statements, as-is warranty disclaimer and licence-link handling are described in [`AFCD_DATA_LICENSE_NOTICE.md`](AFCD_DATA_LICENSE_NOTICE.md). This is an implementation record, not legal advice.

The Code's maximum significant-figure rule is kept separate from the software's rounding convention. Allergens, ingredient declarations, date marking and storage are not inferred from nutrient totals. The implemented NIP format is only a draft; the complete current Code, each trigger/exception and actual product facts require qualified review before sale.

## Dependency audit

Vite 5.4.21, Vitest 2.1.9 and their vulnerable transitive versions were replaced with Vite 6.4.6, Vitest 4.1.12, `@vitest/mocker` 4.1.12, esbuild 0.25.12 and `@vitejs/plugin-react` 5.2.0. Vite 6.4.6 also includes the Vite 6.4.4 `server.fs.deny` query-bypass patch. No force upgrade, peer-dependency bypass or unverified override was used.

`npm audit --omit=dev` reports zero vulnerabilities. Full `npm audit` reports five high-severity package paths that all trace to `picomatch` 4.0.7 and GHSA-fc5q-39xc-vjpf. The GitHub Advisory lists no patched release; npm registry lookup still shows 4.0.7 as latest and no 4.0.8/4.0.9 release. We have not suppressed the advisory or substituted an unpublished version. The dependency remains in the development/test graph and must be re-audited when the maintainer publishes a fix. See [`DEPENDENCY_AUDIT.md`](DEPENDENCY_AUDIT.md) for the advisory, release checks and source links.

## Auth, persistence and production safety

No staging Supabase project has been approved. Production project `nfzsjmzpiweeqtkypcgn` and rejected project `ndvjrsegapfhnhrjypck` were not contacted. No accounts, SQL, schema, RLS, database or Render settings were changed. No service-role key is in browser code. The live website and its production data remain untouched.

The asynchronous session-memory repository is only a future data-access boundary, not a fake Supabase adapter. Real Auth, persistent CRUD, ownership/RLS and compatibility with any original production schema/source remain unverified. No migration plan can responsibly claim preservation of original accounts or records without authorized inspection of those sources.

## Files changed in the current toolchain follow-up

- `package.json` and `package-lock.json`: pinned Vite/Vitest/React-plugin updates.
- `tsconfig.node.json`: ESM-aware type resolution for Vite config declarations.
- `DEPENDENCY_AUDIT.md`: full initial and remaining dependency findings with sources.
- `plan.md`, `TODO.md`, `README.md` and this report: current toolchain, verification and limitations.

The preceding NutritionPro implementation modified `src/App.tsx`, `src/types.ts`, `src/styles.css`; batch, ingredient, label, meal, recipe and curry-case components and tests; nutrition, AFCD, export, units, batch, repository and meal-assembly libraries and tests; `src/test/fixtures/afcdRelease3.ts`; and the AFCD/FSANZ research and licence documents. No production project files were changed.

## Validation and remaining work

On 19 November 2026, `npm ci`, `npx tsc -b --pretty false`, `npm test` (**81/81 tests across 17/17 files**), `npm run build`, `npm audit --omit=dev` (**0 runtime findings**) and `git diff --check` passed. The production build warns that the lazy-loaded ExcelJS chunk is 940.19 kB minified / 271.33 kB gzip. Full `npm audit` remains nonzero for the documented Picomatch finding. The current toolchain follow-up is locally verified; branch CI is pending push.

Next: commit and push only to `development/nutritionpro-foundation`, then record its exact SHA and Actions result. Wait for a separately approved staging Supabase project before remote integration. Do not merge, alter Render or production data, or deploy without explicit approval. This prototype is not ready for staging or commercial use until real product inputs, process validation, remote Auth/data/RLS work, full current-Code review and qualified label review are complete.
