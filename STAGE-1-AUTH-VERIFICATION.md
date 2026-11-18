# Stage 1 authentication verification

> The authentication results below remain the last live verification. A later review found that the previously cited Picomatch advisory was withdrawn and both dependency audits returned no known vulnerabilities; see [STAGE-2-PREPARATION.md](STAGE-2-PREPARATION.md). This does not change the outstanding authentication blockers.

**Status: not complete.** The independent NutritionMath project was used to create and confirm a dedicated test account, sign in and out, and validate a real authenticated API request. A password-reset email arrived, but its one-time link returned `otp_expired` at its first observed use, so a password update and login with a changed password are **not verified**. Do not begin Stage 2. This report records work on 19 November 2026 (Australia/Sydney).

See [STAGE-1-AUTH-RESOLUTION-PLAN.md](STAGE-1-AUTH-RESOLUTION-PLAN.md) for the proposed investigation, fixes and acceptance checks; the plan does not claim that these issues are resolved.

## Independent project and scope

- Twominds' **NutritionMath** project is separate from the previously shared NutrientsMath/NutritionPro project. Local `VITE_SUPABASE_URL` and `SUPABASE_URL` resolve to the new project; the frontend and backend use matching public keys from that project.
- A source/bundle scan did not find the old project's public key, a legacy service-role JWT, or a secret-key-shaped string in the current frontend. The literal secret-key prefix appears in a defensive guard, not as a complete key. This targeted scan is not proof that all possible secrets are absent.
- The active `.env` is Git-ignored and is not tracked. The old, ignored local backup was not used for authentication. The app does not configure a direct PostgreSQL connection in Stage 1. No NutritionPro user, password, data or settings were modified, and no paid service was enabled.
- The independent test account is the only account created for this work. Its randomly generated password and verification URLs are not committed or included in this report. Do not use production accounts for further tests.

## Supabase configuration inspected

- The Email provider and new signups are enabled. **Confirm email** is enabled, so a new user must confirm before first sign-in.
- The Site URL is `http://localhost:3000`; no additional Redirect URLs are listed in the dashboard. The application requests the current origin and pathname for both signup and recovery. A real signup confirmation reached the root page at `http://localhost:3000/`. No valid recovery callback has yet been demonstrated. A diagnostic invalid-link probe reflected `localhost:5173`; because it was not a valid confirmation or recovery, this does not prove that the complete flow works there.
- Supabase's default confirmation and reset email templates were present. Custom SMTP is disabled. The default mailer is restricted to organization team members and the dashboard currently shows **two emails per hour**. The approved test address was verified as a Twominds owner and was eligible. For external customers or production, plan a suitable custom SMTP provider and sender configuration, with separate cost/approval review. [1]
- Access tokens are configured for **3,600 seconds**; the refresh-token reuse interval is 10 seconds. No session settings or redirect settings were modified. The final production HTTPS URL is not yet determined. Before deployment, add the exact approved production callback URL and verify the complete confirmation and recovery flows there. If another development origin is used, verify and explicitly allow its exact callback rather than relying on the invalid-link probe. [2]

## Actual live tests

1. The independent project's auth-user count was zero before testing. Registration of the approved dedicated account succeeded; an email confirmation was received through the authorized Gmail account. Before confirmation, the account was unconfirmed and the browser showed the sign-in screen rather than an authenticated dashboard.
2. The signup link was accepted and redirected to `http://localhost:3000/`. The dashboard was displayed after confirmation. Live sign-out returned to the sign-in screen and removed the local SDK session; password sign-in displayed the dashboard again.
3. A valid access token from this session returned **HTTP 200** from `GET /api/me` with an authenticated user ID. Missing and deliberately invalid bearer tokens returned **HTTP 401**. Tokens and user identifiers were not logged in this report. Existing access tokens may have their own expiry/revocation behavior; local sign-out alone does not prove immediate global revocation.
4. A password-reset request returned a reset email to the authorized inbox. Its link targeted the independent project's verification endpoint and requested `http://localhost:3000/`, but the first observed visit returned `otp_expired` about 19 seconds after the email request. The cause is **not established**. The password was not changed and a new-password login was not tested. Check delivery/link handling and Supabase Auth logs, then request one fresh link after the mailer rate limit permits; do not assume a specific scanner, template or configuration caused it.
5. Reusing the invalid link showed the application's expired/invalid-link warning and an action to request another link, without showing the dashboard. Resend-confirmation behavior was not tested live.

