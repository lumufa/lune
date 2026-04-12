# Mobile Device Debug Checklist

This guide is the fastest way to run the shared mobile app on real Android and iPhone devices while keeping the backend stable.

## Recommended setup

Use the deployed cloud API first.

Reason:

- real devices can reach the cloud API directly
- you do not need local API port forwarding
- Windows can still debug iPhone through Expo Go

The current mobile app defaults to the cloud API in:

- `C:\women_period\apps\mobile\constants\runtime.ts`

## One-time preparation

1. Confirm workspace dependencies are installed.

```powershell
$env:PATH='C:\women_period\.tooling\node-v24.14.0-win-x64;' + $env:PATH
corepack yarn install
```

2. Confirm the mobile project typechecks.

```powershell
$env:PATH='C:\women_period\.tooling\node-v24.14.0-win-x64;' + $env:PATH
corepack yarn workspace @women-period/mobile typecheck
```

3. Install Expo Go on the phones you want to test.

- Android: install Expo Go from a trusted Android app source
- iPhone: install Expo Go from the App Store

4. Make sure the computer and phone are on the same network if you use `lan` mode.

If the QR code opens but the bundle cannot load, switch to `tunnel` mode.

## Start the mobile app

### Option A: LAN mode

This is faster and should be the default choice on a normal home or office Wi-Fi.

```powershell
cd C:\women_period
npm run start:mobile:dev
```

### Option B: Tunnel mode

Use this when Wi-Fi isolation, company networks, campus networks, or router rules block local LAN discovery.

```powershell
cd C:\women_period
npm run start:mobile:tunnel
```

## Real Android checklist

1. Start Expo with `npm run start:mobile:dev`
2. Open Expo Go on Android
3. Scan the terminal QR code
4. Wait for Metro to finish bundling
5. Verify these flows in order:

- open calendar tab
- use the top language button and confirm the whole screen switches language
- open `Log Current Period`
- set start and end date-time to minute precision
- open the pain guide button and confirm it opens as a modal, not inline
- save the record
- return to calendar and confirm recent records update
- open a recent record and edit it
- open insights and tap each card to expand
- open reminders from calendar and confirm the back-to-calendar button works
- open privacy page and trigger export

## Real iPhone checklist

On Windows, this is the practical path:

- use Expo Go on the iPhone
- scan the same QR code
- verify the same flow list as Android

Important:

- you can debug the JavaScript app on iPhone from Windows
- you cannot produce a local native iOS build from Windows
- when we move to TestFlight or App Store packaging, we will use EAS Build or a macOS machine

## If the phone cannot reach the app

Check these in order:

1. Switch from `lan` to `tunnel`
2. Turn off VPN on phone and computer
3. Make sure Windows firewall is not blocking Node.js
4. Ensure Expo Go is updated
5. Restart Metro with cache clear

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\start-mobile-dev.ps1 -Mode tunnel
```

## If the app opens but data fails

That usually means UI is fine but API access is wrong.

For the current recommended path, the app should use the default cloud API and not a local `127.0.0.1` address.

You can override the API base manually if needed:

```powershell
cd C:\women_period
powershell -ExecutionPolicy Bypass -File scripts\start-mobile-dev.ps1 -Mode lan -ApiBaseUrl "https://your-api-domain.example.com"
```

## If you must test against a local API

This is not the preferred first path for real phones.

You must use your computer LAN IP, not `127.0.0.1`. Example:

```powershell
cd C:\women_period
npm run start:api
powershell -ExecutionPolicy Bypass -File scripts\start-mobile-dev.ps1 -Mode lan -ApiBaseUrl "http://192.168.1.23:3000"
```

Then make sure:

- the phone and computer are on the same LAN
- Windows firewall allows port `3000`
- the API is listening on a reachable interface

## What to record during testing

For each device, keep these notes:

- device model
- OS version
- Expo Go version
- whether you used `lan` or `tunnel`
- whether login, record create, edit, delete, reminders, export all worked
- screenshots for any broken layout

## Current conclusion

For your project today, the fastest stable route is:

1. keep backend on cloud
2. run mobile app with Expo Go
3. use `lan` first, `tunnel` as fallback
4. finish Android and iPhone flow validation before touching Harmony adaptation
