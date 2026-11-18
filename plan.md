# Stage 1 implementation plan

## Approach

Build on the existing `stage-1-foundation` branch without replacing its history. The React/TypeScript/Vite client uses Supabase Auth for email and password sessions. A protected dashboard appears only after authentication; password recovery has an explicit update flow. The separate Node/Express server supplies a public health endpoint and an identity endpoint that validates bearer tokens with Supabase. No privileged Supabase key or Manus-specific runtime is required. The user has approved use of the existing shared Supabase authentication pool; account registrations and password changes there can also affect other applications. Do not modify NutritionPro tables, auth configuration, or existing users during development.

The interface has no pretend recipe data or working controls for future modules. Stages 2–10 remain documented in `ROADMAP.md` and await separate approval. Australian nutrition calculation and labelling are not part of this stage.

## Design

NutritionMath is an orderly, practical production workspace for Australian food makers. The visual language uses dark near-black navigation, light content panels and a sharp yellow accent. Large, confident headings, restrained dividers and compact status labels establish hierarchy without decorative charts or fabricated metrics. The desktop workspace places navigation beside the main canvas; on iPhone it collapses into a mobile navigation control and a single-column flow. Controls use visible focus and accessible labels. Motion is restrained and respects reduced-motion settings.

## Project structure

- `src/auth/`: Supabase client/session handling and sign-in, registration and recovery screens.
- `src/components/`: responsive Stage 1 dashboard and scoped styles.
- `server/`: Express app, server startup and API tests.
- `public/`: static brand assets.
- Root configuration: Vite, TypeScript, package manifest and lockfile, plus an example environment file.
- `ROADMAP.md`: staged delivery and data/regulatory boundaries.
