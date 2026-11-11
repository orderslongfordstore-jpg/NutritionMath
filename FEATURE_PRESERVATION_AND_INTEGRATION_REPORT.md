# NutritionPro Feature-Preservation and Integration Report

**Prepared:** 12 November 2026
**Purpose:** Establish which source was accessible, what it actually implements, what remains unavailable, and how to continue safely.
**No production deployment, production database write, account creation, or secret retrieval was performed.**

## Executive findings

The source code supplied through the authorized development branch is a React/TypeScript/Vite NutritionPro prototype with local ingredient and recipe interactions and nutrition arithmetic. It is **not** a complete persisted application: the original baseline had no real Supabase Auth calls, database CRUD, user ownership, tracked schema migrations/RLS policies, saved recipes, production batches, rule-validated Australian NIPs, PDF/XLSX exports, or working label-generation flow.

The repository identity is not fully reconciled. The user-provided GitHub URL `orderslongfordstore-jpg/nutritionPro` returned 404 under the connected GitHub access. Render’s read-only service configuration instead identifies `orderslongfordstore-jpg/NutritionMath`, branch `main`, as the linked repository. That repository is accessible, and the requested NutritionPro app source is present on `development/nutritionpro-foundation`. However, the fetched `main` branch currently points to `5fa809d` and contains only `.gitignore` and `README.md`; the app source in the development branch is not present on that `main` snapshot. Therefore, I cannot certify that the accessible development source is the same code currently serving the live NutritionPro URL. No production deploy was attempted.

The supplied production Supabase ID `nfzsjmzpiweeqtkypcgn` is not visible to the connected Supabase account. An active, separate project named `NutrientsMath` (`ndvjrsegapfhnhrjypck`) has matching empty NutritionPro tables, but it remains an **unconfirmed staging candidate**. Its schema was inspected read-only; no migration, policy change, account creation, or data write was made. The candidate’s RLS policies deny all direct access to `anon` and `authenticated`, so browser CRUD will not work until an authorized, reviewed access model is implemented.

## Source identity and access

| Item | Verified result |
|---|---|
| User-supplied repository | `https://github.com/orderslongfordstore-jpg/nutritionPro` returned 404 through the connected GitHub API. This does not prove whether it is private, renamed, or a mistaken link. |
| Render-linked repository | `https://github.com/orderslongfordstore-jpg/NutritionMath`, default branch `main`; Render’s NutritionPro service is configured to follow `main` with automatic deployments. |
| Accessible application source | `NutritionMath` branch `development/nutritionpro-foundation`, initially audited at `5d8c5fd8f40a375e1cf980b6bdcd5ad0cc7c5799`. The branch is now at `6d71ed98afdb3b75a984fa8cca8b937764c7f6e5` before this report-only change. |
| Main/source mismatch | `origin/main` at `5fa809d` contains only `.gitignore` and `README.md`; it does not contain the app source found on the development branch. The report does not assume the live deployment is built from the development branch. |
| Manus references in the accessible repo | A tracked-source/package scan of both the audited baseline and current development branch found no `MANUS_OAUTH_API_URL`, `MANUS_OAUTH_PORTAL_URL`, `MANUS_PROJECT_ID`, `/api/oauth/callback`, `app-auth` route, Manus OAuth SDK, or corresponding auth/callback file path. |

The baseline source contains an optional browser-side Supabase client, but its account form did not call `supabase.auth` or restore, subscribe to, or sign out a session. Thus, the checked-in source did not contain Manus OAuth to remove, nor did it contain a working replacement auth flow. The earlier live-site sign-in redirect to Manus cannot be mapped to this branch from the evidence available; the live deployment/source discrepancy remains unresolved.

## Feature-preservation comparison

