# NutritionMath

NutritionMath is an independent Australian nutrition and food-production platform. This branch implements **Stage 1: foundation, authentication and dashboard**. Ingredients, recipes, calculations, labels and other modules shown as planned are not yet operational. See [ROADMAP.md](ROADMAP.md) for the staged development plan.

## Technology

React, TypeScript and Vite on the client; Node.js and Express on the server; Supabase Authentication; Vitest and Supertest for tests. No Manus SDK, Manus OAuth, or Manus runtime is required. Future stages will use Supabase PostgreSQL and a shared independently tested nutrition calculation engine.

## Prerequisites

- Node.js 22.22.2 or later in the 22.x line (the development version is specified in `.nvmrc`; other supported versions are listed in `package.json`).
- pnpm 11.25.0, for example via Corepack.
- A Supabase project with email/password authentication enabled. If email confirmations are enabled, users must confirm their email before signing in.

## Local development

1. Install dependencies: `pnpm install --frozen-lockfile`.
2. Copy `.env.example` to `.env`. Fill in the Supabase project URL and **publishable or legacy anon key** in both the `VITE_` client variables and the server variables. The `VITE_` values are embedded into the browser build; never put a service-role key, secret key, password or database connection string there. `.env` is ignored by Git.
3. Verify the existing Supabase Auth redirect allowlist and email settings before testing confirmation or recovery. The client sends the current page URL without its query or fragment as the callback (for example, `http://localhost:5173/` for a local root-page visit). Supabase may otherwise fall back to its configured Site URL. The currently approved Supabase project is shared: **do not change its authentication settings without separate approval**, because changes can affect other applications. If the required callback is not already allowed, obtain approval first or use a separate project.
4. Run `pnpm dev`. Open the Vite URL printed in the console (normally `http://localhost:5173`). The dev server proxies `/api` to Express on port 3000.
5. Run `pnpm check`, `pnpm test`, and `pnpm build` for the type check, automated tests and production build. Use `pnpm start` to run the built Express server and frontend; `PORT` controls the listener.

## Shared authentication and security

The user approved the existing **NutrientsMath** Supabase project as the authentication provider. Its auth pool is shared with other applications, including NutritionPro: account creation, password resets, password changes and sign-out can affect those shared identities. This repository neither reads nor changes NutritionPro tables. No database migration or authentication setting is applied by this stage.

Supabase sessions are managed by the official browser client using a NutritionMath-specific, project-scoped storage key, so this app does not intentionally share a same-origin session with other apps. Sessions created under an earlier key are not migrated; sign in again if needed. Browser storage and access tokens are exposed to JavaScript running on the same origin, so protect against XSS, restrict third-party scripts, use HTTPS in production, and apply appropriate access controls and row-level security when data features are added. The Express `/api/me` endpoint validates access tokens through Supabase rather than trusting client-supplied user IDs. Supabase publishable/anon keys are not authorization; future tables need correctly scoped RLS.

Production environment variables must be set both **when building the Vite client** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) and **at server runtime** (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). Use separate development and production Supabase projects where practical. Before public release, verify approved redirect URLs, email delivery, application URL, rate limits, account policies and deployment security. Any change to the shared Supabase project settings requires separate approval. The password-recovery marker coordinates this app across browser tabs as a user-interface safeguard, not as server-side authorization, and is not shared across devices or applications. This stage is not a production deployment or a claim of food-labelling compliance.

## API

- `GET /api/health`: unauthenticated health status.
- `GET /api/me`: authenticated identity, requiring `Authorization: Bearer <Supabase access token>`; invalid or missing tokens fail closed.

<!-- Repository write-access verification: harmless README update. -->

## Known development-tool advisory

As of 18 November 2026, `pnpm audit` reports [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), a high-severity ReDoS issue in the transitive **development-only** `picomatch` dependency. The advisory lists no patched release. The application does not accept user-supplied glob patterns; do not expose development tooling to untrusted users, and update this dependency when an upstream fix becomes available. `pnpm audit --prod` reported no known vulnerabilities at the time of this review. Audit results can change.
