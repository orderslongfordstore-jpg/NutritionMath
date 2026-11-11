# NutritionPro Development Plan

## Scope and boundaries

Complete the existing React + TypeScript + Vite project in `orderslongfordstore-jpg/NutritionMath` on `development/nutritionpro-foundation`. The user-facing product name remains **NutritionPro**. Preserve working calculation code and improve it with regression tests rather than replacing it unnecessarily. Do not deploy, change Render production configuration, or write to the production Supabase project `nfzsjmzpiweeqtkypcgn`.

The current accessible Supabase project `NutrientsMath` contains an empty NutritionPro schema and deny-all direct-access RLS policies, but it is not yet confirmed as the authorized staging target. Treat its metadata as discovery only. Do not apply migrations or create accounts there until staging identity is confirmed. No service-role key belongs in Vite/browser code.

## Implementation approach

Keep the existing Vite single-page app and component structure. Unblock the existing TypeScript/build failure and restore the imported stylesheet first. Retain the tested nutrition calculation API where practical, but make invalid and overflowing calculations explicit instead of silently producing misleading values. Implement the required user workflows in small, testable modules: ingredient CRUD/search/validation; recipe editing, weight/yield and nutrition summaries; draft NIP/label data; safe CSV and PDF export where dependencies are available; then Supabase Auth and persistence with database-enforced owner/workspace RLS. Use the actual checked schema and add reviewed migrations only after the staging project is confirmed.

Use `src/lib/nutrition.ts` as the core calculation module, `src/types.ts` for shared domain types, `src/components/` for workflow screens, `src/lib/` for Supabase/data/export helpers, and `src/__tests__/` for unit/regression coverage. Keep application configuration in `.env.example` using only public Supabase URL and publishable/anon key placeholders; actual values stay out of Git and browser bundles must never contain a service-role key. Preserve a clear separation between unverified draft label output and regulatory compliance claims.

## Design direction

- **Design movement:** A precise food-lab worksheet aesthetic, adapted for small-screen use.
- **Core principles:** legibility first; explicit units; honest draft/review status; mobile-first controls.
- **Color philosophy:** black and white provide strong contrast, while a focused yellow accent highlights key actions and calculated values. Errors use a separate, unambiguous warning color.
- **Layout paradigm:** Desktop uses a compact side navigation and a work area; mobile stacks the workflow with clear section headings and full-width controls.
- **Signature elements:** yellow calculation markers, bold black section labels, and compact unit badges beside nutrition values.
- **Interaction philosophy:** validate fields at entry, explain invalid inputs, keep calculations reproducible, and make save/export status visible.
- **Animation:** minimal transitions only; honor reduced-motion preferences and never animate nutrition numbers in a way that obscures exact values.
- **Typography:** system sans-serif for UI text, tabular numerals for results, and restrained monospaced treatment for units/IDs.
- **Brand essence:** Practical nutrition tools for Australian food and meal-preparation businesses; precise, direct, and trustworthy.
- **Brand voice:** Specific and plain-language. Examples: “Check the batch yield before you print.” “Draft panel — verify product data and applicable rules.”
- **Wordmark concept:** A compact N mark formed from two measurement bars, paired with the NutritionPro wordmark.
- **Signature brand color:** a high-visibility yellow used for action and calculation emphasis, not for long body text.

## Delivery constraints

All work stays on `development/nutritionpro-foundation`. Verify each stage with the repository's real install, typecheck, tests, and production build; commit completed stages and push only to that branch so Render's `main` auto-deploy is not triggered. Do not report tests, Supabase flows, regulatory compliance, or deployment readiness as passed without executing the relevant checks and receiving the required staging access.