| Area | Verified original baseline (`5d8c5fd`) | Current development branch (pre-report snapshot) | Still missing |
|---|---|---|---|
| Ingredient database | In-memory creation and name search; eight nutrient values per 100 g, serving size and free-text allergens. No edit/delete or durable storage. | Session-local create/edit/delete/search, finite/non-negative numeric checks, empty states, and safer CSV. No connected database. | Categories/provenance fields must be confirmed from the actual production schema; ownership-enforced persistence is not implemented. |
| Recipes and calculations | Ingredient lines, grams, serving count and derived per-100-g/per-serving arithmetic. No saved recipe entity or production yield. | Local draft add/remove and nutrient summaries with invalid-input issues surfaced; serving count must be a positive whole number. | Named save/load/edit, scaling, cooked/final yield, batch records, lot traceability and persistent ownership. |
| Numeric correctness | Invalid values were often silently coerced to zero; addition overflow could silently discard a contribution; invalid servings fell back to one. | Calculation validity/issues are explicit; regression coverage now includes NaN/Infinity, negative/zero inputs, missing nutrients, invalid servings, extreme values and overflow. Outputs remain finite and invalid totals are not presented as usable. | The calculation model still requires domain review against actual recipe/yield behavior and authoritative regulatory rules. |
| NIP and labels | A generic arithmetic projection and a hard-coded illustrative label; no evidence of validated FSANZ rules, actual declaration generation or printing. | The label area is now an honest empty state. Nutrition output is labelled internal arithmetic, not a compliant NIP. | Reviewed NIP rule implementation, source-data provenance, editable product identity, ingredient/allergen declarations, print/PDF output and human review. |
| Exports | Ingredient CSV only; not a workbook or report. | CSV export quotes cells and mitigates spreadsheet formula injection. | `.xlsx`, PDF and recipe/panel/batch report exports. CSV is not an Excel workbook. |
| Authentication/security | Supabase client configuration was optional; no sign-in, registration, logout, password reset, route/access control, database CRUD, owner model, or tracked RLS migration was found. | The misleading prefilled demo credentials/security claims were removed. Real Supabase Auth and persisted data access are still not implemented. | Native Supabase Auth, persistent sessions, protected workflows, user/workspace mapping, migrations, RLS verification and cross-user denial tests. |
| UI/mobile | The entrypoint imported a missing `src/styles.css`; authored responsive styling was absent. | Restored responsive black/white/yellow styling; removed fictitious demo records and hard-coded `$0.00` cost; verified a 390×844 mobile viewport with no page-level horizontal overflow. | Full visual/accessibility validation once data-backed authenticated screens exist. |

## Supabase schema and access limits

### Supplied production project

The supplied project `nfzsjmzpiweeqtkypcgn` was denied by the connected Supabase project tools and was not visible in the signed-in account’s project list. Therefore, its tables, migration history, Auth users/settings, policies, data ownership, and any existing user records could not be verified. No production rows or keys were read, and the project was not changed.

### Separate, unconfirmed candidate

Read-only inspection of project `NutrientsMath` (`ndvjrsegapfhnhrjypck`, status `ACTIVE_HEALTHY`, region `eu-west-1`) found eight `public.nutritionpro_*` tables, all reporting zero rows:

- `nutritionpro_ingredients`
- `nutritionpro_recipes`
- `nutritionpro_recipe_items`
- `nutritionpro_batches`
- `nutritionpro_processing_adjustments`
- `nutritionpro_calculation_audits`
- `nutritionpro_nutrition_panels`
- `nutritionpro_label_versions`

The candidate has migrations `202611020011 nutritionpro_core`, `202611020018 nutritionpro_deny_public_access`, and `202611060001 nutritionpro_processing_adjustments`. RLS is enabled on all eight tables. The inspected policies are `*_no_direct_access` policies for both `anon` and `authenticated` with `USING false` and `WITH CHECK false`; no public NutritionPro SQL functions or triggers were found. The schema uses text `workspace_key`/`created_by_key` ownership fields in places, whereas `auth.uid()` is a UUID. Any user/workspace mapping must be designed explicitly; replacing existing keys or assuming a one-user/one-workspace model would be unsafe.

This candidate is **not** evidence of the production database’s schema or data and must not be substituted for the production project without confirmation. Its zero row counts do not establish anything about production records. No schema changes were made to it.

### Key and environment implications

