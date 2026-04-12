param(
  [ValidateSet("android", "ios")]
  [string]$Platform = "android",
  [ValidateSet("development", "preview", "production")]
  [string]$Profile = "preview",
  [switch]$AutoSubmit,
  [switch]$NonInteractive,
  [switch]$ClearProxy
)

$root = Split-Path -Parent $PSScriptRoot
$nodePath = Join-Path $root ".tooling\node-v24.14.0-win-x64"

if (-not (Test-Path $nodePath)) {
  Write-Error "Bundled Node.js not found: $nodePath"
  exit 1
}

$env:PATH = "$nodePath;$env:PATH"

if ($ClearProxy) {
  foreach ($proxyVar in @("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY", "http_proxy", "https_proxy", "all_proxy")) {
    if (Test-Path "Env:$proxyVar") {
      Remove-Item "Env:$proxyVar"
    }
  }
  Write-Host "Cleared proxy environment variables for this build session."
}

$easArgs = @(
  "yarn",
  "workspace",
  "@women-period/mobile",
  "exec",
  "eas",
  "build",
  "--platform",
  $Platform,
  "--profile",
  $Profile
)

if ($AutoSubmit) {
  $easArgs += "--auto-submit"
}

if ($NonInteractive) {
  $easArgs += "--non-interactive"
}

Write-Host "Running: corepack $($easArgs -join ' ')"
& corepack @easArgs

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}
