# NutritionPro

NutritionPro is intended to help Australian food businesses manage ingredients, recipes, nutrition calculations, panels and label workflows. This repository is the authorized development foundation in `orderslongfordstore-jpg/NutritionMath`, branch `development/nutritionpro-foundation`; it is not verified original production source code. The live Render website and production database remain untouched.

## Current development status

The React/TypeScript/Vite prototype has session-local ingredient CRUD, named recipes with immutable versions, cooked-batch records linked to exact recipe versions, and measured final-yield calculations. When Supabase is not configured, the user must explicitly choose **local-only mode** to access these features; the app warns that data is held only in the page session and is neither authenticated nor durable. When a public Supabase project is configured, the ingredient, recipe and label workspaces remain behind Supabase Auth.

The draft NIP uses an explicit three-significant-figure display convention, derives per-serving and per-100-g values from full-precision batch totals and measured finished yield, and includes fibre only when the user marks it applicable. A printable label draft links to a session batch and requires user-entered ingredient, allergen, storage and date-mark text. It remains permanently watermarked **DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE**. This is not a product-specific compliance determination. Claim-triggered rows, exceptions, liquid-food formats, AFCD process-retention factors, commercial artwork approval and other product-specific requirements remain incomplete; see [the FSANZ implementation baseline](FSANZ_IMPLEMENTATION_BASELINE.md).

Ingredient CSV/XLSX exports and recipe-calculation XLSX/PDF worksheets are also available. Ingredient and recipe/batch data are not persisted to a database. The in-memory repository is a future data-access boundary, not a fake Supabase adapter. See [TODO.md](TODO.md), the [feature-preservation/integration report](FEATURE_PRESERVATION_AND_INTEGRATION_REPORT.md), and [AFCD test-fixture provenance](AFCD_TEST_FIXTURE_NOTES.md).

## Local development and validation

Use Node.js 22 or a compatible current LTS release. Run `npm ci` to install exactly from the committed lockfile, `npm run dev` for the local app, `npm test` for tests, `npx tsc -b --pretty false` for type checking and `npm run build` for the production build. The app's build output is written to `dist/`.

The latest local check after the explicit local-only access gate change passed `npm ci`, TypeScript, 55 tests across 12 files, Vite production build, `npm audit --omit=dev` (zero production/runtime vulnerabilities) and `git diff --check`. The build emits a known large, lazy-loaded ExcelJS chunk of approximately 939 kB minified / 271 kB gzip. GitHub Actions for this latest milestone remains pending.

## Supabase configuration and data safety

`.env.example` contains blank placeholders for browser-visible values only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep them blank until a separate non-production project is explicitly approved. Vite embeds `VITE_*` values in the browser bundle. Never put a service-role key, database password or other server secret in a `VITE_*` variable, source file, log or GitHub commit.

The user explicitly denied authorization for the `NutrientsMath` project (`ndvjrsegapfhnhrjypck`); do not connect the application to it, modify its schema or create accounts there. The supplied production project is inaccessible to this development session and must remain untouched. Real Auth, persistence and RLS verification must wait until the user provides or approves a separate staging project.

The Vite SPA currently uses Supabase JS browser session persistence (`persistSession`) with PKCE. It does not use `@supabase/ssr` or HttpOnly cookie sessions. Auth component tests use mocks; they do not contact Supabase. The local-only mode is available only when there is no valid public Supabase client and makes no network authentication or persistence claim.

## Render and deployment safety

The existing Render production service tracks `main`; do not push development work to `main`, change Render settings or trigger a production deploy. The Vite build command is `npm run build` and static output is `dist/`. Do not merge or deploy without explicit approval.
