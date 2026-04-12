# Mobile Release Checklist (Android / iOS / Harmony)

This checklist is the execution path after the UI and API flows are already verified on real devices.

## Current baseline in this repo

- Mobile app framework: Expo + React Native (`apps/mobile`)
- Build config: `apps/mobile/eas.json`
- App identifiers:
  - Android package: `xyz.app315618.banxiacycle`
  - iOS bundle id: `xyz.app315618.banxiacycle`
- Build helper script: `scripts/mobile-build.ps1`

## Harmony preparation assets in this repo

Before creating the native HarmonyOS app, use the repo preparation assets:

```powershell
cd C:\women_period
npm run check:harmony-env
```

- Readiness guide: `docs/harmony-development-readiness.md`
- Workspace bootstrap notes: `apps/harmony/README.md`
- Runtime config seed: `apps/harmony/runtime.example.json`

## One-time preparation

Run these once:

```powershell
cd C:\women_period
$env:PATH='C:\women_period\.tooling\node-v24.14.0-win-x64;' + $env:PATH
corepack yarn install
corepack yarn workspace @women-period/mobile typecheck
corepack yarn workspace @women-period/mobile exec eas login
corepack yarn workspace @women-period/mobile exec eas whoami
```

Network prerequisite for EAS upload:

- This flow uploads project archives to Google Cloud Storage.
- If your network blocks `storage.googleapis.com`, EAS cloud builds will fail before build starts.
- In that case, switch to a network/proxy that can access both `expo.dev` and `storage.googleapis.com`, then retry.
- If you accidentally set a broken local proxy in PowerShell, rerun builds with `-ClearProxy`.

If the project is not linked to EAS yet:

```powershell
cd C:\women_period\apps\mobile
corepack yarn exec eas init
```

## Android release path

Internal testing package:

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\mobile-build.ps1 -Platform android -Profile preview -ClearProxy -NonInteractive
```

Production package (for Play Console):

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\mobile-build.ps1 -Platform android -Profile production -ClearProxy -NonInteractive
```

Acceptance gate before uploading:

1. Calendar language switch works globally.
2. Record create/edit/delete flow is stable.
3. Reminder toggles and no-disturb time save correctly.
4. Privacy export/delete flows return success.
5. No API errors in Expo logs.

## iOS release path

Build production package:

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\mobile-build.ps1 -Platform ios -Profile production -ClearProxy -NonInteractive
```

Build and auto-submit to TestFlight:

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\mobile-build.ps1 -Platform ios -Profile production -AutoSubmit -ClearProxy -NonInteractive
```

If Android build succeeds but the CLI ends with `spawn adb ENOENT`:

- The cloud build already finished successfully.
- Only the optional local emulator install step failed.
- Use the Expo build URL or QR code to install on a real Android phone.

Notes:

- You can start this from Windows because EAS builds remotely.
- You still need valid Apple Developer Program credentials and signing permissions.

## Harmony strategy (recommended after Android+iOS beta)

To reduce risk, keep Harmony as phase 2:

1. Freeze API contracts in `packages/shared` and backend endpoints.
2. Finish Android+iOS closed beta and stabilize data model.
3. Reuse the readiness assets in `apps/harmony` and `docs/harmony-development-readiness.md`.
4. Create the native Harmony shell app inside `apps/harmony` with a Stage-model phone target and reuse the same API domain and contracts.
5. Keep parity scope to Calendar, Record, Reminder, Privacy first; postpone advanced insights until parity is stable.

This keeps product behavior consistent across platforms and avoids triple-platform drift too early.
