# Stage 1 authentication resolution plan

**Stage 1 remains incomplete.** The password-recovery link was rejected on its first observed use, and a separate cross-tab recovery/sign-out ordering risk remains. The recovery-link cause is unknown. Neither issue is resolved by the current passing tests. Stage 2 implementation remains on hold until Stage 1 is completed and approved.

Prepared 19 November 2026, Australia/Sydney. Author: Manus AI. This is a plan, not a record of fixes or new live authentication tests. The latest live evidence is in [STAGE-1-AUTH-VERIFICATION.md](STAGE-1-AUTH-VERIFICATION.md).

## 1. Investigate and verify password recovery

### What is known

A dedicated account in the independent NutritionMath Supabase project successfully completed registration, email confirmation, sign-in, sign-out and a valid-token `/api/me` request. A recovery email arrived, but its link returned `otp_expired` approximately 19 seconds after the reset request on its **first observed** visit. The password was not changed, and login with a new password was not tested. An earlier automated access, a superseding request, a malformed or rewritten link, or a configuration/lifetime problem are possibilities, not established causes.

The project previously showed `http://localhost:3000` as its Site URL, no additional redirect URLs, default email templates and a two-emails-per-hour default mailer. These were observations at the previous test, not a guarantee of current settings. The recorded 3,600-second **access-token** lifetime is not evidence of the recovery-link lifetime. The test account's temporary password was removed from the workspace after testing.

The current app sends its page origin and path as the redirect in `src/auth/AuthPage.tsx`. `src/auth/AuthProvider.tsx` handles Supabase's implicit email-link callback and `PASSWORD_RECOVERY` event. A code-only or token-hash-only callback exchange is not implemented. Changing a template to one of those formats without first adding and testing compatible application code would break the flow.

### Resolution steps

1. **Inspect without changing anything.** Confirm the independent project's identity, current email provider, reset template, redirect allowlist, actual local app origin/path, recovery-link expiration and rate limits. Check that frontend build and backend runtime both use the independent project. Never inspect or change NutritionPro.
2. **Correlate the existing failure.** Review only relevant Auth/API and email-security metadata around the request, email and failed verification: timestamps, event categories, status/error codes and, if safely available, evidence of any earlier verification request. Logs may be incomplete. Do not display or record link URLs, token hashes, codes, passwords, session data or raw request query strings. Check for an intervening reset request and for message rewriting or truncation without following the link.
3. **Test hypotheses, not assumptions.** Email security scanners can consume single-use links before a person opens them, as Supabase documents, but that has not been established here. Link modification, a different request invalidating the link, and expiry/configuration mistakes also need consideration. Avoid diagnostic GET, HEAD, preview or browser prefetch requests against a fresh verification link; these may consume or expose it. [1] [2]
4. **Run one controlled live retry when authorized.** Use the previously approved dedicated test account and its authorized inbox, not a production or NutritionPro account. Check the current project-wide email quota and any per-user cooldown first. Request one new reset email and use that newest link once in the intended browser and origin. On a rate-limit response or another first-observed failure, stop and re-examine sanitized evidence rather than repeatedly sending or opening links. Do not place passwords, codes or links in chat, Git, logs or screenshots. [3]
5. **Fix only the established failure.** If the existing implicit flow works with correct settings and intact links, retain it. If evidence points to automatic link consumption, evaluate a user-entered one-time code or a human-confirmation step as an alternative; each requires application implementation and security tests, and any email-template or Supabase setting change requires explicit approval. A confirmation page must not consume a one-time token merely because a scanner performs a GET. Avoid leaking tokens through URLs, logs, referrers or third-party scripts. Do not assume changing a template alone makes an unsupported callback flow work. [1] [4]

**Live acceptance:** the fresh link reaches the intended local callback, presents the new-password form instead of the dashboard, changes only the dedicated test account's password, and permits sign-out followed by login with the new password. Confirm `/api/me` accepts the new session and rejects missing or invalid tokens. Test expired/reused link behavior using synthetic inputs or an already-spent link, not a fresh link reserved for recovery. Record live outcomes separately from mocks. Confirmation resend remains a separate live test if the feature will be offered; reserve a separate mail quota slot and obtain the needed authorization.

## 2. Fix the cross-tab recovery and sign-out race

### What the code currently does

`src/auth/AuthProvider.tsx` stores an active recovery marker as a per-user `localStorage` value. Both a module-level listener and a provider listener can remove it when they receive `SIGNED_OUT`, even though that event can carry no session identifying which operation signed out. A late sign-out can therefore remove a newer recovery marker for the same user. Other stale events can also be applied after a newer session.

`src/auth/AuthPage.tsx` calls `completeRecovery()` after the asynchronous password update returns. The provider then reads the **current** user rather than the user and recovery operation that began the update. An account switch or a newer same-user recovery during the request could therefore clear the wrong marker. These are ordering risks found by code review; they are not proof that a production account or business data was exposed.

The existing jsdom regression tests cover several recovery states and one delayed sign-out completion, but they do not prove safety for all adverse event orders or real browser tabs. Merely adding a version check before `localStorage.removeItem()` is insufficient: another tab can write a newer value between the check and removal.

### Resolution steps

