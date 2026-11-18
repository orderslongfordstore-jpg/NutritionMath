# Stage 1 outcomes

- [x] Preserve the existing NutritionMath repository and history on `stage-1-foundation`; do not modify NutritionPro or introduce Manus SDK, OAuth or runtime dependencies.
- [x] Establish the React, TypeScript, Vite, Node.js, Express, Supabase, Vitest and Supertest workspace, responsive dashboard, authentication flows and automated tests.
- [x] Disconnect the local environment from the formerly shared project; preserve its previous settings as an ignored backup.
- [x] Obtain approval, create a separate NutritionMath Supabase project in Twominds/Sydney, and configure the local frontend and server public environment variables.
- [x] Run installation, type checks, tests, a production build, read-only connectivity checks and production dependency audit against the new configuration.
- [ ] Verify or configure the new project's exact auth redirects, email delivery and templates; review its password policy. Do not modify the shared NutritionPro project.
- [ ] With a user-controlled account and inbox, verify signup confirmation, resend, successful live sign-in, reset delivery and link, password update, sign-out and valid-token API authentication end to end against the independent project only.
- [ ] Configure the independent project variables in each future build/deployment environment and confirm no stale shared-project assets are served.
- [ ] Obtain user approval before proceeding to Stage 2.
