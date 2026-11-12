# NutritionPro Outcomes

## 1. Calculation correctness and regression coverage — complete for the current prototype

- [x] Resolve the original non-finite and overflow reporting defects without weakening existing tests.
- [x] Validate NaN, positive/negative Infinity, negative and zero quantities, missing/invalid nutrient values, invalid serving counts, oversized values, zero recipe weight and accumulated overflow.
- [x] Report invalid or unrepresentable inputs instead of presenting fallback values as valid results; keep returned values finite.
- [x] Retain the existing calculation engine and regression coverage; 19 calculation tests pass.
- [x] Suppress recipe summary totals while a draft is invalid or incomplete.
- [ ] Obtain domain review of calculation assumptions, recipe yield behavior and regulatory requirements before label use.

## 2. Ingredient management — partial; session-local

- [x] Create, edit, delete and search ingredient records in current browser memory.
- [x] Capture per-100-g energy (kJ), protein, carbohydrate, sugars, fat, saturated fat, sodium, fibre, serving size and allergen information with finite/non-negative validation.
- [x] Remove fictional preloaded ingredients and show an honest empty state.
- [x] Export current in-memory ingredients as CSV with formula-injection hardening.
- [x] Export current in-memory ingredients as a genuine `.xlsx` workbook.
- [ ] Add user-entered category and source/provenance fields without imposing an unverified remote schema.
- [ ] Persist ingredients to a separately confirmed non-production Supabase project with database-enforced ownership; none is approved.
- [ ] Confirm the original schema's supported fields before mapping local records to remote tables.

## 3. Recipe builder and batch calculations — functional prototype; session-only

- [x] Add/remove ingredient lines, enter gram quantities, set servings and calculate draft totals per serving and per 100 g.
- [x] Propagate ingredient edits to current draft references and remove deleted ingredients from the unsaved recipe.
- [x] Export a recipe calculation workbook and an internal recipe PDF worksheet using the current nutrition engine.
- [x] Mark worksheet exports clearly as internal drafts, not a validated FSANZ NIP or label.
- [x] Create named recipes and immutable versions; load an exact version snapshot for batch calculation.
- [x] Create session-only batch records linked to their exact recipe version and identification code.
- [x] Scale recipe ingredients, added materials and discarded materials by a positive batch scale factor.
- [x] Require measured cooked batch weight before discards and calculate final finished weight, cooking loss/gain, portion count, remainder, per-100-g and per-portion nutrients.
- [x] Permit recorded added water and other material profiles; require discarded output quantities and a profile representing the discarded output.
- [ ] Replace the current assumed nutrient retention (except declared discards) with an approved process-specific model where justified; current batch math does not apply AFCD retention factors.
- [ ] Persist recipes/batches after an approved staging project and its actual schema/ownership model are available.

## 4. Australian Nutrition Information Panels — draft implementation; not a compliance determination

- [x] Generate a batch-linked solid-food draft panel in ordinary Schedule 12 row order: Energy, Protein, Fat total (Saturated sub-row), Carbohydrate (Sugars sub-row), Sodium; include Dietary fibre only when explicitly marked applicable.
- [x] Show average quantities per serving and per 100 g with kJ, g and mg labels, serving size and servings per package; calculate both quantities from the measured final finished weight and full-precision batch nutrient totals.
- [x] Display at no more than three significant figures using an explicit software rounding convention, keeping the legal significant-figure maximum separate from software-specific decimal/tie-breaking choices.
- [x] Require finite positive finished yield, portion weight and package serving count; reject missing or non-finite nutrient values for every displayed row.
- [x] Permanently mark output “DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE”; no FSANZ compliance determination is claimed.
- [ ] Add and verify product/claim-specific triggered nutrients, fibre’s special required-zero treatment when applicable and permitted “LESS THAN” alternatives; current panel only has the base rows and optional fibre.
- [ ] Verify additional schedule exceptions, liquid product panels, unit/format detail and product classification against the full current Code before production use.

## 5. Food labels and exports — printable review draft; partial

- [x] Print a session-only draft linked to an exact saved recipe-version batch, with product name, user-entered ingredient declaration, user-entered mandatory allergen wording, optional separate precautionary wording, draft NIP, serving information, storage directions, batch code, and user-entered best-before/use-by text.
- [x] Keep declarations and date/storage facts user-supplied; display warnings against nutrient-based allergen inference and auto-generated legal text.
- [x] Require explicit user confirmations for ingredient, allergen and date/storage fact review before enabling print; permanently label the output draft and state that printing is not approval.
- [x] Harden CSV cell escaping against spreadsheet formula injection.
- [x] Provide a browser XLSX workbook for current ingredient data.
- [x] Provide browser XLSX and PDF outputs for an internal recipe calculation worksheet.
- [ ] Add final artwork review/approval and verified legal layout, bold/contrast, claims, address, lot/date-format, packaging-specific and product-specific compliance checks; these are not implemented by the draft print workflow.
- [ ] Add workbook/PDF reports for NIPs and batches and ingredient PDF output.
- [ ] Preserve units, source data, calculation review state and export provenance in generated outputs.