1. **Write failing tests for the exact orderings first.** Reproduce old `SIGNED_OUT` arriving after a newer recovery for the same user; a recovery update finishing after an account switch or a newer recovery; and stale refresh/sign-in events after a newer session. Include concurrent operations and the check/delete interleaving. Keep existing session-expiry, callback, sign-out and recovery tests.
2. **Define a conservative state protocol.** Identify each recovery attempt by an opaque operation generation, project and captured user/session context. An uncorrelated sign-out must not clear a newer recovery. A password-update result must not clear or apply to a different operation or account. Decide explicitly when an ordinary new sign-in may leave an older cancelled recovery. When identity or state is uncertain, keep the protected UI closed and provide a safe retry or sign-out path.
3. **Select and test atomic coordination.** A candidate is a project-scoped IndexedDB transaction for pending and active recovery generations and conditional transitions. All cooperating tabs must use the same atomic protocol. A Web Locks plus versioned-storage design is an alternative only if all readers and writers use the lock and safe behavior is defined when locks/storage are unavailable. A timestamp, a broadcast event or a separate read-then-delete is not an atomic cross-tab transaction. Do not persist extra bearer or refresh tokens for fencing.
4. **Coordinate session mutations, not just markers.** The current SDK can write its session during sign-in, refresh and `updateUser`. Review the installed SDK's actual behavior and ensure the password update targets the captured account, even if another tab changes session concurrently. Reject or safely reconcile stale results; do not assume matching user IDs or a late event proves causal ordering. If safe handling of SDK-internal writes cannot be demonstrated, stop and review a different design rather than declaring the race fixed.
5. **Keep the app usable and fail closed.** Ensure any pending recovery guard is durably established before the SDK processes an incoming callback; if that cannot be done, do not silently expose a protected screen. Handle storage denial, quota, corrupt state, tab crash/reload, delayed notifications, session expiry and offline failures with actionable retry or sign-out—not an endless spinner. Keep auth-event callbacks quick and perform asynchronous coordination outside the callback. Do not clear a recovery simply because a timer expired.
6. **Review the security boundary.** Cross-tab markers are a same-origin, cooperating-client UI safeguard. They do not enforce server authorization, protect against an old client or another device, or revoke tokens. Preserve server-side Supabase token verification and ensure future business data is protected independently by membership checks and row-level security. Local sign-out does not prove immediate global invalidation of every issued token. [5]

### Tests required for acceptance

- Deterministic unit/integration tests for same-user successive recoveries, account switches during updates, stale `SIGNED_OUT`/refresh/sign-in events, concurrent sign-outs, and update success and failure. Verify neither a newer recovery nor another account is cleared or modified.
- Cross-tab tests that pause one transition between reading and deleting while another starts recovery; test simultaneous starts/completions, reload, delayed events and foregrounding. Include selective pending/active marker write failures, storage/lock unavailable, quota errors, clock changes and safe recovery after failure.
- Real two-page same-origin browser tests with the installed Supabase SDK and controlled synthetic/intercepted auth responses. Exercise callback initialization, the SDK's own session-storage writes, delayed network responses, event ordering and callback/lock reentrancy with timeouts. jsdom tests alone do not establish real-tab behavior.
- Regression tests for expired or missing expiry, refresh restoration, sign-out failure before/after local clearing, initial session failure, invalid/expired callback handling and no credential leakage. Test supported browsers, including an iPhone/Safari scenario where feasible; record any environment not actually tested.
- Where feasible, run a controlled **real-time expiry** check using only the approved test account: verify the current token lifetime without changing it, prevent refresh only in that test browser, wait for the actual deadline, and verify the dashboard is hidden. Restore connectivity and separately verify expired-token API rejection and legitimate recovery or sign-in. Keep any token only in private test memory and never log it. If the real-time or iPhone test cannot be completed, record the gap rather than treating synthetic tests as live proof.

The desired result is that all defined transitions pass under the documented same-origin, cooperating-client model, without opening an unresolved recovery screen to the dashboard. This is not a claim that browser events provide an absolute guarantee across devices, old app versions or non-cooperating clients.

## 3. Separate production-readiness checks

Before public deployment—not necessarily before a local test—choose the actual HTTPS app URL and configure and test exact signup/recovery redirects. Confirm suitable email delivery for customers and business-team members, review the password policy, match frontend build and backend runtime projects, and replace obsolete assets. Supabase documents that its default mailer is limited to organization team addresses and currently two messages per hour; it is not meant for production. Custom SMTP, changes to Supabase settings, additional accounts or paid features require the relevant explicit approval. [2] [6]

The independent project's security advisor previously reported leaked-password protection disabled. Supabase documents this feature as Pro plan or above. Do not upgrade or enable paid services without approval; evaluate an appropriate password policy and alternatives before release. [7]

## 4. Verification and approval gate

After any actual fixes, run `pnpm install --frozen-lockfile`, `pnpm check`, `pnpm test`, `pnpm build`, production and full dependency audits, browser regression tests and an independent security review. Report actual commands, results, changed files and the committed Git hash; never present a mocked test as a live result. Stage 1 sign-off requires the successful dedicated-account recovery and the reviewed cross-tab fix. Obtain explicit approval before Stage 2.

**Baseline for this planning review:** the existing type checks, all **168 tests across 12 files**, and the production build passed on the current branch. No new live login, email, password change, Supabase configuration change or application code change was performed during this review. These passing tests do not verify the outstanding live recovery or all cross-tab orderings.

## References

[1]: https://supabase.com/docs/guides/auth/auth-email-templates "Supabase email templates and prefetching"
[2]: https://supabase.com/kb/troubleshooting/otp-verification-failures-token-has-expired-or-otp_expired-errors-5ee4d0 "Supabase one-time link troubleshooting"
[3]: https://supabase.com/docs/guides/auth/rate-limits "Supabase Auth rate limits"
[4]: https://supabase.com/docs/guides/auth/passwords "Supabase password recovery"
[5]: https://supabase.com/docs/reference/javascript/auth-onauthstatechange "Supabase authentication events"
[6]: https://supabase.com/docs/guides/auth/auth-smtp "Supabase default mail and custom SMTP"
[7]: https://supabase.com/docs/guides/auth/password-security "Supabase password security"
