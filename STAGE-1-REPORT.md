# Stage 1 inspection and verification report

## Existing repository

The existing public GitHub repository is `orderslongfordstore-jpg/NutritionMath`. The working branch was `stage-1-foundation` at `7b90e163ff9e0e0ec1396b7f46e9358b8a7b427c` before this work. The authenticated account had repository admin and push permission. The repository was cloned rather than recreated; its history was preserved. The separate NutritionPro repository was not changed.

At inspection, this branch contained only `README.md`, `.gitignore` and `package.json`. There were no application source files, TypeScript or Vite configuration, lockfile, test files or build output. The manifest specified React, React DOM, TypeScript, Vite, Node/Express, `@supabase/supabase-js`, dotenv, Vitest, Supertest, tsx and concurrently. It contained scripts for development, checks, tests, build and start, but their referenced implementation did not exist.

An initial `npm install` completed successfully. Initial type checking failed because there was no TypeScript configuration, tests failed because there were no test files, and the build failed because `index.html` did not exist. Initial audit reported nine dependency vulnerabilities, including two critical findings in the development-tool chain.

## Stage 1 implementation

The branch now contains a responsive React/Vite client, NutritionMath branding, Supabase email/password authentication screens, a protected dashboard, Node/Express API, configuration examples and automated tests. Sign-in, sign-up, password-reset request, recovery-password update and local-session sign-out are implemented using the official Supabase client. Later modules are labelled as planned rather than presented as operational. The backend serves a public health endpoint and an identity endpoint that validates bearer tokens with Supabase. It serves the production frontend and fails closed for missing or invalid authentication. No Manus SDK, OAuth or runtime dependency is used.

The user confirmed the existing **NutrientsMath** Supabase project and approved sharing its authentication pool. The project also has existing NutritionPro tables. No Supabase table, authentication setting or existing user was modified during this work. Accounts and password changes in the shared authentication pool may affect other applications. The local sign-out is scoped to the current session rather than globally revoking other sessions, and NutritionMath uses its own project-scoped browser session storage. Existing sessions stored under an earlier key will need a fresh sign-in.

## Verification performed

- `pnpm install --frozen-lockfile`: passed using Node 22.23.4 and pnpm 11.25.0.
- `pnpm check`: passed for both client and server TypeScript configurations.
- `pnpm test`: 92 tests passed across eight test files. These use mocked Supabase responses and cover the application gate, auth forms and state, dashboard interaction, API authorization, callback errors, recovery/session races, cross-tab recovery, development proxy settings, failure handling and production static serving.
- `pnpm build`: passed for the Vite client and TypeScript server.
- Production smoke checks: `/api/health` returned 200; `/api/me` without a token and with an invalid token returned 401; the frontend returned 200; an unknown API route returned 404. The invalid-token check used the real Supabase verification service.
- The actual login screen was opened in a browser. A deliberately invalid login was rejected with a generic error, without creating a test account. An expired-link callback was also checked in the real browser build and showed a retry notice. Authentication form modes were checked at 320, 375, 390 and 430 px with no horizontal overflow; the dashboard was also checked at those widths using a test-only preview. Its mobile navigation and Escape/focus behavior were checked.
- `pnpm audit --prod`: no known production dependency vulnerabilities at review time. The Supabase security advisor returned no notices. The full dependency audit reported one high-severity, development-only `picomatch` advisory, [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), for which no patched release was listed at review time. Do not expose development tooling or accept untrusted glob patterns; update when a fix is available.
- Checked that `.env` is ignored and that the application dependency list and runtime imports contain no Manus packages. Only a Supabase publishable key was used for local configuration; no service-role key was added.

## Remaining verification and release limitations

The automated account-flow tests use mocks. A successful live sign-in, new-account confirmation, password-reset email delivery, reset-link redirect and password change have **not** been end-to-end tested against a real account. These require a user-controlled account and correctly configured Supabase email delivery and allowed redirect URLs; any changes to shared Supabase authentication settings require separate approval; no test account was created in the shared pool. The app is not deployed on Render, and its final production origin and settings have not been configured. Stage 1 is implemented but these live authentication checks remain open before treating the stage as fully verified.

No nutrition calculation, database or labelling feature is delivered in this stage. Australian regulatory verification and stages 2–10 are future work. Approval is required before starting Stage 2.

## Changed files

- Foundation and documentation: `.gitignore`, `.env.example`, `.nvmrc`, `README.md`, `ROADMAP.md`, `TODO.md`, `plan.md`, `STAGE-1-REPORT.md`.
- Tooling and configuration: `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `tsconfig.json`, `tsconfig.server.json`, `vite.config.ts`, `vite.config.test.ts`, `index.html`.
- Brand asset: `public/favicon.svg`.
- Frontend and tests: `src/main.tsx`, `src/index.css`, `src/App.tsx`, `src/App.test.tsx`, `src/auth/AuthProvider.tsx`, `src/auth/AuthProvider.test.tsx`, `src/auth/AuthPage.tsx`, `src/auth/AuthPage.test.tsx`, `src/auth/AuthFlow.test.tsx`, `src/auth/AuthRegressions.test.tsx`, `src/auth/auth.css`, `src/components/Dashboard.tsx`, `src/components/Dashboard.test.tsx`, `src/components/dashboard.css`.
- Server and tests: `server/app.ts`, `server/index.ts`, `server/app.test.ts`.
