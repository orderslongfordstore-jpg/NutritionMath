# NutritionMath Stage 2 preparation

**Status:** planning only; Stage 2 implementation has not started and is not approved by this document. Stage 1 authentication remains incomplete. This plan assumes the staged approach in [ROADMAP.md](ROADMAP.md) and must be reviewed after the Stage 1 gate and before development begins.

**Prepared:** 19 November 2026, Australia/Sydney. **Author:** Manus AI. The owner's decision that records are shared across a business team was added on the same date.

## Current starting point

The working branch is `stage-1-foundation`, based on `3b9f3af` before this planning document. The repository contains the React/Vite dashboard and authentication, an Express health endpoint and authenticated `/api/me`, but no ingredient, supplier or supplier-product CRUD, schemas or ownership policies. The separate NutritionMath Supabase project was reported healthy; a read-only metadata check returned no public tables. These facts do not prove future data isolation.

On this review, `pnpm check`, `pnpm test` and `pnpm build` passed; **168 tests passed across 12 files**. Both `pnpm audit --prod --audit-level low` and the full `pnpm audit --audit-level low` reported no known vulnerabilities. No dependencies were changed. Local Docker, Supabase and PostgreSQL CLIs were not available; a safe way to run real database-policy tests must be agreed before relying on a local database. No Supabase tables, settings, users or data were changed for this planning work.

## Stage 1 gate before implementation

1. **Complete password recovery.** The previous reset email arrived, but its link returned `otp_expired` on first observed use. The cause is unknown. Investigate the delivery and Auth logs without exposing link contents; when the mailer permits, use a new link for the already approved dedicated test account, update its password and verify sign-out plus login with the new password. The temporary password used for the previous test was removed locally. Test confirmation resend if it will be offered at release. See [STAGE-1-AUTH-VERIFICATION.md](STAGE-1-AUTH-VERIFICATION.md).
2. **Resolve the cross-tab authentication risk.** The existing recovery/sign-out marker and stale-event ordering have an identified race. Implement a narrowly reviewed fix with automated adverse-order tests and real two-tab/browser lifecycle checks. Do not assume the expiry UI guard establishes server-side authorization or revocation.
3. **Review operational requirements before any deployment.** Select and verify the exact app origins and recovery/confirmation redirects; review password policy and appropriate email delivery; verify matching independent-project build and runtime settings and retire obsolete assets. The default mailer is restricted and rate-limited. Leaked-password protection is disabled and the provider documents it as a paid-plan feature; do not upgrade or enable paid services without explicit approval. [1] [2]
4. **Obtain Stage 1 sign-off and explicit Stage 2 approval.** Any change to an external Supabase project's schema or settings also requires explicit approval for that target. Do not use or modify the separate NutritionPro project. A Stage 2 feature merge or deployment must additionally pass the data-isolation tests below.

## Proposed Stage 2 scope

Provide real, authenticated ingredient and supplier management with an iPhone-friendly interface. **Confirmed requirement:** ingredient, supplier and supplier-product records belong to a business workspace and are shared with its authorized team members, not isolated to the individual who created them. Records from different businesses must remain separate. Authorized team members must be able to search and view their workspace's records and, according to agreed permissions, create, edit and delete them. Include meaningful empty, loading, error and confirmation states. Existing dashboard and authentication flows remain functional; unfinished modules must not appear operational.

Stage 2 must include a real, secure way to establish a business workspace and add and remove authorized team members; otherwise team sharing would not be genuinely usable. The exact joining, invitation delivery and role-management experience remain to be agreed before implementation. Avoid relying on direct database edits or showing a nonfunctional invite control as the finished workflow. Advanced organization-wide user and permission administration can remain a later module.

Store each nutrient as an independently nullable value: energy in **kJ**, protein, total fat, saturated fat, carbohydrate, sugars and dietary fibre in **g**, and sodium in **mg**. The default source basis is **per 100 g edible portion**. A missing value is `NULL` and must display as unknown; an explicit zero is a known value. Editing an unrelated field must preserve unknowns. An omitted update field means unchanged; an explicit `null` clears it. No recipe calculations or regulatory compliance claims are part of Stage 2.

Capture clear provenance: source name or supplier, product identifier where available, reference, source version/date and explanatory notes, including the carbohydrate method when known. Supplier-specific formulations should not silently inherit a different product's nutrient profile. Pack information may be stored without adding costing calculations.

The project-shared FSANZ document describes the NPC 2026 dataset but is **not** the food-level dataset. It describes seven nutrients per 100 g edible portion, with energy and available-carbohydrate conventions that differ from AFCD/AUSNUT; dietary fibre is not among those seven. Verify the actual companion files, their conditions and attribution before any use. Bulk import/export is Stage 8 and is not included here.

**Out of scope:** recipe calculation and scaling, production batches, NIP generation, label PDFs, cost/profit calculations, bulk import/export, advanced team administration, and production deployment. These remain later stages unless the owner explicitly changes the scope. The minimal secure workspace membership needed for actual team sharing is in scope.

## Decisions to confirm before database design

