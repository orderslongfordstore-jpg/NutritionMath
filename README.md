# NutritionPro

NutritionPro is intended to help Australian food businesses manage ingredients, recipes, nutrition calculations, panels and label workflows. The product name remains **NutritionPro**. This repository is the authorized development foundation in `orderslongfordstore-jpg/NutritionMath`, branch `development/nutritionpro-foundation`; the user has confirmed that it is not verified original production source code. The live Render website and production database are reference-only and must not be changed during this work.

## Current development status

The branch contains a React, TypeScript and Vite prototype. Ingredient create/edit/delete/search and recipe arithmetic run in browser memory only. Native Supabase email/password flows, PKCE session restoration, sign-out and password recovery/update calls are implemented using `@supabase/supabase-js`; private workspaces are gated when no authenticated session is available. Account forms remain disabled because there is no approved staging Supabase project or public project configuration, so real registration/login and database access have not been tested.

Ingredient CSV and XLSX exports and recipe-calculation XLSX/PDF draft exports are available. The recipe outputs are internal worksheets, not FSANZ-validated Nutrition Information Panels or consumer labels. The nutrition calculation engine is reused as-is. Database persistence, ownership/RLS, saved recipes/batches, final-yield calculations and formally reviewed Australian NIPs remain incomplete. See [TODO.md](TODO.md) and the [feature-preservation/integration report](FEATURE_PRESERVATION_AND_INTEGRATION_REPORT.md) for details.

## Local development and validation

Use Node.js 22 or a compatible current LTS release. Run `npm ci` to install exactly from the committed lockfile, `npm run dev` for the local app, `npm test` for tests, `npx tsc -b --pretty false` for type checking and `npm run build` for the production build. The app's build output is written to `dist/`.

The latest application-code milestone (`aaa1bcc`) passed 32 tests across 7 files, the TypeScript/Vite production build, `npm audit --omit=dev` (zero reported runtime vulnerabilities after the patched UUID override) and its GitHub Actions run. ExcelJS is lazy-loaded for export and produces a separate approximately 939 kB minified / 271 kB gzip chunk, which remains a bundle-size consideration.

## Supabase configuration and data safety

`.env.example` contains blank placeholders for browser-visible values only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep them blank until a separate non-production project is explicitly approved. Vite embeds `VITE_*` values in the browser bundle. Never put a service-role key, database password or other server secret in a `VITE_*` variable, source file, log or GitHub commit.

The user explicitly denied authorization for the `NutrientsMath` project (`ndvjrsegapfhnhrjypck`); do not connect the application to it, modify its schema or create accounts there. The supplied production project is inaccessible to this development session and must remain untouched. Real Auth, data persistence and RLS verification must wait until the user provides or approves a separate staging project.

The Vite SPA currently uses Supabase JS browser session persistence (`persistSession`) with PKCE. It does not use `@supabase/ssr` or HttpOnly cookie sessions. Auth component tests use mocks; they do not contact Supabase.

## Render and deployment safety

The existing Render production service tracks `main`; do not push development work to `main`, change Render settings or trigger a production deploy. The Vite build command is `npm run build` and the static output is `dist/`. This repository does not claim to contain a completed production deployment configuration. Do not merge or deploy without explicit approval.
