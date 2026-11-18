# NutritionMath

NutritionMath is an independent Australian nutrition and food-production platform. This branch implements **Stage 1: foundation, authentication and dashboard**. Ingredients, recipes, calculations, labels and other later modules are not yet operational. See [ROADMAP.md](ROADMAP.md) for the staged plan and [STAGE-1-AUTH-VERIFICATION.md](STAGE-1-AUTH-VERIFICATION.md) for current authentication results and outstanding blockers.

## Technology

React, TypeScript and Vite on the client; Node.js and Express on the server; Supabase Authentication; Vitest and Supertest for tests. No Manus SDK, Manus OAuth, or Manus runtime is required. Future stages will use Supabase PostgreSQL and a shared independently tested nutrition calculation engine.

## Prerequisites

- Node.js 22.22.2 or later in the 22.x line (the development version is specified in `.nvmrc`; other supported versions are listed in `package.json`).
- pnpm 11.25.0, for example via Corepack.
- A **separate NutritionMath Supabase project** with email/password authentication. An independent Sydney project has been created with the owner's approval; see [SUPABASE-SETUP.md](SUPABASE-SETUP.md). Do not use the previous shared NutritionPro project. No project is automatically provisioned by this repository.

## Local development and configuration

1. Install dependencies: `pnpm install --frozen-lockfile`.
2. If `.env` does not already exist, copy `.env.example` to `.env`. The example contains blank Supabase values; don't overwrite an existing `.env` without preserving it first. The current development workspace has been configured locally with the approved independent project, but the ignored `.env` is not committed. For other checkouts, enter the independent project's values as described below. With no configuration, the app shows setup guidance instead of signing in.
3. From the independent project's dashboard, enter its project URL and a **publishable or legacy anon key** as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Use the same project URL as `SUPABASE_URL` and a publishable/anon key from the same project as `SUPABASE_ANON_KEY`. The key pairs may be the same or distinct public keys for the same project. Do not use a service-role or secret key. `.env` and `.env.*` other than `.env.example` are ignored by Git.
4. Configure and verify that independent project's email/password provider, confirmation policy, email delivery, Site URL and allowed redirects before live account testing. The client sends the current origin and pathname, excluding query and fragment. For a root-page visit at the normal Vite development address the callback is `http://localhost:5173/`; `127.0.0.1`, a different port, path or trailing-slash form is a different URL. Use the actual printed development address and exact approved production HTTPS address. Do not alter the former shared project. See the report for the compatible email-link flow and setup checklist.
5. Run `pnpm dev` and open the Vite URL printed in the console. The dev server proxies `/api` to Express at the configured `PORT` (default 3000). Vite loads mode-specific environment files; Express loads `.env` and process environment variables. Confirm that both resolve to the same independent project.
6. Run `pnpm check`, `pnpm test`, and `pnpm build` for type checks, automated tests and the production build. Use `pnpm start` to run the built Express server and frontend; `PORT` controls the listener.

The `VITE_` variables are embedded at **client build time** and visible to anyone using the website. Never put a secret key, service-role key, password, database connection string or other secret in any `VITE_` variable. The server variables are read at **runtime**; they require only a project URL and public key. The application does not need a database password, JWT signing secret or Supabase service-role key for Stage 1.

Before deploying, verify that the Vite build and the server runtime use the same independent project, then rebuild and replace all old client assets. Merely changing the server's runtime settings does not change an already-built browser bundle. A mismatch can allow browser sign-in while `/api/me` rejects that project's token. Confirm any deployed or cached older assets are retired; an already-running old app is not retroactively changed by a Git commit.

## Authentication and security

Previously, local development pointed at the **NutrientsMath** Supabase project, a shared authentication pool containing NutritionPro tables. A project-specific browser storage key did not isolate its remote users, passwords, policies or email configuration. The local workspace now points at the separate approved NutritionMath project in Sydney. No shared-project users, passwords, settings or data were changed during this switch. Existing accounts and sessions are not automatically migrated to the independent project.

Both the browser and server reject the former project's known direct hostname. This cannot detect a custom domain or proxy pointing to the same project, or prove that another URL is independent: verify project ownership and identity before configuring it. Vite also rejects known Supabase `sb_secret_` and `service_role` JWT formats in `VITE_` values; this is not a complete secret scanner.

The client uses the official Supabase JavaScript client and project-scoped browser storage. Browser storage and access tokens are exposed to JavaScript running on the same origin; protect against XSS, restrict third-party scripts and use HTTPS in production. The Express `/api/me` endpoint validates access tokens through Supabase rather than trusting client-supplied user IDs. Publishable/anon keys are not authorization; future tables need appropriately scoped row-level security and business access checks. The recovery marker is a user-interface safeguard, not server-side authorization, and is not shared across devices or other applications. Its cross-tab event ordering has an identified unresolved race; see the [verification report](STAGE-1-AUTH-VERIFICATION.md) before production use.

This application currently uses the SDK's **implicit email-link flow** and the current page URL as its callback. It does not implement a dedicated PKCE code exchange or token-hash verification route. Do not change email templates to a code-only or token-hash-only flow and assume it works; implement and test that flow first if required.

This stage is not a production deployment or a claim of food-labelling compliance. Stage 2 requires explicit approval.

## API

- `GET /api/health`: unauthenticated health status.
- `GET /api/me`: authenticated identity, requiring `Authorization: Bearer <Supabase access token>`; missing or invalid tokens fail closed.

<!-- Repository write-access verification: harmless README update. -->

## Known development-tool advisory

As of 19 November 2026, `pnpm audit` reports [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), a high-severity ReDoS issue in the transitive **development-only** `picomatch` dependency. The advisory lists no patched release. The application does not accept user-supplied glob patterns. Keep development/build tooling private and do not process untrusted glob inputs in trusted build jobs. `pnpm audit --prod` reported no known production dependency vulnerabilities at the time of this review. The [full report](INDEPENDENT-AUTH-REPORT.md) discusses limitations and remediation options. Audit results can change.
