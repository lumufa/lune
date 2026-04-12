$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot

function Find-FirstExistingPath {
  param(
    [string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    if ([string]::IsNullOrWhiteSpace($candidate)) {
      continue
    }

    if (Test-Path $candidate) {
      return (Resolve-Path $candidate).Path
    }
  }

  return $null
}

function Find-ToolUnderRoots {
  param(
    [string]$FileName,
    [string[]]$Roots
  )

  foreach ($rootPath in $Roots) {
    if ([string]::IsNullOrWhiteSpace($rootPath) -or -not (Test-Path $rootPath)) {
      continue
    }

    $directPath = Join-Path $rootPath $FileName
    if (Test-Path $directPath) {
      return (Resolve-Path $directPath).Path
    }

    $match = Get-ChildItem -Path $rootPath -Recurse -File -Filter $FileName -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($match) {
      return $match.FullName
    }
  }

  return $null
}

function Add-PathEntry {
  param(
    [string]$PathEntry
  )

  if ([string]::IsNullOrWhiteSpace($PathEntry) -or -not (Test-Path $PathEntry)) {
    return
  }

  $separator = [IO.Path]::PathSeparator
  $currentParts = $env:Path -split [regex]::Escape("$separator")
  if ($currentParts -contains $PathEntry) {
    return
  }

  $env:Path = "$PathEntry$separator$env:Path"
}

function Write-Status {
  param(
    [string]$Label,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    Write-Host "[MISS] $Label"
  } else {
    Write-Host "[OK] $Label"
    Write-Host "      $Value"
  }
}

$repoNodeHome = Find-FirstExistingPath @(
  (Join-Path $root '.tooling\node-v24.14.0-win-x64')
)

$programFiles = [Environment]::GetFolderPath('ProgramFiles')
$localAppData = [Environment]::GetFolderPath('LocalApplicationData')

$devEcoHome = Find-FirstExistingPath @(
  $env:DEVECO_STUDIO_HOME,
  [Environment]::GetEnvironmentVariable('DEVECO_STUDIO_HOME', 'User'),
  [Environment]::GetEnvironmentVariable('DEVECO_STUDIO_HOME', 'Machine'),
  (Join-Path $programFiles 'Huawei\DevEco Studio'),
  (Join-Path $programFiles 'Huawei\DevEco-Studio'),
  (Join-Path $programFiles 'DevEco Studio'),
  (Join-Path $localAppData 'Programs\DevEco Studio'),
  (Join-Path $localAppData 'Programs\DevEcoStudio')
)

$commandLineToolsHome = Find-FirstExistingPath @(
  $env:HARMONY_COMMANDLINE_TOOLS,
  [Environment]::GetEnvironmentVariable('HARMONY_COMMANDLINE_TOOLS', 'User'),
  [Environment]::GetEnvironmentVariable('HARMONY_COMMANDLINE_TOOLS', 'Machine'),
  (Join-Path $programFiles 'Huawei\Command Line Tools for HarmonyOS'),
  (Join-Path $localAppData 'Huawei\Command Line Tools for HarmonyOS'),
  (Join-Path $localAppData 'Huawei\CommandLineToolsHarmony'),
  (Join-Path $localAppData 'Huawei\Sdk')
)

$javaCandidates = @(
  $env:JAVA_HOME,
  [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User'),
  [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
)

if ($devEcoHome) {
  $javaCandidates += Join-Path $devEcoHome 'jbr'
  $javaCandidates += Join-Path $devEcoHome 'jre'
  $javaCandidates += Join-Path $devEcoHome 'jdk'
}

$javaHome = Find-FirstExistingPath $javaCandidates

$sdkmgrPath = Find-ToolUnderRoots 'sdkmgr.bat' @($commandLineToolsHome, $devEcoHome)
$ohpmPath = Find-ToolUnderRoots 'ohpm.bat' @($commandLineToolsHome, $devEcoHome)
$hdcPath = Find-ToolUnderRoots 'hdc.exe' @($commandLineToolsHome, $devEcoHome)

if ($devEcoHome) {
  $env:DEVECO_STUDIO_HOME = $devEcoHome
}
if ($commandLineToolsHome) {
  $env:HARMONY_COMMANDLINE_TOOLS = $commandLineToolsHome
}
if ($javaHome) {
  $env:JAVA_HOME = $javaHome
  Add-PathEntry (Join-Path $javaHome 'bin')
}
if (-not $env:NODE_HOME -and $repoNodeHome) {
  $env:NODE_HOME = $repoNodeHome
}
if ($env:NODE_HOME) {
  Add-PathEntry $env:NODE_HOME
}
if ($sdkmgrPath) {
  Add-PathEntry (Split-Path -Parent $sdkmgrPath)
}
if ($ohpmPath) {
  Add-PathEntry (Split-Path -Parent $ohpmPath)
}
if ($hdcPath) {
  Add-PathEntry (Split-Path -Parent $hdcPath)
}

Write-Host 'HarmonyOS tool bootstrap for current PowerShell session'
Write-Host "Workspace root: $root"
Write-Host ''

Write-Status 'DEVECO_STUDIO_HOME' $env:DEVECO_STUDIO_HOME
Write-Status 'HARMONY_COMMANDLINE_TOOLS' $env:HARMONY_COMMANDLINE_TOOLS
Write-Status 'JAVA_HOME' $env:JAVA_HOME
Write-Status 'NODE_HOME' $env:NODE_HOME
Write-Status 'sdkmgr' $sdkmgrPath
Write-Status 'ohpm' $ohpmPath
Write-Status 'hdc' $hdcPath

Write-Host ''
Write-Host 'Next step:'
Write-Host "  powershell -ExecutionPolicy Bypass -File $(Join-Path $root 'scripts\check-harmony-env.ps1')"