## Expired sessions and security review

The original application could keep showing a dashboard when a previously valid session expired during a retryable refresh outage without an SDK sign-out event. The local expiry safeguard hides the dashboard when the SDK's expiry timestamp is missing, non-finite or elapsed, rechecks on foreground events, and lets a later valid session restore the UI. Tests use a mocked SDK and the installed Supabase SDK with synthetic sessions and blocked/mock network requests; **they do not constitute a live one-hour session-expiry test**. This is a device-clock-based UI measure, not token verification, revocation or server-side authorization. Timers can be delayed while a browser is suspended, and changes to the device clock affect it.

An independent review also identified a **pre-existing cross-tab recovery/sign-out ordering risk**: an older sign-out event can clear a newer recovery marker, and stale auth events may overwrite later state. The expiry guard does not fix this. A separate, carefully designed and tested resolution is required before calling recovery coordination production-ready. Server-side verification and authorization remain mandatory.

The independent project's Supabase security advisor now reports **Leaked Password Protection Disabled**. Supabase documents that this protection requires the Pro plan or above. No upgrade was enabled; assess password policy and free-plan alternatives before launch, and obtain approval before any paid change. [3]

## Verification commands

After the final code change, `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test` and `pnpm build` all passed. The test suite passed **168 tests in 12 files**. `git diff --check` passed. A subsequent live login, valid-token API request and logout succeeded against the final build.

`pnpm audit --prod --audit-level low` reported no known production dependency vulnerabilities. The full audit reported one high-severity development-tool Picomatch advisory. See [INDEPENDENT-AUTH-REPORT.md](INDEPENDENT-AUTH-REPORT.md) for its limitations and remediation options. The result is not a claim that all security risks are resolved.

Changed files in this follow-up: `README.md`, `SUPABASE-SETUP.md`, `TODO.md`, this report, `src/auth/AuthProvider.tsx`, `src/auth/AuthPage.tsx`, `src/auth/AuthExpiry.test.tsx`, `src/auth/AuthExpirySdk.test.tsx`, `src/auth/AuthFlow.test.tsx`, `src/auth/AuthPage.test.tsx`, `src/auth/AuthProvider.test.tsx` and `src/auth/AuthRegressions.test.tsx`. Existing tests were preserved; some synthetic session fixtures now include expiration metadata.

## Next steps before Stage 1 sign-off

1. Investigate the immediately rejected recovery link without exposing its token. After the two-email/hour limit permits, request one fresh recovery email for the same approved test account, confirm the browser reaches the new-password form, update only that test account, sign out and verify login with the new password. Check email delivery/security tooling if the link is already consumed; that is a hypothesis, not an established cause.
2. Resolve and test the identified cross-tab recovery/sign-out ordering risk. Repeat relevant expired-session and callback tests, including actual browser lifecycle behavior and server-side authorization.
3. Before any deployment, choose the actual production HTTPS origin, set and verify exact allowed callbacks, review the password policy, configure suitable email delivery, confirm environment values at build/runtime, and replace any obsolete cached assets. Obtain approval before paid services or external configuration changes.
4. Preserve the test result distinction between live checks and simulated tests, and obtain explicit approval before Stage 2.

## References

[1]: https://supabase.com/docs/guides/auth/auth-smtp "Supabase default email limitations and custom SMTP"
[2]: https://supabase.com/docs/guides/auth/redirect-urls "Supabase redirect URLs"
[3]: https://supabase.com/docs/guides/auth/password-security "Supabase password security"
