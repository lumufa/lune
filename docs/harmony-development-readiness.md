# Harmony Development Readiness

## Goal

Prepare this repo so the team can start a native HarmonyOS phone app with low setup risk and clear reuse boundaries.

## Current status

- `apps/mobile` is still the working mobile app and UX reference.
- `apps/harmony` is now the reserved workspace for the future native HarmonyOS project.
- The native Harmony app has not been generated yet.

## Official baselines checked on 2026-03-21

- Huawei documents Stage model as the recommended long-term application model for HarmonyOS NEXT: https://developer.huawei.com/consumer/cn/arkui/arkui-stage/
- Huawei provides DevEco Studio downloads and a HarmonyOS command-line tools bundle. The archive page states the command-line tools include `sdkmgr`, `codelinter`, and `ohpm`: https://developer.huawei.com/consumer/cn/deveco-studio/archive/
- Huawei's HarmonyOS NEXT readiness page says developers need a Huawei account and real-name verification before using the developer-preview flow: https://developer.huawei.com/consumer/cn/develop/next-ready/
- Huawei's knowledge map aggregates the official learning and setup path for HarmonyOS app development: https://developer.huawei.com/consumer/cn/app/knowledge-map/

## First delivery scope

Build parity for the workflows that already define the product:

- Calendar dashboard and next-period window
- Record create, edit, and delete
- Reminder preferences and quiet hours
- Privacy export and account deletion
- Consent history display
- Language switch and calm privacy-first copy

Delay until phase 2:

- Advanced insights cards and visualizations
- Widgets/cards and multi-device extensions
- Any platform-specific growth feature that changes the shared data contract

## Reuse map inside this repo

- Shared contracts: `packages/shared/src/index.ts`
- Prediction rules and confidence logic: `packages/prediction/src/index.ts`
- API behavior reference: `apps/mobile/services/api.ts`
- Current mobile routing and screen flow: `apps/mobile/app`
- Runtime API defaults: `apps/mobile/constants/runtime.ts`
- Product scope and non-goals: `docs/product-prd.md`

## Recommended creation path

1. Run `npm run check:harmony-env`.
2. Follow `docs/harmony-windows-setup.md` to install DevEco Studio and make sure the HarmonyOS command-line tools are available locally.
3. Create a Stage-model ArkTS phone app inside `apps/harmony`.
4. Keep the first native release narrow and map every screen to an existing backend endpoint before adding new platform features.
5. Reuse backend-computed prediction payloads from the API first. Do not fork prediction logic into the Harmony app unless offline use becomes a real product requirement.

## Screen-to-backend parity map

- Calendar home: `GET /cycles`
- Create record: `POST /cycles`
- Edit record: `PATCH /cycles/:id`
- Delete record: `DELETE /cycles/:id`
- Reminder settings: `GET /reminders/preferences`, `PUT /reminders/preferences`
- Consent history: `GET /consents`
- Privacy actions: `GET /privacy/actions`
- Export: `GET /privacy/export`
- Delete account: `POST /privacy/delete`
- Telemetry: `POST /telemetry/events`

## Day-1 implementation checklist

1. Generate the native project in `apps/harmony`.
2. Add a small runtime config layer based on `apps/harmony/runtime.example.json`.
3. Build a typed API client that mirrors `apps/mobile/services/api.ts`.
4. Ship the record editor flow first, because it exercises the most core contracts with the least visualization debt.
5. Add one phone device to the test matrix before any broader Harmony-specific design work.

## Guardrails

- Do not hand-maintain generated DevEco metadata before the official project exists.
- Do not widen backend contracts for Harmony-only experiments during parity work.
- Keep copy, privacy behavior, and reminder semantics consistent with the Mini Program and current mobile app.
