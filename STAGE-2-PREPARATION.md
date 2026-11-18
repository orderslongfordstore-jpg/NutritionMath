# NutritionMath Stage 2 preparation

**Status:** planning only; Stage 2 implementation has not started and is not approved by this document. Stage 1 authentication remains incomplete. This plan assumes the staged approach in [ROADMAP.md](ROADMAP.md) and must be reviewed after the Stage 1 gate and before development begins.

**Prepared:** 19 November 2026, Australia/Sydney. **Author:** Manus AI.

## Current starting point

The working branch is `stage-1-foundation`, based on `3b9f3af` before this planning document. The repository contains the React/Vite dashboard and authentication, an Express health endpoint and authenticated `/api/me`, but no ingredient, supplier or supplier-product CRUD, schemas or ownership policies. The separate NutritionMath Supabase project was reported healthy; a read-only metadata check returned no public tables. These facts do not prove future data isolation.

On this review, `pnpm check`, `pnpm test` and `pnpm build` passed; **168 tests passed across 12 files**. Both `pnpm audit --prod --audit-level low` and the full `pnpm audit --audit-level low` reported no known vulnerabilities. No dependencies were changed. Local Docker, Supabase and PostgreSQL CLIs were not available; a safe way to run real database-policy tests must be agreed before relying on a local database. No Supabase tables, settings, users or data were changed for this planning work.

## Stage 1 gate before implementation

1. **Complete password recovery.** The previous reset email arrived, but its link returned `otp_expired` on first observed use. The cause is unknown. Investigate the delivery and Auth logs without exposing link contents; when the mailer permits, use a new link for the already approved dedicated test account, update its password and verify sign-out plus login with the new password. The temporary password used for the previous test was removed locally. Test confirmation resend if it will be offered at release. See [STAGE-1-AUTH-VERIFICATION.md](STAGE-1-AUTH-VERIFICATION.md).
2. **Resolve the cross-tab authentication risk.** The existing recovery/sign-out marker and stale-event ordering have an identified race. Implement a narrowly reviewed fix with automated adverse-order tests and real two-tab/browser lifecycle checks. Do not assume the expiry UI guard establishes server-side authorization or revocation.
3. **Review operational requirements before any deployment.** Select and verify the exact app origins and recovery/confirmation redirects; review password policy and appropriate email delivery; verify matching independent-project build and runtime settings and retire obsolete assets. The default mailer is restricted and rate-limited. Leaked-password protection is disabled and the provider documents it as a paid-plan feature; do not upgrade or enable paid services without explicit approval. [1] [2]
4. **Obtain Stage 1 sign-off and explicit Stage 2 approval.** Any change to an external Supabase project's schema or settings also requires explicit approval for that target. Do not use or modify the separate NutritionPro project. A Stage 2 feature merge or deployment must additionally pass the data-isolation tests below.

## Proposed Stage 2 scope

Provide real, authenticated ingredient and supplier management with an iPhone-friendly interface. Users should be able to create, search, view, edit and delete their own ingredient records and supplier records, and associate ingredients with supplier products where appropriate. Include meaningful empty, loading, error and confirmation states. Existing dashboard and authentication flows remain functional; unfinished modules must not appear operational.

Store each nutrient as an independently nullable value: energy in **kJ**, protein, total fat, saturated fat, carbohydrate, sugars and dietary fibre in **g**, and sodium in **mg**. The default source basis is **per 100 g edible portion**. A missing value is `NULL` and must display as unknown; an explicit zero is a known value. Editing an unrelated field must preserve unknowns. An omitted update field means unchanged; an explicit `null` clears it. No recipe calculations or regulatory compliance claims are part of Stage 2.

Capture clear provenance: source name or supplier, product identifier where available, reference, source version/date and explanatory notes, including the carbohydrate method when known. Supplier-specific formulations should not silently inherit a different product's nutrient profile. Pack information may be stored without adding costing calculations.

The project-shared FSANZ document describes the NPC 2026 dataset but is **not** the food-level dataset. It describes seven nutrients per 100 g edible portion, with energy and available-carbohydrate conventions that differ from AFCD/AUSNUT; dietary fibre is not among those seven. Verify the actual companion files, their conditions and attribution before any use. Bulk import/export is Stage 8 and is not included here.

**Out of scope:** recipe calculation and scaling, production batches, NIP generation, label PDFs, cost/profit calculations, bulk import/export, team administration, and production deployment. These remain later stages unless the owner explicitly changes the scope.

## Decisions to confirm before database design

