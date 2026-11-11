# NutritionPro

NutritionPro is intended to help Australian food businesses manage ingredients, recipes, nutrition calculations, panels, and label workflows. This GitHub repository is the development codebase (`NutritionMath`); the product name remains **NutritionPro**. The live Render website is reference-only and must not be overwritten during development.

## Current development status

This branch contains an early React, TypeScript, and Vite prototype. Ingredient and recipe edits are currently held in browser memory, and the label area contains example-only content. The Supabase client is configured as an optional browser client, but registration, login, password recovery, persistent data access, owner-specific authorization, generated labels, PDF/Excel exports, and database migrations are not complete. The panel preview is not a regulatory compliance determination.

Follow `TODO.md` for current acceptance criteria and completion status. Do not present this prototype as production-ready while any required outcome remains open.

## Local development

1. Use Node.js 22 or a compatible current LTS release.
2. Install exactly from the committed lockfile with `npm ci`.
3. Run the local app with `npm run dev`.
4. Run all unit tests with `npm test`.
5. Run the TypeScript project check with `npx tsc -b --pretty false`.
6. Create a production bundle with `npm run build`.

The build output is written to `dist/`.

## Supabase configuration and data safety

`.env.example` documents browser-visible values only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Vite embeds `VITE_*` values in the browser bundle. Never put a service-role key, database password, or other server secret in a `VITE_*` value, source file, or GitHub commit.

Use a confirmed development/staging Supabase project for local integration. Do not use the production NutritionPro project, create production accounts, apply production migrations, or alter production data during development. The currently accessible `NutrientsMath` project is only an unconfirmed staging candidate; do not write to it until its role has been confirmed. No credentials are included in this repository.

## Render preparation

The existing Render production service tracks `main`; do not push development work to `main` or trigger a production deploy. The current Vite production command is `npm run build` and the static output is `dist/`. A separate, reviewed staging service and its environment settings must be established before external integration testing. This repository does not claim to contain a completed Render deployment configuration.

## Validation record

At the original audited commit `5d8c5fd8f40a375e1cf980b6bdcd5ad0cc7c5799`, TypeScript and the production build failed because the Vite config imported `defineConfig` from `vite` while declaring Vitest's `test` field. The entry point also imported a stylesheet that was missing from the repository. Stage-one work on this development branch corrects both issues. Re-run all checks after every later change; the authoritative results are the latest local run and GitHub Actions run, not this historical note.
