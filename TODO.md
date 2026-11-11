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

## 3. Recipe builder and batch calculations — partial; unsaved local draft

- [x] Add/remove ingredient lines, enter gram quantities, set servings and calculate draft totals per serving and per 100 g.
- [x] Propagate ingredient edits to current draft references and remove deleted ingredients from the unsaved recipe.
- [x] Export a recipe calculation workbook and an internal recipe PDF worksheet using the current nutrition engine.
- [x] Mark worksheet exports clearly as internal drafts, not a validated FSANZ NIP or label.
- [ ] Create named recipes and batch records; no save/load workflow exists.
- [ ] Implement recipe/batch scale-up and scale-down plus supplied final cooked yield.
- [ ] Persist recipes/batches after an approved staging project and its actual schema/ownership model are available.

## 4. Australian Nutrition Information Panels — not complete

- [ ] Generate an Australian-style NIP in Schedule 12 order using reviewed product facts and current FSANZ rules.
- [ ] Require explicit final yield, declared serving size and package serving count; calculate per-serving and per-100-g values.
- [ ] Apply no-more-than-three-significant-figure display formatting and review unit/row/claim-triggered rules against official sources.
- [ ] Keep all unverified panel output marked as draft, not a regulatory compliance determination.

## 5. Food labels and exports — partial

- [x] Use an honest empty label state when no validated label exists.
- [x] Harden CSV cell escaping against spreadsheet formula injection.
- [x] Provide a browser XLSX workbook for current ingredient data.
- [x] Provide browser XLSX and PDF outputs for an internal recipe calculation worksheet.
- [ ] Build printable label drafts from user-provided product, recipe, ingredient and allergen facts; do not auto-assert legally sufficient allergen declarations.
- [ ] Add workbook/PDF reports for NIPs and batches and ingredient PDF output.
- [ ] Preserve units, source data, calculation review state and export provenance in generated outputs.

## 6. Supabase authentication, persistence and database security — client code present; remote verification blocked

- [x] Implement email/password sign-in and sign-up, PKCE session restoration, sign-out, password recovery and password update calls with `@supabase/supabase-js`.
- [x] Persist Auth sessions in the browser client; this Vite SPA does not currently use `@supabase/ssr` or HttpOnly cookie sessions.
- [x] Keep account forms disabled when no public Supabase config is present; `.env.example` contains blank placeholders.
- [x] Gate ingredient, recipe and label tabs when there is no restored authenticated session.
- [x] Use only the public URL and anon/publishable key in the browser client; no service-role key is included.
- [x] Add mocked tests for sign-in, registration, recovery, password update, session restoration and sign-out. These tests do not prove real Auth behavior.
- [ ] Verify real registration, login, recovery, persistent sessions and callback redirects using a separately approved non-production project.
- [ ] Connect authenticated users to persisted records using that approved project's actual schema or reviewed additive migrations.
- [ ] Validate user/workspace ownership with RLS and explicit negative cross-user access tests.
- [ ] Do not modify the production Supabase project or data. The user explicitly rejected `NutrientsMath` (`ndvjrsegapfhnhrjypck`); do not connect to it, change its schema or create accounts there. No separate staging project is approved.

## 7. Interface and mobile experience — foundation present; full product not complete

- [x] Keep the product name NutritionPro and apply the requested black, white and yellow identity with responsive navigation and clear empty/review states.
- [x] Historically smoke-test the local app at 390×844 for dashboard, ingredient CRUD/search and recipe calculation without page-level horizontal overflow.
- [x] Gate private workspaces and show a no-project/signed-out explanation.
- [ ] Repeat iPhone/mobile smoke tests after the latest export controls and when authenticated/data-backed screens are available.
- [ ] Complete missing persistent product workflows while preserving verified behavior from original source when available.
- [ ] Verify additional iPhone/tablet/desktop breakpoints and accessibility against final authenticated screens.

## 8. Quality assurance and deployment preparation — local and branch CI checks pass; remote/database checks pending

- [x] Run `npm test` after XLSX/PDF changes: 32 tests passed across 7 test files.
- [x] Run `npm run build`: TypeScript and Vite production build passed. ExcelJS is lazy-loaded, but the separate minified chunk is approximately 939 kB (271 kB gzip); review bundle-size trade-off.
- [x] Run `npm audit --omit=dev`: zero production/runtime vulnerabilities after pinning ExcelJS's `uuid` dependency to patched `11.1.1`.
- [x] Run `git diff --check` before the export milestone commit.
- [x] GitHub Actions passed for Auth milestone `d2950e293b0386585bd4a35d1d23e28a48ff9c7a` (run [43114463371](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43114463371)) and XLSX/PDF milestone `aaa1bccbae41438e86edbdd620530038e5525cda` (run [43116172481](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43116172481)).
- [ ] Validate real Auth, database migrations, RLS boundaries and server logs in an approved non-production environment.
- [ ] Document exact staging/production environment variables only after the integration plan and tests are reviewed; do not change production configuration or deploy without approval.

## 9. Branch, commit and delivery — active development only

- [x] Work only on `development/nutritionpro-foundation`; do not push development work to `main`.
- [x] Commit and push the native Auth milestone (`d2950e2`) and browser XLSX/PDF milestone (`aaa1bcc`) to the development branch; both GitHub Actions runs passed.
- [x] Update this checklist and the feature-preservation report for the current development state.
- [ ] Continue only with work that does not require unapproved Supabase access; wait for explicit staging-project approval before integration.
- [ ] Final handoff must distinguish source facts, locally/mock-tested behavior, unverified remote integrations, current branch/commit, test results and the absence of any production deployment.