- **Ownership:** Should records initially be private to each user, or shared by a business workspace/team from the start? The simpler proposed default is per-user ownership; it does not provide team collaboration. Choose before writing ownership migrations.
- **Supplier-product model:** Confirm whether each source-specific formulation should be a distinct ingredient linked to one supplier product, or whether a single ingredient needs multiple distinct supplier formulations. Different nutritional profiles must remain distinguishable.
- **Units:** Confirm whether Stage 2 must accept values per 100 mL. The current nutrition requirements use grams. If 100 mL is supported, retain its basis and never silently convert it to grams without documented density and an approved conversion. Per-serving-only data and unverified conversions should not be presented as per-100-g values.
- **Data and retention:** Confirm required supplier/contact fields, permitted provenance details, decimal precision/ranges, and deletion behavior when records are linked. Proposed safe behavior is a clear conflict or explicit unlinking rather than silently deleting related data. Decide account-deletion retention separately.

These are proposed design decisions, not existing functionality or approved changes.

## Implementation sequence after the gates

### 1. Schema and access-control design

Draft versioned SQL migrations under `supabase/migrations/` and tests in an isolated development environment. Proposed records are `suppliers`, `supplier_products` and `ingredients`, with server-generated identifiers, ownership, timestamps and explicit source information. Final field names and relationships depend on the decisions above.

Enable row-level security and appropriate grants on all user-data tables. Enforce ownership for read, insert, update and delete, including checks against owner reassignment. Use database constraints and ownership-aware foreign keys so records cannot reference another owner's supplier or product even when the API is bypassed. Do not rely on a hidden button or a browser session as an authorization boundary.

Before applying any migration to the existing external NutritionMath project, obtain explicit approval for that project and verify the target reference. Prefer a disposable local or separately approved test environment for policy validation; the local test infrastructure is not yet installed. Never apply these changes to NutritionPro.

### 2. Authenticated server endpoints

Extend the existing Express application with bounded, authenticated ingredient, supplier and supplier-product list/detail/create/update/delete endpoints. Suggested locations are `server/routes/` for request handlers and `server/data/` for request-scoped data access; existing `server/app.ts` continues to compose the API. Route and file names are proposals, not currently implemented.

Verify each bearer token with the existing Supabase identity approach, then use a request-scoped Supabase client carrying that user's token and a public key so row-level security still applies. Do not use a service-role key, a shared mutable per-user client, a client-supplied owner or an unverified JWT. Validate identifiers, pagination, input lengths, allowed fields, units and nonnegative finite decimal values. Preserve decimal precision and reject unsupported precision rather than silently rounding. Return sanitized errors without logging credentials or private records.

### 3. Responsive ingredient and supplier screens

Add functional navigation and accessible lists, search, detail views, create/edit forms and deletion confirmations. Show units, nutrient basis, source and visibly unknown values. Make errors actionable, preserve unsaved edits where feasible, handle sign-out/account changes without showing a previous user's records, and test keyboard and common iPhone widths. Keep the existing black, white and yellow visual identity. No placeholder controls should imply unfinished features work.

### 4. Verification and security review

Run unit, integration and interface tests alongside the existing suite. Cover null versus zero, omitted versus cleared fields, decimal validation, source changes, incomplete records, supplier links, deletion conflicts, pagination, loading/errors, account switching and mobile interaction.

Mocks alone cannot prove database isolation. In a local or separately approved test environment, test direct database/data-API access as anonymous, owner A and owner B. For every operation test missing and invalid tokens, cross-owner reads and writes, forged owner identifiers, owner reassignment, cross-owner foreign keys and invalid direct writes. Verify the actual RLS policies and grants, not just Express responses. Use only synthetic test data and approved accounts.

Finish with `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`, applicable dependency audits, a security review and a changed-file report. Fix failures, commit completed work and wait for approval before Stage 3. Do not describe simulated or unrun tests as live successes.

## Picomatch advisory update

The previous authentication report accurately recorded the audit result at that time. On this review, the lockfile still has development dependency `picomatch@4.0.7`, but GitHub marks [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf) withdrawn, Snyk marks its related advisory revoked, and both local audits reported no known vulnerabilities. The NVD record was still marked awaiting enrichment and continued to describe the original report when checked. [3] [4] [5]

This is a change in advisory status, **not an installed package fix**. Continue to keep build/test tooling private and avoid feeding it untrusted glob patterns. Recheck the advisory sources and audits when dependencies or deployment architecture change.

## References

[1]: https://supabase.com/docs/guides/auth/auth-smtp "Supabase default mail and custom SMTP"
[2]: https://supabase.com/docs/guides/auth/password-security "Supabase password security"
[3]: https://github.com/advisories/GHSA-fc5q-39xc-vjpf "GitHub Picomatch advisory status"
[4]: https://security.snyk.io/vuln/SNYK-JS-PICOMATCH-21248802 "Snyk Picomatch advisory status"
[5]: https://nvd.nist.gov/vuln/detail/CVE-2026-112366 "NVD CVE record"
