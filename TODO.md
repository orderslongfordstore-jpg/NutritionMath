# NutritionPro Outcomes

## 1. Calculation correctness and regression coverage — complete for the current prototype

- [x] Resolve the original non-finite and overflow reporting defects without weakening existing tests.
- [x] Validate NaN, positive/negative Infinity, negative and zero ingredient quantities, missing/invalid nutrient values, invalid serving counts, oversized values, zero recipe weight, and accumulated weight/nutrient overflow.
- [x] Report invalid or unrepresentable inputs rather than presenting fallback values as valid nutrition results; keep returned values finite.
- [x] Retain and extend the regression suite; 19 calculation tests pass in addition to the new Auth/access tests.
- [x] Suppress recipe summary totals while the draft is invalid or incomplete.

## 2. Ingredient management — partial; currently browser-session-only

- [x] Create, edit, delete and search ingredient records in the current app session.
- [x] Capture per-100-g energy (kJ), protein, carbohydrate, sugars, fat, saturated fat, sodium, fibre, serving size and allergen information with finite/non-negative numeric validation.
- [x] Remove fictional preloaded ingredient records and show an honest empty state.
- [x] Export the current in-memory ingredient list as formula-injection-hardened CSV.
- [ ] Add user-entered category and source/provenance fields without imposing an unverified remote schema.
- [ ] Persist ingredients to a separately confirmed non-production Supabase project with database-enforced user/workspace ownership; none is currently authorized.
- [ ] Confirm the original schema's supported fields before mapping local records to remote tables.

## 3. Recipe builder and batch calculations — partial; currently a local draft

- [x] Add and remove ingredient lines, enter quantities in grams, set a positive whole-number serving count, and calculate draft weight, per-serving and per-100-g values.
- [x] Propagate ingredient edits to current draft references and remove deleted ingredients from the unsaved draft.
- [ ] Create named local recipes and session-only batch records with clear non-persistence labels.
- [ ] Implement recipe/batch scale-up and scale-down plus supplied final cooked yield.
- [ ] Persist recipes/batches securely after an approved staging project and its actual schema/ownership model are available.

## 4. Australian Nutrition Information Panels — not complete

- [ ] Generate a draft Australian-style NIP in Schedule 12 order using user-entered product facts and current FSANZ rules.
- [ ] Require explicit final yield, declared serving size and package serving count; calculate per-serving and per-100-g values.
- [ ] Apply no-more-than-three-significant-figure display formatting and review unit/row/claim-triggered rules against official sources.
- [ ] Keep all unverified panel output marked as draft, not a regulatory compliance determination.

## 5. Food labels and exports — partial

- [x] Use an honest empty label state when no validated label exists.
- [x] Harden CSV cell escaping against spreadsheet formula injection.
- [ ] Build printable label drafts from user-provided product, recipe, ingredient and allergen facts; do not auto-assert legally sufficient allergen declarations.
- [ ] Add real `.xlsx` workbooks and printable/PDF reports for ingredients, recipes, panels and batches; CSV alone does not satisfy Excel-workbook delivery.
- [ ] Preserve units, source data, calculation review state and export provenance in generated outputs.

## 6. Supabase authentication, persistence and database security — client code implemented; remote verification blocked

- [x] Implement client calls for email/password sign-in and sign-up, PKCE session restoration, sign-out, password recovery and password update without Manus auth.
- [x] Keep account forms disabled when no public Supabase config is present; the environment template is blank.
- [x] Gate ingredient, recipe and label tabs when there is no restored authenticated session.
- [x] Use only the public URL and anon/publishable key in the browser client; no service-role key is included in the app.
- [x] Add mocked tests for sign-in, registration, recovery, password update, session restoration and sign-out. These tests do not contact Supabase and do not prove real Auth behavior.
- [ ] Verify real registration, login, recovery, persistent sessions and callback redirects using a separately approved non-production project.
- [ ] Connect authenticated users to persisted ingredients, recipes, panels and batches using the approved project's actual schema or reviewed additive migrations.
- [ ] Validate user/workspace ownership with RLS and explicit negative cross-user access tests.
- [ ] Do not change the production Supabase project or its data. The user explicitly denied authorization for `NutrientsMath` (`ndvjrsegapfhnhrjypck`); do not connect to it, modify it, change its schema, or create accounts there. No separate staging project is currently approved.

## 7. Interface and mobile experience — foundation complete; full product not complete

- [x] Keep the product name NutritionPro and apply the requested black, white and yellow identity with responsive navigation and clear empty/review states.
- [x] Smoke-test the local app at 390×844: dashboard, ingredient CRUD/search, recipe calculation and deletion fit without page-level horizontal overflow.
- [x] Gate private workspaces and show a useful signed-out/no-project explanation.
- [ ] Complete the missing persistent product workflows while preserving verified behavior from the original source when available.
- [ ] Verify additional iPhone/tablet/desktop breakpoints and accessibility against final authenticated, data-backed screens.

## 8. Quality assurance and deployment preparation — local Auth stage passes; remote/database checks pending

- [x] Install the committed dependencies with `npm ci` during baseline verification.
- [x] Run `npx tsc -b --pretty false`, all 25 tests and `npm run build` after the local Auth changes; all exited successfully.
- [x] Run the prior Chromium 390×844 smoke test and `git diff --check`; later feature changes still require rechecking.
- [x] GitHub Actions passed for earlier stage-two SHA `edd53625a7f4b60b10caabb41c88523e106d8a95` (run https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43111435208) and report SHA `031e2ba67398194dfb5bc42e9573784a79e05a5c` (run https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43112414968). The current Auth-stage changes are not yet pushed or checked by Actions.
- [ ] Validate real Auth, database migrations, RLS boundaries, exports and server logs in an approved non-production environment.
- [ ] Document staging/production environment variables and deployment commands; do not change production configuration or deploy without approval.

## 9. Branch, commit and final delivery — in progress

- [x] Work on `development/nutritionpro-foundation`; do not push development work to `main`.
- [x] Stage-one and stage-two code and the initial feature-preservation report are committed and pushed; the Auth-stage files are currently local and uncommitted.
- [ ] Commit each verified development stage and check its GitHub Actions run before continuing.
- [ ] Update the feature-preservation report to the final development SHA, reflecting the Auth client implementation and all remaining project-access limitations.
- [ ] Final report must distinguish source facts, local/mock-tested behavior, unverified remote integrations, files changed, test results, commit SHA, Actions result, staging status and the absence of any production deployment.
