# Independent Supabase setup

> This setup record predates the live account tests. For current results and remaining blockers, see [STAGE-1-AUTH-VERIFICATION.md](STAGE-1-AUTH-VERIFICATION.md).

## Project

With the owner's approval, an independent project named **NutritionMath** was created in the **Twominds** organization in Sydney (`ap-southeast-2`). Its project reference is `bcmtvcueiuvntuovizno` and its API URL is `https://bcmtvcueiuvntuovizno.supabase.co`. Supabase reported it `ACTIVE_HEALTHY`. The confirmed project quote was $0/month on the organization's Free plan; plan and usage limits apply.

This is a different project from the former shared **NutrientsMath** project used during initial Stage 1 work. No users, passwords, settings or data in the shared project were changed; no accounts or data were migrated. Stage 2 has not begun.

## Configured environment

The development workspace's Git-ignored `.env` contains the independent project's URL and an enabled **publishable** key in these four variables:

- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`: public frontend values embedded into the Vite build.
- `SUPABASE_URL` and `SUPABASE_ANON_KEY`: matching project URL and publishable key used by Express at runtime.
- `PORT=3000`: the local Express port.

The frontend and server URLs match, as do their public keys. The local file is owner-readable only and is not committed. The old local configuration remains in its ignored backup; do not use it for NutritionMath. No service-role key, Supabase secret key, database password or JWT secret is required for Stage 1.

A separate checkout or future deployment will **not** receive this ignored file automatically. Copy `.env.example` to `.env`, obtain the independent project's URL and enabled publishable key from its Supabase dashboard, and populate the four variables. For production, supply `VITE_` values when building and matching server values at runtime, then replace old built assets. Render has not been deployed or configured. Never put secret credentials in a `VITE_` variable.

## Checks completed

- The independent project's public auth settings endpoint returned HTTP 200. It reports email enabled, signup not disabled, and email autoconfirm off.
- The public schema currently reports no tables; the Supabase security advisor returned no notices. This is not a substitute for configuring and testing access controls when data features are added.
- `pnpm install --frozen-lockfile`, `pnpm check` and `pnpm build` passed. `pnpm test` passed **143 tests across 10 files**. `pnpm audit --prod` reported no known vulnerabilities.
- The rebuilt browser bundle contains the independent project's publishable key and not the former project's publishable key. The login screen loaded; an intentionally invalid sign-in was rejected without creating a user. The API health endpoint returned 200, and missing and invalid bearer tokens were rejected with 401.

## Still required for live authentication

The available Supabase tools did not expose the project's Site URL, redirect allowlist, email templates, SMTP settings or full password policy. These remain unverified and were not changed. Before testing with a user-controlled account:

1. In the **new** project, inspect its Authentication URL Configuration. Set or confirm the Site URL and allow the exact app callback URLs for each environment. The app uses the current origin and pathname, such as `http://localhost:5173/` for a local Vite root-page visit; a different hostname, port or path must be checked separately. The production URL is not yet known.
2. Verify email confirmation and recovery templates and delivery for the test inbox. Supabase's built-in mailer has recipient and rate limits; configure suitable SMTP before general production use. Preserve the supported implicit email-link flow; PKCE code-only or token-hash-only callbacks are not implemented by this app.
3. With an approved independent-project test account and inbox, test signup and email confirmation, resend, successful sign-in, password-reset delivery and redirect, password update, sign-out, and valid and invalid `/api/me` tokens. No live account has been created or modified during setup.

The [prior isolation review](INDEPENDENT-AUTH-REPORT.md) records the shared-project background, configuration details and Picomatch advisory. As of the last full audit it remains one high-severity development-only advisory with no published patched version; the production-only audit passed.
