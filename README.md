# Women Period MVP

Monorepo scaffold for a China-market menstrual tracking product that starts as a WeChat Mini Program and later expands to iOS, Android, and a native HarmonyOS app.

## Product Principles

- Fast logging in under 30 seconds
- Privacy-first handling for sensitive health data
- Bounded predictions with confidence windows instead of diagnostic claims
- A backend-owned domain model that can be reused by future mobile apps

## Workspace Layout

- `apps/api`: NestJS-style backend API scaffold
- `apps/miniapp`: WeChat Mini Program scaffold
- `apps/mobile`: Expo + React Native mobile app (Android/iOS)
- `apps/harmony`: HarmonyOS native app (Stage model + ArkTS)
- `packages/shared`: shared contracts, enums, telemetry names, and sample data helpers
- `packages/prediction`: pure period prediction rules and analytics helpers
- `docs`: product, compliance, and interface documentation

## Environment

This workspace was scaffolded without a local Node.js toolchain available. The code and configs follow a TypeScript/NestJS implementation shape, but dependency installation and runtime verification still require Node.js 20+ and npm 10+.

## Suggested Next Steps

1. Install Node.js 20+ and npm.
2. Run `npm install`.
3. Start the API with `npm run dev:api`.
4. Open `apps/miniapp` with WeChat DevTools and point it to the running API.
5. Replace the in-memory repositories with PostgreSQL persistence using the schema in `apps/api/db/schema.sql`.
6. Run `npm run check:harmony-env` before opening the HarmonyOS project.
7. Run `npm run build:harmony` once to generate `local.properties` and install Harmony dependencies.
8. If DevEco Studio is not installed yet, follow `docs/harmony-windows-setup.md`.
