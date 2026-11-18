# Stage 1 outcomes

- [x] Preserve the existing NutritionMath repository and history on `stage-1-foundation`; do not modify NutritionPro or introduce Manus SDK, OAuth or runtime dependencies.
- [x] Establish a reproducible React, TypeScript, Vite, Node.js, Express, Supabase, Vitest and Supertest development workspace, with documented configuration and production build.
- [x] Implement Supabase email/password authentication, registration, password recovery and local-session sign-out, with protected dashboard states and automated tests.
- [x] Provide a responsive iPhone-friendly dashboard that identifies later-stage modules as unavailable and avoids fake counts or actions.
- [x] Establish a minimal health endpoint and a protected identity endpoint that verifies Supabase tokens, plus safe static serving and security defaults.
- [x] Disconnect the workspace's local environment from the formerly shared project and document the independent-project requirements; preserve the previous local configuration as an ignored backup.
- [ ] Obtain explicit approval before creating, selecting or modifying an external Supabase project. Do not modify the shared NutritionPro project or its users, passwords, settings or data.
- [ ] Configure the approved independent project's email/password authentication, links, email delivery and exact redirects; put its public values in both frontend build and server runtime settings. Review [INDEPENDENT-AUTH-REPORT.md](INDEPENDENT-AUTH-REPORT.md) before doing so.
- [ ] With a user-controlled test account, verify successful live sign-in, sign-up confirmation, password-reset delivery and link, password update and sign-out end to end against the independent project only. Mocked tests do not replace this step.
- [ ] Obtain user approval before proceeding to Stage 2.
