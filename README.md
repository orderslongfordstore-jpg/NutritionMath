# NutritionPro

NutritionPro is intended to help Australian food businesses manage ingredients, recipes, nutrition calculations, panels and label workflows. This is the authorized development foundation in `orderslongfordstore-jpg/NutritionMath`, branch `development/nutritionpro-foundation`; it is not verified original production source code. The live Render website and production database remain untouched.

## Current development status

The React 18/TypeScript prototype uses pinned Vite 6.4.6, Vitest 4.1.12 and `@vitejs/plugin-react` 5.2.0. It includes session-local ingredient CRUD with brand/SKU/barcode and source provenance, a small generic AFCD Release 3 reference catalog, g/kg recipe entry, immutable named recipe versions, measured cooked-batch records, separate component-meal assembly, and batch/meal-linked NIP and printable label drafts. When Supabase is not configured, a user must explicitly choose **local-only mode**; the app warns that work is unauthenticated, unsynced and not durable. When a public Supabase client is configured, protected workspaces remain behind Supabase Auth. In-memory records are scoped to the authenticated user identity and are synchronously cleared when identity changes.

Batch calculation requires explicit operator-entered retention factors and a source/method for each of eight nutrients; no 100% factor is silently assumed. These factors are recorded with the batch and shown in label-review exports, but are not experimentally validated. Independent process review is needed before use.

The draft NIP calculates per-serving and per-100-g values from measured finished yields and combined meal portions, keeps full precision until display, and shows at most three significant figures under a disclosed software convention. The printable label collects user-entered ingredient/allergen/storage/date text and stays permanently marked **DRAFT — NOT REVIEWED OR APPROVED FOR COMMERCIAL USE**. Neither calculation nor print constitutes regulatory approval.

The supplied curry-sausages-and-mash case preserves only the given quantities and unknowns. Its 12,460 g known g/kg subtotal is expressly incomplete; it excludes celery-bunch weight, garlic quantity, 8 L water, cup/tablespoon measures and unquantified mash. The supplied 400 g curry + 200 g mash = 600 g plated portion is represented, but real nutrition, cooked yields, portions and commercial NIP remain blocked pending identified products, supplier nutrition facts, measured weights/yields and reviewed process inputs. Synthetic AFCD regressions do not represent sausage brands or Farm Frites mash.

Ingredient CSV/XLSX, recipe worksheet PDF/XLSX and label-draft PDF/XLSX exports are available. AFCD attribution, changes, limitation, Australian-data, as-is warranty and licence notices accompany AFCD-derived exports. See the [current FSANZ/AFCD review](CURRENT_FSANZ_AFCD_REVIEW.md), [AFCD licence notice](AFCD_DATA_LICENSE_NOTICE.md), [implementation baseline](FSANZ_IMPLEMENTATION_BASELINE.md), [AFCD fixture provenance](AFCD_TEST_FIXTURE_NOTES.md), [dependency audit](DEPENDENCY_AUDIT.md), [outcomes checklist](TODO.md), and [feature-preservation report](FEATURE_PRESERVATION_AND_INTEGRATION_REPORT.md).

## Local development and validation

Use Node.js 20.19.0+ or 22.12.0+ (the toolchain's supported engine range). Run `npm ci`, `npm run dev`, `npm test`, `npx tsc -b --pretty false` and `npm run build`. Build output is written to `dist/`.

On 19 November 2026, a clean `npm ci`, TypeScript check, **81 tests across 17 files**, production build, `npm audit --omit=dev` (zero production/runtime vulnerabilities) and `git diff --check` passed with the upgraded toolchain. The build warns that the lazy-loaded ExcelJS chunk is approximately 940.19 kB minified / 271.33 kB gzip, above Vite's 500 kB warning threshold. The full development `npm audit` still reports five high-severity package paths from one Picomatch ReDoS advisory; the advisory lists no patched release. Do not claim the full audit is clean; see [dependency audit findings](DEPENDENCY_AUDIT.md).

The previously pushed implementation commit `3c88195c9932b294098b877904d297ae2cc270ef` passed [Actions run 44307322463](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/44307322463); documentation commit `4fe66f57a2ccd6401f1963792820d7a2f33bafdf` passed [run 44307591068](https://github.com/orderslongfordstore-jpg/NutritionMath/actions/runs/44307591068). The current dependency/toolchain follow-up is being verified on the same development branch; its CI result will be recorded after push.

## Supabase and data safety

`.env.example` contains blank placeholders for browser-visible `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only. Vite embeds `VITE_*` values in the browser bundle. Never put a service-role key, database password or other server secret in a `VITE_*` variable, source file, log or GitHub commit.

No separate staging Supabase project has been approved. Do not connect to or modify production project `nfzsjmzpiweeqtkypcgn` or the explicitly rejected `NutrientsMath` project `ndvjrsegapfhnhrjypck`. No real Auth or database integration has been verified. Current batch, recipe, ingredient and label data are held only in page/session state. The session repository is a data-access boundary, not a fake Supabase adapter.

The browser SPA uses `@supabase/supabase-js` session persistence with PKCE; it does not use `@supabase/ssr` or HttpOnly cookie sessions. Auth UI tests are mocked and make no remote calls.

## Render and deployment safety

Do not push development work to `main`, change Render production settings, modify production data, or deploy without explicit approval. The Vite build command is `npm run build` and its static output is `dist/`. Real staging tests, persistence, schema mapping and RLS remain blocked until a separate project is explicitly approved.
