$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$staging = Join-Path $root "tmp\\cloudrun-api-package"
$output = Join-Path $root "period-api-upload-cloudrun.zip"

function Reset-Directory {
  param([string]$Path)

  if (Test-Path $Path) {
    Remove-Item -Path $Path -Recurse -Force
  }

  New-Item -Path $Path -ItemType Directory | Out-Null
}

function Write-JsonFile {
  param(
    [string]$Path,
    [hashtable]$Value
  )

  $json = $Value | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText($Path, "$json`n", [System.Text.UTF8Encoding]::new($false))
}

Reset-Directory -Path $staging

$apiDir = Join-Path $staging "apps\\api"
$vendoredScopeDir = Join-Path $apiDir "node_modules\\@women-period"
$vendoredSharedDir = Join-Path $vendoredScopeDir "shared"
$vendoredPredictionDir = Join-Path $vendoredScopeDir "prediction"

New-Item -Path $apiDir -ItemType Directory -Force | Out-Null
New-Item -Path $vendoredSharedDir -ItemType Directory -Force | Out-Null
New-Item -Path $vendoredPredictionDir -ItemType Directory -Force | Out-Null

Copy-Item -Path (Join-Path $root "Dockerfile.cloudrun") -Destination (Join-Path $staging "Dockerfile")
Copy-Item -Path (Join-Path $root "apps\\api\\dist") -Destination $apiDir -Recurse
Copy-Item -Path (Join-Path $root "apps\\api\\db") -Destination $apiDir -Recurse
Copy-Item -Path (Join-Path $root "packages\\shared\\dist") -Destination $vendoredSharedDir -Recurse
Copy-Item -Path (Join-Path $root "packages\\prediction\\dist") -Destination $vendoredPredictionDir -Recurse

$apiPackage = @{
  name = "@women-period/api"
  version = "0.1.0"
  private = $true
  main = "dist/main.js"
  scripts = @{
    start = "node dist/main.js"
  }
  dependencies = @{
    "@nestjs/common" = "^11.0.11"
    "@nestjs/core" = "^11.0.11"
    "@nestjs/platform-express" = "^11.0.11"
    "class-transformer" = "^0.5.1"
    "class-validator" = "^0.15.1"
    "reflect-metadata" = "^0.2.2"
    "rxjs" = "^7.8.2"
  }
}

$sharedPackage = @{
  name = "@women-period/shared"
  version = "0.1.0"
  private = $true
  main = "dist/index.js"
  types = "dist/index.d.ts"
}

$predictionPackage = @{
  name = "@women-period/prediction"
  version = "0.1.0"
  private = $true
  main = "dist/index.js"
  types = "dist/index.d.ts"
}

Write-JsonFile -Path (Join-Path $apiDir "package.json") -Value $apiPackage
Write-JsonFile -Path (Join-Path $vendoredSharedDir "package.json") -Value $sharedPackage
Write-JsonFile -Path (Join-Path $vendoredPredictionDir "package.json") -Value $predictionPackage

Push-Location $apiDir
try {
  npm install --package-lock-only --omit=dev | Out-Null
} finally {
  Pop-Location
}

if (Test-Path (Join-Path $apiDir "node_modules")) {
  Remove-Item -Path (Join-Path $apiDir "node_modules") -Recurse -Force
}

New-Item -Path $vendoredScopeDir -ItemType Directory -Force | Out-Null
Copy-Item -Path (Join-Path $root "packages\\shared\\dist") -Destination $vendoredSharedDir -Recurse -Force
Copy-Item -Path (Join-Path $root "packages\\prediction\\dist") -Destination $vendoredPredictionDir -Recurse -Force
Write-JsonFile -Path (Join-Path $vendoredSharedDir "package.json") -Value $sharedPackage
Write-JsonFile -Path (Join-Path $vendoredPredictionDir "package.json") -Value $predictionPackage

if (Test-Path $output) {
  Remove-Item -Path $output -Force
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::CreateFromDirectory($staging, $output)

Write-Output "Created $output"
