# NutritionPro Development Plan

## Scope and boundaries

Continue the approved development foundation in `orderslongfordstore-jpg/NutritionMath` on `development/nutritionpro-foundation`. The user confirms this is a new development foundation, not verified original production source code. The product name remains **NutritionPro**; do not claim the live production app has been replaced or that this branch is its verified source.

Do not deploy, change Render production configuration, or write to the production Supabase project `nfzsjmzpiweeqtkypcgn`. The user explicitly denied authorization for the separate `NutrientsMath` project `ndvjrsegapfhnhrjypck`; do not connect it to the app, modify its schema, or create accounts there. No separate staging project is currently approved. Implement and test only code that does not require access to a Supabase project, using safe public-key placeholders and mocks where appropriate. Do not place a service-role key in Vite/browser code.

## Implementation approach

Keep the existing React + TypeScript + Vite single-page app and component structure. Preserve the tested nutrition calculation API where practical, make invalid and overflowing calculations explicit, and complete local ingredient/recipe workflows, yield/batch calculations, draft NIP presentation and export functionality without pretending local state is persisted. Add native Supabase Auth client code and session UI only behind public environment placeholders; use mocked clients for local tests. Real registration, recovery, persistent storage, ownership/RLS behavior and remote authentication remain unverified until the user provides or approves a separate staging project.

Use `src/lib/nutrition.ts` as the calculation core, `src/types.ts` for shared domain types, `src/components/` for workflow screens, `src/lib/` for Auth/data/export helpers, and `src/__tests__/` for unit/regression coverage. Keep `.env.example` limited to public Supabase URL and anon/publishable key placeholders; actual values stay out of Git. Clearly separate an internal draft NIP from a regulatory compliance claim and describe data as session-only until an approved persistence target exists.

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

All work stays on `development/nutritionpro-foundation`. Verify each code stage with the repository's install, typecheck, tests, and production build; commit completed stages and push only to that branch so Render's `main` auto-deploy is not triggered. Do not report live Supabase flows, database persistence, RLS, production source equivalence, regulatory compliance, or deployment readiness as verified without the actual checks and access required. Never deploy or change production configuration without the user's explicit approval.
