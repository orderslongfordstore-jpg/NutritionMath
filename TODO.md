# NutritionPro Outcomes

## 1. Calculation engine and regression coverage

- [x] Preserve the existing recipe calculation API and guard non-finite, negative, zero, missing and overflow cases.
- [x] Report invalid inputs rather than displaying fallback results as valid.
- [x] Add measured cooked-yield, loss/gain, discard and portion calculations without treating raw weight as cooked yield.
- [x] Require a user-sourced retention factor for each of eight nutrients; leave all fields blank by default, reject missing/out-of-range factors and missing source/method, and do not assume 100% retention.
- [x] Apply explicit post-cooking factors before subtracting nutrient values recorded for measured discarded output; record factors/source with the session batch and include them in label-review output.
- [x] Test explicit non-100% retention, missing values, missing source, measured discard, scaling, portions, AFCD-based calculation and combined-meal arithmetic.
- [ ] Obtain independent food-process/dietitian review of the retention model and its assumed order relative to process loss/discard before commercial use; this model is user-input infrastructure, not validated science.

## 2. Ingredient records and source provenance — prototype, session-only

- [x] Create, edit, delete, search and export session-local ingredient records with per-100-g nutrients, serving size and allergens.
- [x] Record category, brand, product code/SKU, barcode, source type, source reference, safe HTTP(S) source URL and verification status.
- [x] Reject unsafe ingredient source URLs and render source links only for safe HTTP(S) URLs without embedded credentials.
- [x] Provide an offline four-profile AFCD Release 3 reference subset with food IDs, per-100-g values, source references and direct FSANZ data-files link.
- [x] Distinguish AFCD generic values from manufacturer-label data; do not claim AFCD profiles represent branded products or imply an empty allergen field means allergen absence.
- [x] Include AFCD-required attribution, changes, limitation, Australian-data, as-is warranty notice and licence URL in the catalog and AFCD-containing ingredient CSV/XLSX output; document the scope of the CC BY-SA 3.0 Australia terms in `AFCD_DATA_LICENSE_NOTICE.md`.
- [x] Accept g or kg in recipe mass input and convert with an exact shared helper. Unsupported kitchen units and volume-to-mass conversion remain unresolved without measured mass/density.
- [ ] Add an AFCD/manufacturer data import route only with correct source, licence and SKU verification; the current AFCD catalog is a small offline sample, not a full database or barcode lookup.
- [ ] Persist ingredient data only after a separate staging Supabase project and schema/ownership model are explicitly approved.

## 3. Curry-sausages-and-mash validation case

- [x] Add an editable session-only case using only supplied facts: 7.2 kg sausages; 2 kg onions; 2 kg carrots; one bunch celery; 1 kg peas and corn; 100 g Keen's curry powder; garlic unspecified; 160 g MAGGI chicken stock; 8 L water; 4 tablespoons fruit chutney; 3 cups cornflour; and Farm Frites mashed potato with no supplied amount/SKU.
- [x] Display the computed known g/kg subtotal of 12,460 g. Keep the subtotal explicitly incomplete; it excludes the unresolved celery bunch, garlic, 8 L water, kitchen measures and mash.
- [x] Allow quantity, unit, source note, product reference and source URL edits. Do not guess tablespoon/cup/bunch masses, peas/corn split, product label values or mash yield.
- [x] Record the supplied plated portion: 400 g curry + 200 g mash = 600 g total.
- [ ] Obtain actual product/pack identities and nutrient labels; weigh unresolved recipe inputs; independently measure cooked curry and finished mash yields and source process-specific retention factors before calculating the real product NIP or serving count.
- [ ] No real curry/mash nutrition, cooking yield, ingredient order, cost or commercial label is claimed by the synthetic AFCD regressions.

## 4. Recipes, production batches and meal assembly — session-only

- [x] Add/edit recipe ingredients in g/kg and servings; save immutable named recipe versions and load exact snapshots for batch work.
- [x] Create batch records linked to exact recipe version and batch identification; scale formula/additions/discards; require measured cooked and portion weights.
- [x] Record raw input mass, added materials, measured cooked weight, declared measured discard, final finished weight, weight loss/gain, portion count, remainder, per-100-g and per-serving totals.
- [x] Require a nutrient profile for each measured discarded output; the profile must represent the discard, not automatically the uncooked food.
- [x] Combine separate measured cooked batches by declared plated component weights; calculate component allocations, limiting finished meal yield, leftovers, serving weight and combined NIP inputs.
- [ ] Improve process-specific model only with independently reviewed data for nutrient changes and process loss; all factors entered in the current prototype are assumptions supplied by the operator and are not independently validated.
- [ ] Persist recipes, batches and combined meals after a separately approved staging project exists.

## 5. Australian NIP draft — not a compliance determination

