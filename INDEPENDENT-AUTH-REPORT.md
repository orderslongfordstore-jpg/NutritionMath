# Independent NutritionMath authentication: configuration and readiness

**Status, 19 November 2026:** NutritionMath is prepared to be pointed at a dedicated Supabase project, but no such project has been created, selected or configured in this work. Live authentication is **not yet verified**. Stage 2 has not begun. Author: Manus AI.

## What currently shares infrastructure

At the start of this review, this workspace's ignored `.env` configured both the browser and Express server for Supabase project **NutrientsMath**, project reference `ndvjrsegapfhnhrjypck`, in `eu-west-1`. The browser and server used the same URL and the same publishable key. The project was reported active and healthy. The previously recorded Stage 1 decision was to use the authentication pool shared with NutritionPro; the current request replaces that decision.

The browser sent sign-in, sign-up, confirmation resend, password recovery, password update and local sign-out requests **directly to that project's Supabase Auth service**. The server used the same project to validate bearer tokens through `auth.getUser()` for `GET /api/me`. Thus, if NutritionPro also points at that project, both applications use the same remote user accounts, passwords, auth configuration, email settings and project-level limits. A password change for a shared account affects that account in every app that uses it. Local-scope sign-out is not a separate account pool.

NutritionMath already uses its own project-scoped browser-storage key. That reduces accidental same-origin browser-session collisions, but **does not separate the remote user database or authentication policies**. Any user signed into the configured project can currently reach the Stage 1 dashboard; there is no NutritionMath-specific membership or role check. The browser gate is not the security boundary for future APIs.

The shared project's public schema returned eight `nutritionpro_` tables, each reported as having row-level security enabled. The security advisor returned no notices. These metadata results are **not proof** that grants, policies or every access path are secure, and no user or table records were inspected. The NutritionPro application's deployed configuration was not inspected, so the exact endpoint used by its live deployment is not independently established by table names alone. NutritionMath's current code does not query or modify those tables or use a database connection. No existing shared-project settings, users, passwords or data were changed in this follow-up.

A read-only request to the shared project's public auth-settings endpoint returned `disable_signup: false`, email provider enabled, and `mailer_autoconfirm: false`. It did not expose the configured Site URL, redirect allowlist, email templates, SMTP settings, detailed password policy, users or deployed application configuration. Those items remain **unverified**; do not change them in the shared project.

## What has been prepared locally

The former shared values were removed from the active local `.env`. They were preserved in the Git-ignored, owner-readable local backup `.env.shared-backup-20261118T131505Z`; do not copy this backup into the independent configuration. `.env.example` now contains blank values, so a fresh setup is not connected to any Supabase project by default. Blank settings cause the application to show setup guidance and its protected API to fail closed.

Both client and server now reject the previously used **direct** Supabase hostname, including common case, port and trailing-dot variants. This prevents that known address from being accidentally reconfigured. It does not identify custom-domain aliases or proxies and cannot prove that a different-looking URL belongs to an independent project; the owner must verify the project reference and provenance. A Vite configuration check also rejects known `sb_secret_` and legacy `service_role` JWT formats in browser-visible `VITE_` variables. The check runs before Vite's environment debug logging, and a regression test checks that a detected synthetic secret is not printed. It is a precaution, not a complete secret scanner, and cannot detect every kind of secret.

The client build embeds its Vite values. Any browser build made before the disconnect can therefore continue using the previous project even after the server variables change. Rebuild from the independent settings and replace any old deployed/cached assets. A new URL also produces new app-specific session-storage keys; existing sessions and accounts are not migrated, deleted or revoked automatically. Any account or data migration requires a separate, explicitly approved plan.

The app is designed for a project URL and public API key. It does not contain a privileged Supabase key, apply migrations or use a Manus runtime. Public URL/key values are not authorization: the dedicated project still needs suitable authentication and, for future data features, carefully designed grants, row-level security and ownership controls. [1]

## Environment variables for the independent project

Use `.env.example` as the starting point. Obtain both URL and public key from the **approved independent** project's settings. The variable names below are the ones the existing code actually reads:

```dotenv
# Browser: Vite embeds these public values at build time
VITE_SUPABASE_URL=https://<independent-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<independent-publishable-or-legacy-anon-key>

# Express: read at server runtime
SUPABASE_URL=https://<independent-project-ref>.supabase.co
SUPABASE_ANON_KEY=<independent-publishable-or-legacy-anon-key>

# Optional: defaults to 3000
PORT=3000
```