## 6. Supabase authentication, persistence and database security — client code present; remote verification blocked

- [x] Implement email/password sign-in and sign-up, PKCE session restoration, sign-out, password recovery and password update calls with `@supabase/supabase-js`.
- [x] Persist Auth sessions in the browser client; this Vite SPA does not currently use `@supabase/ssr` or HttpOnly cookie sessions.
- [x] Keep account forms disabled when no public Supabase config is present; `.env.example` contains blank placeholders.
- [x] Require authenticated sessions for ingredient, recipe and label tabs whenever a public Supabase client is configured; if Supabase is entirely unconfigured, require an explicit local-only choice and show a persistent warning that page-session data is not authenticated, synced or durable.
- [x] Use only the public URL and anon/publishable key in the browser client; no service-role key is included.
- [x] Add mocked tests for sign-in, registration, recovery, password update, session restoration and sign-out. These tests do not prove real Auth behavior.
- [ ] Verify real registration, login, recovery, persistent sessions and callback redirects using a separately approved non-production project.
- [ ] Connect authenticated users to persisted records using that approved project's actual schema or reviewed additive migrations.
- [ ] Validate user/workspace ownership with RLS and explicit negative cross-user access tests.
- [ ] Do not modify the production Supabase project or data. The user explicitly rejected `NutrientsMath` (`ndvjrsegapfhnhrjypck`); do not connect to it, change its schema or create accounts there. No separate staging project is approved.

## 7. Interface and mobile experience — foundation present; full product not complete

- [x] Keep the product name NutritionPro and apply the requested black, white and yellow identity with responsive navigation and clear empty/review states.
- [x] Historically smoke-test the local app at 390×844 for dashboard, ingredient CRUD/search and recipe calculation without page-level horizontal overflow.
- [x] Keep configured Supabase projects behind authentication; present a clearly disclosed explicit session-only workspace only when there is no Supabase configuration.
- [ ] Repeat iPhone/mobile smoke tests after the latest export controls and when authenticated/data-backed screens are available.
- [ ] Complete missing persistent product workflows while preserving verified behavior from original source when available.
- [ ] Verify additional iPhone/tablet/desktop breakpoints and accessibility against final authenticated screens.

## 8. Quality assurance and deployment preparation — local checks pass; current branch CI pending

- [x] Prior XLSX/PDF milestone passed `npm test`: 32 tests across 7 files.
- [x] Run `npm ci`, `npx tsc -b --pretty false`, `npm test`, `npm run build`, `npm audit --omit=dev` and `git diff --check` on 13 November 2026.
- [x] Final AFCD/batch/NIP/label/local-only mode milestone passed 55 tests across 12 files after the UI change.
- [x] Final TypeScript/Vite production build passed; the build emits the known ExcelJS chunk warning, approximately 939 kB minified / 271 kB gzip.
- [x] Run `npm audit --omit=dev`: zero production/runtime vulnerabilities after pinning ExcelJS's `uuid` dependency to patched `11.1.1`.
- [x] Run `git diff --check` before the export milestone commit.
- [x] GitHub Actions passed for Auth milestone `d2950e293b0386585bd4a35d1d23e28a48ff9c7a` (run [43114463371](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43114463371)) and XLSX/PDF milestone `aaa1bccbae41438e86edbdd620530038e5525cda` (run [43116172481](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43116172481)).
- [ ] Validate real Auth, database migrations, RLS boundaries and server logs in an approved non-production environment.
- [ ] Document exact staging/production environment variables only after the integration plan and tests are reviewed; do not change production configuration or deploy without approval.

## 9. Branch, commit and delivery — active development only

- [x] Work only on `development/nutritionpro-foundation`; do not push development work to `main`.
- [x] Commit and push the native Auth milestone (`d2950e2`) and browser XLSX/PDF milestone (`aaa1bcc`) to the development branch; both GitHub Actions runs passed.
- [x] Update this checklist and the feature-preservation report for the current development state.
- [ ] Commit and push the verified current milestone only to `development/nutritionpro-foundation`; record the returned SHA and actual Actions run outcome.
- [ ] Continue only with work that does not require unapproved Supabase access; wait for explicit staging-project approval before integration.
- [ ] Final handoff must distinguish source facts, locally/mock-tested behavior, unverified remote integrations, current branch/commit, test results and the absence of any production deployment.
