# NutritionPro

NutritionPro is intended to help Australian food businesses manage ingredients, recipes, nutrition calculations, panels and label workflows. This GitHub repository is the authorized development foundation (`NutritionMath`); the product name remains **NutritionPro**. The user has confirmed that this branch is not verified original production source code. The live Render website and production database are reference-only and must not be changed during development.

## Current development status

The branch contains a React, TypeScript and Vite prototype. Ingredient create/edit/delete/search and recipe arithmetic remain in browser memory only. Native Supabase email/password sign-in, sign-up, session restoration, sign-out and password-recovery/update calls are now implemented in the client, with protected workspaces and mocked tests. They are intentionally disconnected and the account forms remain disabled because no staging Supabase project is approved. No real registration, login or recovery has been tested. Database persistence, ownership/RLS, saved recipes/batches, reviewed Australian NIPs, printable labels and `.xlsx`/PDF exports remain incomplete. Nutrition arithmetic is not a regulatory compliance determination.

Follow `TODO.md` for current acceptance criteria and completion status. Do not present this development foundation as production-ready or as a verified replacement for the existing live application.

## Local development

Use Node.js 22 or a compatible current LTS release. Install exactly from the committed lockfile with `npm ci`, run the local app with `npm run dev`, run all tests with `npm test`, run TypeScript checks with `npx tsc -b --pretty false`, and build with `npm run build`. The build output is written to `dist/`.

## Supabase configuration and data safety

`.env.example` contains blank placeholders for browser-visible values only: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Keep them blank until a separate non-production project is explicitly approved. Vite embeds `VITE_*` values in the browser bundle. Never put a service-role key, database password, or other server secret in a `VITE_*` variable, source file, log, or GitHub commit.

The user explicitly denied authorization for the connected `NutrientsMath` project (`ndvjrsegapfhnhrjypck`); do not connect the application to it, change its schema, or create accounts there. The supplied production project is not available to this development session and must remain untouched. Real Auth, database and RLS verification must wait until the user provides or approves a separate staging project.

## Render preparation

The existing Render production service tracks `main`; do not push development work to `main`, change Render settings, or trigger a production deploy. The Vite production command is `npm run build` and the static output is `dist/`. This repository does not claim to contain a completed Render deployment configuration.

## Validation record

The audited baseline build failed because `vite.config.ts` used Vite's `defineConfig` type while declaring Vitest's `test` option; the entry point also imported a missing stylesheet. Both issues were fixed in the development branch. The latest local Auth-stage check passed TypeScript, 25 tests (including mocked Auth flows and a no-project access-gate test), and the production build. The current Auth-stage source changes are still local and have not yet run in GitHub Actions. No Supabase project was contacted during these tests.