The browser and server URLs must identify the **same independent project**; each key must be an enabled publishable or legacy anon key belonging to that project. The public keys do not have to be identical. A mismatch can make the browser appear to sign in while `/api/me` cannot validate its token. Verify the configuration in every environment; Vite mode-specific `.env` files can override values differently from the server's `.env` plus process environment. Rebuild the client after changes to `VITE_` settings, then start the corresponding server with matching runtime values.

Never place an `sb_secret_` key, legacy `service_role` key, database password, JWT signing secret or any other secret in a `VITE_` variable, client bundle, committed file or log. Those variables are public in the browser. Stage 1 does not require a service-role/secret key, database URL, database password or JWT signing secret. [1]

## Required decisions and configuration before live testing

1. **Approve the project and environment.** Decide which organization owns a new, fully separate NutritionMath Supabase project, its region and plan, and who administers it. Creation or configuration requires your explicit approval. Ideally use separate dedicated development and production projects. Do not repurpose the former shared project or assume the other inactive project is safe to use. Record the independent project's actual reference, URL and enabled public key; verify that it is not an alias or proxy to the shared project. No account migration is implied. [2]
2. **Choose the app addresses.** Establish the actual local Vite URL, final production HTTPS origin and root path. The app constructs its email callback as the current page's `origin + pathname`, with query and fragment removed; it does **not** use a dedicated `/auth/callback` or `/reset-password` route. For example, a root-page local visit at the normal Vite address produces `http://localhost:5173/`, while production may be `https://your-domain.example/`. These are examples, not confirmed deployed addresses. A different port, scheme, hostname, path or trailing slash must be checked separately.
3. **Configure URLs in the independent project only.** In Supabase Authentication URL Configuration, set the Site URL to that environment's canonical app URL and allow the exact callback destinations used for signup, confirmation resend and recovery. The Site URL is a fallback; confirm that the app's per-request redirect is permitted. Vite can choose a different port if its usual one is busy, so check the actual printed URL. Prefer exact HTTPS production entries rather than broad wildcard redirects. Do not change the former shared project's URL settings. [3]
4. **Choose and enable email/password authentication.** Enable the email provider and decide whether new registrations are allowed and confirmation is required. This app handles the confirmation-required case, where sign-up may return no session; it also supports confirmation resend. Set and document the independent project's password policy. The interface checks a six-character minimum, but the server may enforce stricter policy, which should be tested. If CAPTCHA, SSO, MFA or another additional auth step is required, it must first be implemented and tested; this Stage 1 UI does not provide those integrations. [4] [5]
5. **Configure email and compatible templates.** Arrange delivery to the test address and verify sender/domain settings. Supabase's built-in mail service is limited to organization team addresses and is rate-limited; custom SMTP and appropriate sender-domain DNS are needed for general external recipients and production use. Check current provider quotas and costs. Preserve a compatible verification link, such as the default `{{ .ConfirmationURL }}`, and ensure templates honour the intended redirect. The present browser client uses Supabase's implicit email-link flow. It does not implement a PKCE code-exchange callback or token-hash verification endpoint; do not substitute those link formats without additional code and tests. [6] [7] [8]
6. **Review recovery and limits.** Check recovery-link expiry, password policy, auth rate limits and email-provider throttles in the independent project. Confirm that reset links land on the actual app URL and that the app displays its new-password screen. Account for email security scanners and link tracking, which can consume or rewrite single-use links. Plan an approved test account and a user-controlled inbox; do not use or change a NutritionPro account. [5] [6] [9]
7. **Set both environments and build afresh.** Configure the four Supabase variables above for the independent project, in the browser **build** and server **runtime** respectively. Confirm the source bundle is rebuilt with those values and that any old running or cached bundles no longer contact the shared project. The independent project must reject tokens from other projects. No public deployment has been made in this work.
8. **Run approved end-to-end verification against the independent project only.** Check signup and confirmation, confirmation resend, sign-in, a valid-token `/api/me` response, invalid/foreign-token rejection, sign-out, password-reset delivery, reset-link redirect, new-password update and sign-in with the new password. Exercise expired/reused/malformed links, relevant error and rate-limit states, and two-tab recovery behavior. These operations create or change test identities, so use a dedicated test account and obtain approval for the project and testing. Record results; mocked tests cannot prove email delivery or live configuration. [10]

## Picomatch advisory and remediation

The current lockfile contains `picomatch@4.0.7` in the Vite/Vitest development and build/test dependency tree. `pnpm audit` reports one high-severity [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), also identified as CVE-2026-112366. The advisory lists versions through 4.0.7 as affected and no patched release; the npm registry lists 4.0.7 as the latest at review time. Earlier fixes for different Picomatch advisories should not be mistaken for a fix for this one. [11] [12]