- **Confirmed ownership:** Records are shared across authorized members of the same business team and isolated between businesses. The exact permissions for members, managers and owners are not yet confirmed; in particular, decide who can edit/delete records and invite or remove members.
- **Team onboarding:** Decide how a workspace is created and members securely join it, who may authorize or revoke access, and how invitations or join requests are delivered and accepted. The current default Supabase mailer is limited to organization members and is rate-limited, so it cannot be assumed to deliver external team invitations. Any custom SMTP or paid option requires separate approval. Record how existing test accounts enter a workspace without automatically granting access based solely on an email address or a caller-supplied workspace ID.
- **Supplier-product model:** Confirm whether each source-specific formulation should be a distinct ingredient linked to one supplier product, or whether a single ingredient needs multiple distinct supplier formulations. Different nutritional profiles must remain distinguishable.
- **Units:** Confirm whether Stage 2 must accept values per 100 mL. The current nutrition requirements use grams. If 100 mL is supported, retain its basis and never silently convert it to grams without documented density and an approved conversion. Per-serving-only data and unverified conversions should not be presented as per-100-g values.
- **Data and retention:** Confirm required supplier/contact fields, permitted provenance details, decimal precision/ranges, and deletion behavior when records are linked. Proposed safe behavior is a clear conflict or explicit unlinking rather than silently deleting related data. Decide account-deletion retention separately.

Team sharing is the owner's confirmed requirement. The implementation choices above are still open; they are not existing functionality, approval to start Stage 2, or approval to change an external Supabase project.

One proposed invitation approach is a workspace- and role-specific, expiring, revocable, single-use invitation bound to a verified account or confirmed email. Acceptance would require an authenticated, explicit action; a link preview or security scanner must not add a member merely by opening a URL. Store invitation secrets safely and never log them. The delivery channel, exact roles and acceptance flow require agreement and testing; this is a proposal, not a claim that invitations already work.

## Implementation sequence after the gates

### 1. Schema and access-control design

Draft versioned SQL migrations under `supabase/migrations/` and tests in an isolated development environment. Proposed records are `workspaces`, `workspace_members`, `suppliers`, `supplier_products` and `ingredients`, with server-generated identifiers, workspace ownership, timestamps and explicit source information. A controlled invitation or membership-approval model is needed as well; its exact design depends on the decisions above. Support authenticated users who are members of different workspaces without allowing the selected workspace alone to confer access.

Enable row-level security and appropriate grants on all user-data tables. Enforce current, active workspace membership and agreed roles for every read, insert, update and delete, including direct data-API calls. Do not allow users to self-enroll, elevate their role, transfer a record to another business, or change membership by forging a workspace ID. Protect the last authorized owner from accidental removal, including concurrent changes and account offboarding. Use database constraints and workspace-aware foreign keys so records cannot reference another business's supplier or product even when Express is bypassed. Scope membership visibility and administration to authorized users. Do not rely on a hidden button, cached role claim or browser session as an authorization boundary. If narrowly privileged database helpers are needed, restrict execution and search paths and verify that they cannot bypass membership checks.

Before applying any migration to the existing external NutritionMath project, obtain explicit approval for that project and verify the target reference. Prefer a disposable local or separately approved test environment for policy validation; the local test infrastructure is not yet installed. Never apply these changes to NutritionPro.

### 2. Authenticated server endpoints

Extend the existing Express application with bounded, authenticated ingredient, supplier and supplier-product list/detail/create/update/delete endpoints and the minimal secure workspace-membership flow selected above. Suggested locations are `server/routes/` for request handlers and `server/data/` for request-scoped data access; existing `server/app.ts` continues to compose the API. Route and file names are proposals, not currently implemented.

Verify each bearer token with the existing Supabase identity approach, then use a request-scoped Supabase client carrying that user's token and a public key so row-level security still applies. A requested workspace identifier may select a workspace, but must never be treated as proof of membership or permission. Do not use a service-role key, a shared mutable per-user client, a client-supplied owner or an unverified JWT. Validate identifiers, pagination, input lengths, allowed fields, units and nonnegative finite decimal values. Preserve decimal precision and reject unsupported precision rather than silently rounding. Return sanitized errors without logging credentials or private records.

### 3. Responsive ingredient and supplier screens

Add functional workspace navigation and accessible lists, search, detail views, create/edit forms and deletion confirmations. Provide the agreed, working member-joining and access-removal workflow rather than a placeholder. Show units, nutrient basis, source and visibly unknown values. Make errors actionable, preserve unsaved edits where feasible, handle workspace changes and sign-out/account changes without showing another business's records, and test keyboard and common iPhone widths. Keep the existing black, white and yellow visual identity. No placeholder controls should imply unfinished features work.

### 4. Verification and security review

Run unit, integration and interface tests alongside the existing suite. Cover null versus zero, omitted versus cleared fields, decimal validation, source changes, incomplete records, supplier links, deletion conflicts, pagination, loading/errors, workspace/account switching, actual team onboarding and removal, and mobile interaction.

Mocks alone cannot prove database isolation. In a local or separately approved test environment, test direct database/data-API access as an anonymous user, multiple members of business A, a member of business B, a nonmember and a removed or disabled member. Verify that authorized colleagues see the same records while each other business is denied. Test all operations for missing and invalid tokens, forged workspace identifiers, self-enrollment, role escalation, revoked or downgraded access on subsequent requests even with an unexpired token, cross-workspace reassignment and foreign keys, and invalid direct writes. An already-running transaction may have a different boundary and must be tested separately. Test invitation identity matching, explicit acceptance, expiration, replay, cancellation and concurrent acceptance, and protect against removing the last owner. Verify the actual RLS policies and grants, not just Express responses. Use only synthetic test data and approved accounts.

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
