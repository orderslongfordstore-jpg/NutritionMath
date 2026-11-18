# Stage 1 outcomes

- [x] Preserve the existing NutritionMath repository and history on `stage-1-foundation`; do not modify NutritionPro or introduce Manus SDK, OAuth or runtime dependencies.
- [x] Establish a reproducible React, TypeScript, Vite, Node.js, Express, Supabase, Vitest and Supertest development workspace, with documented configuration and production build.
- [x] Implement Supabase email/password authentication, registration, password recovery and local-session sign-out, with protected dashboard states, clear configuration failures and no demonstration-user bypass. Use only the user-approved shared Supabase account pool; do not alter its settings or tables.
- [x] Provide a professional, responsive iPhone-friendly NutritionMath dashboard with black/dark navigation, white panels and bright yellow highlights. Clearly identify later-stage modules as unavailable and avoid fake counts or actions.
- [x] Establish a minimal health endpoint and a protected identity endpoint that verifies Supabase tokens, plus safe static serving and security defaults.
- [x] Run and report installation, automated tests, type checks, production build, non-destructive connectivity checks and security review, with known limitations recorded in `STAGE-1-REPORT.md`.
- [ ] With a user-controlled account and properly configured Supabase redirects/email, verify successful live sign-in, sign-up confirmation, password-reset delivery and link, password update and sign-out end to end. Mocked tests and invalid-credential checks do not replace this step.
- [ ] Obtain user approval before proceeding to Stage 2.
