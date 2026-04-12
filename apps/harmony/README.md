# HarmonyOS Native App

This folder now contains the committed Stage-model HarmonyOS phone project for the repo.

Current status on 2026-03-21:

- Native project scaffold is in place under `AppScope` and `entry`
- The first Harmony screen boots as a real ArkTS app and calls the existing `/cycles` dashboard endpoint
- Record editing, reminders, privacy actions, and consent history are still the next parity milestones

## Open And Build

1. Run `npm run check:harmony-env` from the workspace root.
2. Open `apps/harmony` in DevEco Studio.
3. If `local.properties` is missing, run `npm run build:harmony` once from the workspace root.
4. Select the `entry` module and a HarmonyOS phone target, then run or preview from DevEco Studio.

## Workspace Shape

- `AppScope`: app-level bundle metadata and icon resources
- `entry`: main phone module using Stage model and ArkTS
- `runtime.example.json`: repo-side runtime defaults mirrored by `entry/src/main/ets/common/RuntimeConfig.ets`

## Current Scope

- Home dashboard wired to `GET /cycles`
- Shared runtime defaults aligned with the existing mobile preview environment
- Typed Harmony API client covering the same backend endpoints as `apps/mobile/services/api.ts`
- Calm, privacy-first first screen that shows prediction window, averages, and recent records

## Assumptions In This First Commit

- Default bundle identifier: `com.womenperiod.harmony`
- Preview user id: `harmony-preview-user-cn`
- Device target: phone only
- Initial release channel label: `harmony-native`

These are easy to change later in `AppScope/app.json5`, `runtime.example.json`, and `entry/src/main/ets/common/RuntimeConfig.ets`.
