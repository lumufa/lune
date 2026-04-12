# Harmony Windows Setup

## Purpose

Use this guide to finish the missing local prerequisites for native HarmonyOS development on Windows, then create the real project inside `apps/harmony`.

## What we verified on 2026-03-21

- The official DevEco Studio archive page publicly exposes DevEco Studio downloads and the separate HarmonyOS command-line tools package: [DevEco Studio archive](https://developer.huawei.com/consumer/cn/deveco-studio/archive/)
- Huawei's public release page says DevEco Studio 3.1 is for HarmonyOS 3.1 and below, and HarmonyOS NEXT preview access may require a preview channel: [DevEco Studio release plan](https://developer.huawei.com/consumer/cn/deveco-studio/release/)
- Huawei's readiness page states HarmonyOS NEXT developer-preview access requires a Huawei account and developer real-name verification: [HarmonyOS NEXT readiness](https://developer.huawei.com/consumer/cn/develop/next-ready/)
- Huawei's official knowledge map is the safest starting point for current learning and setup links: [HarmonyOS knowledge map](https://developer.huawei.com/consumer/cn/app/knowledge-map/)

Inference: on 2026-03-21, the safest repo workflow is still to install DevEco Studio and the HarmonyOS command-line tools from Huawei's official pages first, then generate the app locally in `apps/harmony`.

## Current machine status

From the repo check on 2026-03-21:

- Node.js: available
- Java: available
- DevEco Studio: missing
- HarmonyOS command-line tools: missing
- `ohpm`: missing
- `hdc`: missing

Run this again any time:

```powershell
cd C:\women_period
npm run check:harmony-env
```

## Step 1: Prepare your Huawei account

Before you spend time on local tooling, confirm:

1. You can sign in to Huawei Developer with your working account.
2. Developer real-name verification is complete.
3. If you need HarmonyOS NEXT preview resources, your account has the required preview access.

Official page:

- [HarmonyOS NEXT readiness](https://developer.huawei.com/consumer/cn/develop/next-ready/)

## Step 2: Install DevEco Studio

1. Open the official [DevEco Studio archive](https://developer.huawei.com/consumer/cn/deveco-studio/archive/) on Windows.
2. Download the current Windows package exposed there.
3. Install or unzip it into a stable location, preferably under `C:\Program Files\Huawei\DevEco Studio`.
4. Launch it once so it can finish first-run setup.

Notes:

- As checked on 2026-03-21, the public archive page still shows a `DevEco Studio 3.1.1 Release` section.
- The release-plan page says HarmonyOS NEXT preview support may require a separate preview track. If you are targeting HarmonyOS NEXT specifically and the public package is not enough, use the preview-access path from Huawei rather than guessing an unofficial installer.

## Step 3: Install HarmonyOS command-line tools

1. On the same official archive page, download the Windows `Command Line Tools for HarmonyOS` package.
2. Extract it to a stable location, for example:

```text
C:\Users\<you>\AppData\Local\Huawei\Command Line Tools for HarmonyOS
```

3. Keep the extracted folder intact. The repo scripts can discover it if you set `HARMONY_COMMANDLINE_TOOLS` or keep it in a standard location.

Huawei says this package includes:

- `sdkmgr`
- `codelinter`
- `ohpm`

Source:

- [DevEco Studio archive](https://developer.huawei.com/consumer/cn/deveco-studio/archive/)

## Step 4: Attach tools to the current PowerShell session

After installation, you do not need to edit the global PATH immediately. First test everything in the current terminal session:

```powershell
cd C:\women_period
. .\scripts\use-harmony-tools.ps1
npm run check:harmony-env
```

The leading dot matters. It dot-sources the script so the environment variables apply to your current shell.

## Step 5: If auto-detection still misses the install

Set these session variables explicitly and rerun the check:

```powershell
$env:DEVECO_STUDIO_HOME = 'C:\Program Files\Huawei\DevEco Studio'
$env:HARMONY_COMMANDLINE_TOOLS = 'C:\Users\<you>\AppData\Local\Huawei\Command Line Tools for HarmonyOS'
. .\scripts\use-harmony-tools.ps1
npm run check:harmony-env
```

If Java is not on PATH, also set:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot'
. .\scripts\use-harmony-tools.ps1
```

## Step 6: Verify the toolchain

You want these to resolve without errors:

```powershell
java -version
ohpm --version
hdc version
npm run check:harmony-env
```

Expected outcome:

- `check-harmony-env` no longer reports DevEco Studio or Harmony command-line tools as blocking issues.

## Step 7: Create the native app

Once the environment is ready:

1. Open DevEco Studio.
2. Create a new Stage-model ArkTS phone application.
3. Choose `C:\women_period\apps\harmony` as the project location.
4. After project generation, commit the generated files into `apps/harmony`.
5. Then start implementing the parity slices documented in [harmony-development-readiness.md](/C:/women_period/docs/harmony-development-readiness.md).

## Recommended first implementation order

1. Runtime config layer using `apps/harmony/runtime.example.json`
2. Typed API client mirroring `apps/mobile/services/api.ts`
3. Record create/edit/delete
4. Calendar dashboard
5. Reminder preferences
6. Privacy export/delete and consent history

## Troubleshooting

- If `npm run check:harmony-env` still cannot find tools, dot-source [use-harmony-tools.ps1](/C:/women_period/scripts/use-harmony-tools.ps1) in the same PowerShell window first.
- If the public DevEco package does not expose the HarmonyOS NEXT SDK you need, use Huawei's preview-access path instead of mixing unofficial downloads.
- If `ohpm` is found but `hdc` is not, you can still start project creation, but real-device debugging will remain blocked until `hdc` is reachable.
