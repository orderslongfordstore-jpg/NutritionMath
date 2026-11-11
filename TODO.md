# NutritionPro Outcomes

## 1. Calculation correctness and regression coverage — complete for the current prototype

- [x] Resolve the original non-finite and overflow reporting defects without weakening existing tests.
- [x] Validate NaN, positive/negative Infinity, negative and zero ingredient quantities, missing/invalid nutrient values, invalid serving counts, oversized values, zero recipe weight, and accumulated weight/nutrient overflow.
- [x] Report invalid or unrepresentable inputs rather than presenting fallback values as valid nutrition results; keep returned values finite.
- [x] Retain and extend the regression suite: 19 tests currently pass, including both existing test files.
- [x] Suppress recipe summary totals while the draft is invalid or incomplete.

## 2. Ingredient management — partial; currently browser-session-only

- [x] Create, edit, delete and search ingredient records in the current app session.
- [x] Capture per-100-g energy (kJ), protein, carbohydrate, sugars, fat, saturated fat, sodium, fibre, serving size and allergen information with finite/non-negative numeric validation.
- [x] Remove fictional preloaded ingredient records and show an honest empty state.
- [x] Export the current in-memory ingredient list as formula-injection-hardened CSV.
- [ ] Persist ingredients to the verified development Supabase project with database-enforced user/workspace ownership.
- [ ] Confirm the original schema's supported categories, source/provenance fields and any additional nutrient fields before extending the form.

## 3. Recipe builder and batch calculations — partial; currently a local draft

- [x] Add and remove ingredient lines, enter quantities in grams, set a positive whole-number serving count, and calculate draft weight, per-serving and per-100-g values.
- [x] Propagate ingredient edits to current draft references and remove deleted ingredients from the unsaved draft.
- [ ] Create, name, edit and persist saved recipes and batch calculations with secure ownership.
- [ ] Implement recipe/batch scale-up and scale-down, supplied final cooked yield, and production-batch support after reconciling the actual original workflows/schema.

## 4. Australian Nutrition Information Panels — not complete

- [ ] Generate a reviewed Australian-style Nutrition Information Panel using the verified original product facts and relevant FSANZ requirements.
- [ ] Validate row order, serving/per-100-g presentation, nutrient inclusion, energy conversion and rounding against authoritative requirements.
- [ ] Keep unverified previews explicitly marked as internal arithmetic, not a regulatory compliance determination.

## 5. Food labels and exports — partial

- [x] Use an honest empty label state when no validated label exists.
- [x] Harden CSV cell escaping against spreadsheet formula injection.
- [ ] Build printable labels from reviewed product/ingredient/allergen/yield data; add batch information and approved PDF export.
- [ ] Provide real `.xlsx` workbooks and PDF reports for ingredients, recipes, panels and saved batches; CSV alone does not satisfy Excel-workbook delivery.
- [ ] Preserve units, source data, calculation review state and export provenance.

## 6. Supabase authentication, persistence and database security — not complete

- [ ] Implement native Supabase registration, login, logout, password reset and persistent sessions without Manus auth.
- [ ] Connect authenticated users to persisted ingredients, recipes, panels and batches using existing compatible schema or reviewed additive migrations.
- [ ] Validate user/workspace ownership with RLS and explicit negative cross-user access tests.
- [ ] Do not expose service-role keys or other secrets in frontend code.
- [ ] Do not change the existing production Supabase project or its data. The accessible `NutrientsMath` project has matching empty NutritionPro tables and deny-all RLS, but it remains an unconfirmed development/staging candidate; no writes, account creation or migrations there until its role is confirmed.

## 7. Interface and mobile experience — foundation complete; full product not complete

- [x] Keep the product name NutritionPro and apply the requested black, white and yellow identity with responsive navigation and clear empty/review states.
- [x] Smoke-test the local app at 390×844: dashboard, ingredient CRUD/search, recipe calculation and deletion all fit without page-level horizontal overflow.
- [ ] Complete the missing authenticated/persistent product workflows, preserving the original screen behavior where it is available.
- [ ] Verify additional iPhone/tablet/desktop breakpoints and accessibility with final, data-backed screens.

## 8. Quality assurance and deployment preparation — local checks pass; remote/database checks pending

- [x] Install the committed dependencies with `npm ci` during baseline verification.
- [x] Run `npx tsc -b --pretty false`, all 19 tests, and `npm run build` after the current stage-two changes; all exited successfully.
- [x] Run `git diff --check` and an actual Chromium 390×844 mobile smoke test against localhost.
- [x] GitHub Actions `NutritionPro CI` passed for stage-two SHA `edd53625a7f4b60b10caabb41c88523e106d8a95`: https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/43111435208. Continue verifying each later push.
- [ ] Validate database migrations, live Supabase Auth flows, RLS boundaries, exports and server logs in the confirmed non-production environment.
- [ ] Document the correct staging/production environment variables and deployment commands; do not change production configuration or deploy without approval.

## 9. Branch, commit and final delivery — in progress

- [x] Work on `development/nutritionpro-foundation`; do not push development work to `main`.
- [x] Stage one and stage two are committed and pushed to the development branch; latest stage-two commit is `edd53625a7f4b60b10caabb41c88523e106d8a95`.
- [ ] Commit each remaining verified stage and confirm the remote branch SHA and GitHub Actions result.
- [ ] Final report must distinguish verified implementation from incomplete work and cover source/schema findings, files changed, tests, commit SHA, Actions result, staging status, deployment readiness and remaining approval items.
