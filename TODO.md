# Stage 1 outcomes

- [x] Preserve the existing NutritionMath repository and history on `stage-1-foundation`; do not modify NutritionPro or introduce Manus SDK, OAuth or runtime dependencies.
- [x] Establish the React, TypeScript, Vite, Node.js, Express, Supabase, Vitest and Supertest workspace, responsive dashboard, authentication flows and automated tests.
- [x] Disconnect the local environment from the formerly shared project; preserve its previous settings as an ignored backup.
- [x] Obtain approval, create a separate NutritionMath Supabase project in Twominds/Sydney, and configure the local frontend and server public environment variables.
- [x] Run installation, type checks, tests, a production build, read-only connectivity checks and production dependency audit against the new configuration.
- [x] Inspect the independent project's current signup, email delivery, Site URL, redirect list and confirmation/recovery templates without changing the shared NutritionPro project.
- [x] Verify dedicated-account signup and confirmation, live sign-in and sign-out, and a valid-token API request against the independent project only.
- [ ] Investigate the recovery link that was rejected as expired on first observed use; after the email rate limit permits, verify a new recovery link, password update and login with the new password. Test confirmation resend if required.
- [ ] Resolve and test the identified pre-existing cross-tab recovery/sign-out ordering issue; review password policy and configure exact production redirects and suitable email delivery before release.
- [ ] Configure the independent project variables in each future build/deployment environment and confirm no stale shared-project assets are served.
- [ ] Obtain user approval before proceeding to Stage 2.
