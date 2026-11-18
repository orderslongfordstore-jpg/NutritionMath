# NutritionPro Development Plan

## Scope and boundaries

Continue the approved development foundation in `orderslongfordstore-jpg/NutritionMath` on `development/nutritionpro-foundation`. The user confirms this is a new development foundation, not verified original production source code. The product name remains **NutritionPro**; do not claim the live production app has been replaced or that this branch is its verified source.

Do not deploy, change Render production configuration, or write to the production Supabase project `nfzsjmzpiweeqtkypcgn`. The user explicitly denied authorization for the separate `NutrientsMath` project `ndvjrsegapfhnhrjypck`; do not connect it to the app, modify its schema, or create accounts there. No separate staging project is currently approved. Implement and test only code that does not require access to a Supabase project, using safe public-key placeholders and mocks where appropriate. Do not place a service-role key in Vite/browser code.

## Implementation approach

Keep the existing React + TypeScript + Vite single-page app and component structure. Preserve the tested nutrition calculation API where practical, make invalid and overflowing calculations explicit, and complete local ingredient/recipe workflows, yield/batch calculations, draft NIP presentation and export functionality without pretending local state is persisted. Add native Supabase Auth client code and session UI only behind public environment placeholders; use mocked clients for local tests. Real registration, recovery, persistent storage, ownership/RLS behavior and remote authentication remain unverified until the user provides or approves a separate staging project.

Use `src/lib/nutrition.ts` as the calculation core, `src/types.ts` for shared domain types, `src/components/` for workflow screens, `src/lib/` for Auth/data/export helpers, and `src/__tests__/` for unit/regression coverage. Keep `.env.example` limited to public Supabase URL and anon/publishable key placeholders; actual values stay out of Git. Clearly separate an internal draft NIP from a regulatory compliance claim and describe data as session-only until an approved persistence target exists.

Keep the development toolchain on Node 22 with pinned Vite 6.4.6, Vitest 4.1.12 and `@vitejs/plugin-react` 5.2.0; use ESM-aware TypeScript resolution for the Vite config. These upgrades address the initial vulnerable Vite/Vitest paths without force or peer-dependency bypass. The full development audit still reports the upstream `picomatch` repeated-extglob ReDoS advisory (no patched release published as of 18 November 2026); do not suppress or override it with an unverified version. Recheck after upstream publishes a fix. The production-only audit is clean.

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

## Curry sausages and mash validation and provenance

Continue from the current session-only prototype. Add a prepared-meal assembly layer that can combine separately cooked batch records by declared component weights (first case: 400 g curry sausages plus 200 g mash per 600 g plated serving), while retaining each component's independently measured finished yield, nutrient totals, portion contribution, leftovers and scaling. Keep all arithmetic in full precision until the display layer. Do not interpret a component's raw input weight as its cooked yield. Require explicit, user-sourced retention factors for each nutrient; do not default to 100% retention. Apply the selected factors before subtracting the nutrients in declared measured discard output, and preserve the method/source in the record.

Add an editable curry-sausages-and-mash validation case populated only with facts supplied by the user: 7.2 kg sausages; 2 kg onions; 2 kg carrots; one bunch celery; 1 kg peas and corn; 100 g Keen's curry powder; garlic with quantity unspecified; 160 g MAGGI chicken stock; 8 litres water; 4 tablespoons fruit chutney; 3 cups cornflour; and Farm Frites mashed potato without a supplied quantity or exact product. Preserve the source units and supplied wording. Leave unresolved weights, SKU/barcode and product nutrient panels blank and explicitly unresolved. Do not guess gram weights from cups, tablespoons or bunches and do not invent branded label data. For water, retain 8 L as a volume input unless a measured gram equivalent or an explicitly accepted density is supplied. Full nutrition, recipe-cost and NIP results stay blocked while required amounts, product profiles and measured curry/mash yields remain incomplete.

Extend ingredient records with optional category, brand/product identifier/barcode, entered source type, source reference and safe HTTP(S) source URL, plus verification state. AFCD values remain generic food-composition references with dataset key/release/derivation; never label them as a matching branded food or supplier specification. Include the current FSANZ attribution, changes, limitation, Australian-data, warranty and licence information in UI/exports when AFCD values are distributed. Allow manual manufacturer-label nutrient capture, keep its source/provenance editable, and distinguish verified label/reference facts from estimated/unverified facts. Only exact supported units convert directly: mass units such as kg to g; volume must not silently become mass without a supplied density.

Add meal assembly controls in the existing black/white/yellow interface, retain explicit session-only/auth gating, and expose draft totals per combined 600 g serving and per 100 g only when every selected component batch and plated component weight is valid. Expand label drafts with the requested business/product, production date, lot/batch and best-before/use-by data. If generating a formula-based ingredient-order suggestion, require complete ingoing component weights and user-verified label ingredient names; keep compound ingredients, additives, water/reconstitution and other product-specific declaration rules reviewable. Add functional label PDF/XLSX draft exports containing NIP, retention evidence, missing-data warnings, source notices and draft watermarks. Never claim regulatory compliance.

## Current-source regulatory extension

Use the existing FSANZ implementation baseline and verify current authoritative sources before changing regulatory rendering, ingredients-order logic, allergen statements, date marks, traceability or business/product identity fields. Separate binding Code requirements, FSANZ explanatory guidance, AFCD dataset facts and software conventions in both code and documentation. If a rule needs missing formula, supplier, process or shelf-life information, block or label it unresolved instead of autofilling.

## Delivery constraints

All work stays on `development/nutritionpro-foundation`. Verify each code stage with the repository's install, typecheck, tests, and production build; commit completed stages and push only to that branch so Render's `main` auto-deploy is not triggered. Do not report live Supabase flows, database persistence, RLS, production source equivalence, regulatory compliance, or deployment readiness as verified without the actual checks and access required. Never deploy or change production configuration without the user's explicit approval.