- [x] Generate a batch-linked solid-food draft NIP in ordinary nutrient order with per-serving and per-100-g quantities, units, serving size and servings/package.
- [x] Use full-precision aggregate nutrition inputs and explicit software display rounding to no more than three significant figures.
- [x] Include fibre only if the user explicitly marks it applicable; never infer allergen status or legal claim triggers from nutrients.
- [x] Support a combined plated meal's NIP from the separate component-batch calculations, not only an individual component.
- [x] Display persistent draft/not-approved warnings in app, print preview, PDF and XLSX.
- [ ] Implement and independently verify all claim-specific nutrients, fibre special cases, `<` rules, Schedule 12 exceptions, liquid formats, food classification and current Code presentation provisions before commercial use.
- [ ] Verify all user-entered factors, ingredient panels, final yields, declared servings and product claims against actual product records.

## 6. Food-label draft and export — review draft only

- [x] Capture product name, supplier business name/address, SKU/barcode, production date, linked batch/meal, ingredient declaration, allergen wording, precautionary wording, storage text, date-mark type/text, servings/package and fibre applicability.
- [x] Suggest ingredient order only when formula lines are complete, there are no declared discards, every profile is non-AFCD/non-estimate, user-verified and has a source reference. Require the user to explicitly insert the suggestion; never auto-write a legal declaration.
- [x] Require explicit user review confirmations for the ingredient list, allergen text, storage and date mark before print. These confirmations do not constitute approval.
- [x] Provide working client-side label PDF and XLSX exports, with draft watermark, source/retention evidence, NIP when valid, and missing-data notices.
- [x] Provide ingredient XLSX/CSV and recipe calculation XLSX/PDF; harden spreadsheet text against formula injection.
- [ ] Validate actual descending ingoing weights for compound ingredients, processing aids, additives, water/reconstitution, cooking losses and all Code rules with a qualified label reviewer.
- [ ] Complete commercial artwork and product-specific checks including mandatory identifiers/contact fields, date-mark decision, lot/traceability, claims, allergens, country-of-origin and packaging/layout requirements.
- [ ] No generated label is approved, verified compliant or authorized for sale.

## 7. Authentication, data persistence and security — remote verification blocked

- [x] Implement native Supabase JS email/password registration/login, PKCE, browser-session restore, sign-out, recovery and password update; mocked tests only.
- [x] Keep the client fail-closed when Supabase config is absent; provide explicit local-only access only if no valid public client is configured, with a non-authenticated/non-durable page-session warning. Require Auth when a public Supabase project is configured.
- [x] Keep browser config limited to public URL and anon/publishable key; no service-role key in frontend.
- [x] Key the in-memory workspace by authenticated user ID so identity changes synchronously discard previous session records; verify with an App-level account-switch regression.
- [ ] Verify real Auth, session restoration, recovery redirects, ownership and database I/O only against a separately approved non-production Supabase project.
- [ ] Confirm actual schema and RLS, implement authenticated persistence and cross-user negative tests.
- [ ] Do not use/modify production Supabase `nfzsjmzpiweeqtkypcgn` or the explicitly rejected `ndvjrsegapfhnhrjypck`. No staging Supabase project is approved.

## 8. User interface

- [x] Keep the NutritionPro black/white/yellow brand and mobile-first responsive controls, with explicit warnings, units and disabled invalid actions.
- [x] Keep data, recipes, batches, assemblies and label draft in the current session only; no cross-reload or cross-user persistence claim.
- [ ] Repeat physical iPhone-width smoke tests for the latest label exports, provenance fields, combined meal and retention-entry form.
- [ ] Complete accessibility and final authenticated workflows after approved staging integration.

## 9. Verification and delivery

- [x] `npm ci` completed from the lockfile using Node 22.23.4/npm 10.9.9 (19 November 2026).
- [x] `npx tsc -b --pretty false` passed after setting ESM-aware `Bundler` module resolution for the Vite-config TypeScript project.
- [x] `npm test`: 81 tests passed across 17 files under Vitest 4.1.12.
- [x] `npm run build` passed under Vite 6.4.6. Known warning: lazy-loaded ExcelJS chunk ~940.19 kB minified / 271.33 kB gzip, above Vite's 500 kB warning threshold; review before release.
- [x] `npm audit --omit=dev`: 0 production/runtime vulnerabilities.
- [x] Full `npm audit` run and documented in `DEPENDENCY_AUDIT.md`: five high-severity dependency paths refer to one unpatched `picomatch` GHSA-fc5q-39xc-vjpf in development/test tooling. Upstream lists no patched release; do not hide the finding or use an unverified override.
- [x] `git diff --check` passed after the current toolchain and documentation updates.
- [x] Prior implementation commit `3c88195c9932b294098b877904d297ae2cc270ef` passed Actions run [44307322463](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/44307322463). Documentation follow-up `4fe66f57a2ccd6401f1963792820d7a2f33bafdf` passed [run 44307591068](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/44307591068).
- [ ] Commit/push the verified toolchain and audit documentation only to `development/nutritionpro-foundation`; record its SHA and Actions result.
- [ ] Do not push to `main`, modify Render, deploy production, connect unapproved Supabase, or alter production data.
- [ ] Not ready for staging deployment: real Auth/database/RLS, persistence, real curry-sausages product input and process validation, complete FSANZ review and qualified commercial label approval remain outstanding.
