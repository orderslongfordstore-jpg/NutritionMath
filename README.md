# NutritionPro

NutritionPro is a production-focused Australian nutrition platform for ingredient intelligence, recipe calculation and food-label workflows. This repository is the clean development foundation for the NutritionPro application; the official production application remains served separately and must not be modified during this rebuild.

## Current repository status

This repository was created as a minimal foundation. At the time of audit it contained only a README and `.gitignore` file and no application source or deployment configuration. The rebuild in this branch creates the base application foundation for a production-ready web app in React + TypeScript + Vite, with Supabase integration prepared without touching production data.

## Architecture

- Frontend: React + TypeScript + Vite
- Styling: mobile-first, black/white/yellow NutritionPro branding
- Data layer: Supabase client prepared through environment variables
- Security: anon-key only in frontend; service-role keys never exposed client-side
- Testing: Vitest + Testing Library for nutrition and app logic
- Build: production build for Render deployment

## Local development

1. Copy `.env.example` to `.env.local` and fill in the Supabase values.
2. Install dependencies:
   npm install
3. Start the app:
   npm run dev
4. Run tests:
   npm test
5. Create a production build:
   npm run build

## Production deployment

The app is prepared for Render deployment through a static site configuration. The existing production NutritionPro deployment is not modified during development.

## Important constraints

- No service-role credentials are stored in frontend code.
- The production Supabase database is not reset, overwritten, or modified.
- The app is built as a clean NutritionPro foundation, with a future migration plan to inspect and map existing production data before any cutover.
- This repository must remain the development archive and should not be confused with the live production application.

## Roadmap

1. Foundation app shell and branding
2. Ingredient management and nutrition logic
3. Recipe calculation and batch workflows
4. Nutrition panel generation and label preview
5. Auth and Supabase integration preparation
6. Migration planning for existing live data
7. Final Render deployment after validation

## Notes

The calculation logic in the foundation is intentionally testable and local-first, so it can be validated before connecting to live Supabase data or production migration scripts.