The issue concerns pathological regular-expression backtracking when certain repeated-extglob patterns are matched against adversarial near-miss strings. The current app has no user-supplied glob interface, and no reachable application attack path was established. The dependency is not present in the current production dependency graph; `pnpm audit --prod` reported no known vulnerabilities. This does not guarantee that a different deployment or future code has no exposure. [11] [13]

Until an advisory-confirmed fix is available, keep Vite, test runners and CI/build tooling private and avoid untrusted glob patterns and untrusted build inputs. Restricting pattern length alone is not a reliable fix. Disabling extglobs for direct uses can reduce this specific risk but changes matching behavior and is **not** a verified global mitigation for Vite or Vitest. If untrusted matching is unavoidable, use a tightly restricted grammar and a separately terminable process with external resource/time limits. A version-specific patch or maintained fork is a risk-accepted option only after security review, pinned provenance and compatibility/adversarial regression testing; open upstream proposals do not establish an official fix, and a scanner may still report the original package version. Do not downgrade, blindly override or suppress the advisory and call it resolved. [13] [14] [15]

When an advisory-confirmed compatible release exists, review and update the dependency tree and lockfile, run `pnpm install --frozen-lockfile`, `pnpm audit`, `pnpm audit --prod`, `pnpm check`, `pnpm test` and `pnpm build`, and inspect the resulting changes. If the fix is outside the parent packages' compatible ranges, update those parents or review an override rather than forcing an untested major version.

## Verification and scope

The starting commit was `d92146a` on `stage-1-foundation`. After the changes, `pnpm install --frozen-lockfile`, `pnpm check` and `pnpm build` all passed. `pnpm test` passed **143 tests in 10 files**, including all 92 existing tests and 51 additional guard tests. The full audit reported one high-severity development advisory; `pnpm audit --prod` reported none. The rebuilt client bundle was checked and did not contain the former project's publishable key.

With the Supabase values blank, a local production-build smoke test showed the setup screen, returned 200 from `/api/health` and returned 503 from `/api/me` rather than attempting authentication. A separate offline test of the former hostname returned 503 without making a Supabase request. The guard tests use mocked or synthetic inputs, not real login attempts. The independent-project end-to-end steps above have not been run. No Supabase project has been created or modified; no shared-project user, password, authentication setting or application data has been changed.

Changed files in this follow-up are `.env.example`, `README.md`, `ROADMAP.md`, `STAGE-1-REPORT.md`, `TODO.md`, `plan.md`, `INDEPENDENT-AUTH-REPORT.md`, `package.json`, `pnpm-lock.yaml`, `server/app.ts`, `server/app.test.ts`, `server/supabaseProject.ts`, `server/supabaseProject.test.ts`, `src/auth/AuthPage.tsx`, `src/auth/AuthPage.test.tsx`, `src/auth/AuthProvider.tsx`, `src/auth/SupabaseProjectGuard.test.tsx`, `vite.config.ts` and `vite.config.test.ts`. The `dotenv-expand` development dependency supports checking Vite-style environment expansion before logging. The ignored local `.env` was disconnected and its previous values backed up; neither file is committed.

## References

[1]: https://supabase.com/docs/guides/getting-started/api-keys "Supabase API keys"
[2]: https://supabase.com/docs/guides/deployment/managing-environments "Managing Supabase environments"
[3]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase redirect URLs"
[4]: https://supabase.com/docs/guides/auth/passwords "Password-based authentication"
[5]: https://supabase.com/docs/guides/auth/password-security "Password security and policies"
[6]: https://supabase.com/docs/guides/auth/auth-smtp "Custom SMTP and built-in email limitations"
[7]: https://supabase.com/docs/guides/auth/auth-email-templates "Supabase email templates"
[8]: https://supabase.com/docs/guides/auth/sessions/pkce-flow "Supabase PKCE flow"
[9]: https://supabase.com/docs/guides/auth/rate-limits "Supabase Auth rate limits"
[10]: https://supabase.com/docs/guides/auth/testing-auth-flows "Testing authentication flows"
[11]: https://github.com/advisories/GHSA-fc5q-39xc-vjpf "Picomatch security advisory"
[12]: https://registry.npmjs.org/picomatch/latest "Current Picomatch release on npm"
[13]: https://www.vulncheck.com/advisories/picomatch-through-4.0.7-redos-via-single-branch-repeated-extglob-patterns "Picomatch repeated-extglob ReDoS"
[14]: https://github.com/micromatch/picomatch/pull/270 "Upstream repeated-extglob mitigation discussion"
[15]: https://pnpm.io/11.x/cli/patch "pnpm dependency patch documentation"
