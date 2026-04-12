# Local Demo Guide

## Prerequisites

- Node.js is bundled locally in `C:\women_period\.tooling\node-v24.14.0-win-x64`
- Dependencies are already installed in `node_modules`

## Start The API

```powershell
$env:PATH='C:\women_period\.tooling\node-v24.14.0-win-x64;' + $env:PATH
npm run build
node apps\api\dist\main.js
```

The API will listen on `http://127.0.0.1:3000`.

## Seed Demo Data

Open another PowerShell window in `C:\women_period`:

```powershell
$env:PATH='C:\women_period\.tooling\node-v24.14.0-win-x64;' + $env:PATH
node scripts\seed-demo.cjs
```

The script writes:

- privacy and sensitive-data consents
- 3 cycle records for `demo-user-cn`
- reminder preferences
- one onboarding telemetry event

## Mini Program Debug

If you install WeChat DevTools later:

1. Import `C:\women_period\apps\miniapp` as a Mini Program project.
2. Keep the API running locally on port `3000`.
3. In DevTools, disable domain validation for local debugging if needed.
4. In `develop` env, the miniapp uses `demo-user-cn` automatically.
5. Trial and release envs use a per-device stable anonymous `userId` until real WeChat identity is wired in.
6. API base URLs are resolved in `apps/miniapp/src/config/runtime.ts`.

## Quick Endpoint Checks

```powershell
curl http://127.0.0.1:3000/health
curl -H "x-user-id: demo-user-cn" http://127.0.0.1:3000/cycles
```
