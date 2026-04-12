param(
  [ValidateSet("lan", "tunnel")]
  [string]$Mode = "lan",
  [string]$ApiBaseUrl = "",
  [string]$UserId = "mobile-preview-user-cn"
)

$root = Split-Path -Parent $PSScriptRoot
$nodePath = Join-Path $root ".tooling\node-v24.14.0-win-x64"
$yarnCmd = "corepack yarn workspace @women-period/mobile start --$Mode --clear"

if (-not (Test-Path $nodePath)) {
  Write-Error "Bundled Node.js not found: $nodePath"
  exit 1
}

$env:PATH = "$nodePath;$env:PATH"

if ($ApiBaseUrl -and $ApiBaseUrl.Trim().Length -gt 0) {
  $env:EXPO_PUBLIC_API_BASE_URL = $ApiBaseUrl.Trim().TrimEnd("/")
  Write-Host "Using API base URL: $env:EXPO_PUBLIC_API_BASE_URL"
} else {
  Write-Host "Using default cloud API from apps/mobile/constants/runtime.ts"
}

$env:EXPO_PUBLIC_USER_ID = $UserId
Write-Host "Using mobile preview user: $env:EXPO_PUBLIC_USER_ID"
Write-Host "Starting Expo in $Mode mode..."

Invoke-Expression $yarnCmd