For browser-side Supabase Auth and ordinary user-scoped queries, use only the project URL and its public anon/publishable key; RLS must enforce access. A `service_role` key is **not required in the frontend** and must not be placed in a Vite `VITE_*` variable, source, browser bundle, or logs. Privileged server-side administration would require a separate server-only design, but the current source has no such requirement. The branch’s `.env.example` names `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; the user-provided Render variable list included `SUPABASE_URL` but did not establish a configured Vite public key. No Render environment values were changed.

## Authentication-skeleton comparison

The separate scaffold created earlier is a Next.js/React App Router starter with Supabase SSR cookie helpers and example email/password, recovery and protected-page flows. It contains no NutritionPro domain schema, original ingredient/recipe components, calculation logic, or existing saved records. It was not used as a replacement application and was not deployed.

The accessible NutritionPro development source is a Vite SPA. The safe integration direction is to implement Auth in that existing app and connect its existing domain flows to a confirmed compatible database—not to replace the application with the Next.js scaffold. Session strategy, redirects, route guards and user/workspace policy must be selected to match the actual hosting origin and verified schema.

## Changes and validation on the development branch

All source changes were confined to `development/nutritionpro-foundation`; `main`, Render configuration, the live URL, and Supabase were not changed. The branch includes three small milestones before this report: (1) fix the Vite/Vitest config typing and restore the missing stylesheet; (2) harden numeric calculations, remove fictitious seeded records and the false recipe-cost metric, add honest session-local ingredient CRUD/search and safer CSV, and improve responsive UI/validation; and (3) record the CI result. The commits are `c31f90c`, `edd5362`, and `6d71ed9` respectively.

The original failed GitHub Actions run `43103915126` failed at the production-build step. Its private log endpoint was unavailable, but the baseline failure was reproduced locally as a TypeScript config error because `vite.config.ts` used Vite’s `defineConfig` type for a config containing Vitest’s `test` option. The missing stylesheet import was an additional build blocker. Both were corrected on the development branch.

| Check | Result |
|---|---|
| `npm ci` | Passed. |
| `npx tsc -b --pretty false` | Passed after the branch changes. |
| `npm test` | 19 tests passed across both existing test suites, including added regression tests. |
| `npm run build` | Passed. |
| `git diff --check` | Passed. |
| Local Chromium mobile smoke at 390×844 | Passed for the checked dashboard/ingredient/recipe draft paths, including no page-level horizontal overflow. This used local session-only test data. |
| GitHub Actions | Passed for stage-one SHA `c31f90c` (run `43107597901`), stage-two SHA `edd5362` (run `43111435208`), and report-preceding documentation SHA `6d71ed9` (run `43111655900`). |
| Supabase registration/login/recovery, persistent database CRUD, RLS and production logs | Not tested; no connected project was authorized for writes and the specified production project is inaccessible. |

## Safe next steps

1. Resolve the source identity: confirm whether the Render-linked `NutritionMath` development branch is the intended original application, or provide the correct accessible `nutritionPro` repository. The live service’s configured `main` branch currently does not contain the app code present on the development branch.
2. Provide read-only access to the actual production Supabase project if the goal is to verify its existing schema/data ownership, and separately identify the project approved for staging. Alternatively, explicitly confirm whether `NutrientsMath` (`ndvjrsegapfhnhrjypck`) is the authorized non-production project.
3. Once staging is confirmed, design an additive migration and Auth-to-workspace mapping against that project’s actual schema; do not assume Manus passwords can be migrated or merge identities by email without a verified plan. Test registration, login, logout, recovery, owner isolation and denied cross-user access there.
4. Only after staged behavior works, report the exact Render build-time variables and redirect allow-list required. Do not remove legacy environment variables, modify the production database/configuration, merge to `main`, or deploy until the change plan and test results are reported and the user approves.

## Regulatory references

The FSANZ research brief found that the applicable requirements depend on product type, formulation, claims and preparation state; a two-decimal arithmetic preview is not proof of an Australian-compliant NIP. Relevant official sources include [Standard 1.2.8](https://www.legislation.gov.au/F2015L00395/latest/text), [Schedule 12](https://www.legislation.gov.au/F2015L00482/latest/text), [Schedule 11](https://www.legislation.gov.au/F2015L00481/latest/text), [Standard 1.2.4 (ingredients)](https://www.legislation.gov.au/F2015L00392/latest/text), [Standard 1.2.3 (allergen declarations)](https://www.legislation.gov.au/F2015L00397/latest/text), and [FSANZ allergen labelling guidance](https://www.foodstandards.gov.au/business/labelling/allergen-labelling). This report is not a product-specific legal or compliance determination.
