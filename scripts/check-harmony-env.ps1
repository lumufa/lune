$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$blockingIssues = New-Object System.Collections.Generic.List[string]

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

function Get-CommandPath {
  param(
    [string]$Name
  )

  $command = Get-Command $Name -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($command) {
    return $command.Source
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

function Get-FirstLine {
  param(
    [scriptblock]$ScriptBlock
  )

  try {
    $output = & $ScriptBlock 2>&1 | Select-Object -First 1
    if ($output) {
      return "$output".Trim()
    }
  } catch {
    return $null
  }

  return $null
}

function Write-Check {
  param(
    [string]$Name,
    [bool]$Passed,
    [string]$Detail
  )

  $prefix = if ($Passed) { '[OK]' } else { '[WARN]' }
  Write-Host "$prefix $Name"
  if ($Detail) {
    Write-Host "       $Detail"
  }
}

function Resolve-Text {
  param(
    [string[]]$Candidates
  )

  foreach ($candidate in $Candidates) {
    if (-not [string]::IsNullOrWhiteSpace($candidate)) {
      return $candidate
    }
  }

  return $null
}

$workspaceGuide = Join-Path $root 'apps\harmony\README.md'
$readinessGuide = Join-Path $root 'docs\harmony-development-readiness.md'
$repoNode = Find-FirstExistingPath @(
  (Join-Path $root '.tooling\node-v24.14.0-win-x64\node.exe')
)
$repoNodeHome = if ($repoNode) { Split-Path -Parent $repoNode } else { $null }

$nodeCommand = Get-CommandPath 'node'
$corepackCommand = Get-CommandPath 'corepack'
$javaCommand = Get-CommandPath 'java'
$ohpmCommand = Get-CommandPath 'ohpm'
$hdcCommand = Get-CommandPath 'hdc'

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

$javaHome = $env:JAVA_HOME
if (-not $javaHome) {
  $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'User')
}
if (-not $javaHome) {
  $javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
}
if ($javaHome -and -not (Test-Path $javaHome)) {
  $javaHome = $null
}

if (-not $ohpmCommand) {
  $ohpmCommand = Find-ToolUnderRoots 'ohpm.bat' @($commandLineToolsHome, $devEcoHome)
}

if (-not $hdcCommand) {
  $hdcCommand = Find-ToolUnderRoots 'hdc.exe' @($commandLineToolsHome, $devEcoHome)
}

Write-Host 'HarmonyOS readiness check'
Write-Host "Workspace root: $root"
Write-Host ''

$workspaceReady = (Test-Path $workspaceGuide) -and (Test-Path $readinessGuide)
Write-Check 'Repo readiness assets' $workspaceReady "Workspace guide: $workspaceGuide"
if (-not $workspaceReady) {
  $blockingIssues.Add('Harmony workspace docs are missing from the repo.')
}

$nodeVersion = if ($nodeCommand) {
  Get-FirstLine { node --version }
} elseif ($repoNode) {
  Get-FirstLine { & $repoNode --version }
} else {
  $null
}
$hasNode = [bool]($nodeCommand -or $repoNode)
Write-Check 'Node.js available' $hasNode (Resolve-Text @($nodeVersion, 'Install Node.js 20+ or use the bundled workspace Node runtime.'))
if (-not $hasNode) {
  $blockingIssues.Add('Node.js is required for workspace scripts and shared tooling.')
}
if (-not $env:NODE_HOME -and $repoNodeHome) {
  $env:NODE_HOME = $repoNodeHome
}
if ($repoNodeHome -and ($env:Path -notlike "*$repoNodeHome*")) {
  $env:Path = "$repoNodeHome;$env:Path"
}

$corepackVersion = if ($corepackCommand) { Get-FirstLine { corepack --version } } else { $null }
Write-Check 'corepack available' ([bool]$corepackCommand) (Resolve-Text @($corepackVersion, 'corepack is recommended for workspace package management.'))

$javaVersion = if ($javaCommand) { Get-FirstLine { java -version } } else { $null }
$hasJava = [bool]($javaCommand -or $javaHome)
Write-Check 'Java runtime available' $hasJava (Resolve-Text @($javaVersion, $javaHome, 'Set JAVA_HOME and make java available on PATH.'))
if (-not $hasJava) {
  $blockingIssues.Add('Java is required by DevEco Studio and HarmonyOS build tooling.')
}

$hasDevEco = [bool]$devEcoHome
Write-Check 'DevEco Studio detected' $hasDevEco (Resolve-Text @($devEcoHome, 'Install DevEco Studio from Huawei official downloads.'))
if (-not $hasDevEco) {
  $blockingIssues.Add('DevEco Studio was not found in common install locations.')
}

$hasHarmonyCli = [bool]($commandLineToolsHome -or $ohpmCommand)
Write-Check 'HarmonyOS command-line tools detected' $hasHarmonyCli (Resolve-Text @($commandLineToolsHome, $ohpmCommand, 'Install the HarmonyOS command-line tools or expose them on PATH.'))
if (-not $hasHarmonyCli) {
  $blockingIssues.Add('HarmonyOS command-line tools were not detected.')
}

$ohpmVersion = if ($ohpmCommand) { Get-FirstLine { & $ohpmCommand --version } } else { $null }
Write-Check 'ohpm available' ([bool]$ohpmCommand) (Resolve-Text @($ohpmVersion, 'ohpm is needed once the native Harmony project starts adding dependencies.'))

$hdcVersion = if ($hdcCommand) { Get-FirstLine { & $hdcCommand version } } else { $null }
Write-Check 'hdc available' ([bool]$hdcCommand) (Resolve-Text @($hdcVersion, 'Optional now, but recommended before device debugging starts.'))

Write-Check 'Huawei developer account review' $false 'Manual step: confirm Huawei account login and real-name verification before HarmonyOS NEXT preview and publishing flows.'

Write-Host ''
Write-Host 'Next repo guides:'
Write-Host " - $workspaceGuide"
Write-Host " - $readinessGuide"
Write-Host " - $(Join-Path $root 'docs\harmony-windows-setup.md')"
Write-Host " - $(Join-Path $root 'scripts\use-harmony-tools.ps1')"
Write-Host ''

if ($blockingIssues.Count -gt 0) {
  Write-Host 'Blocking issues:'
  foreach ($issue in $blockingIssues) {
    Write-Host " - $issue"
  }
  Write-Host ''
  Write-Host 'Tip: after installing DevEco Studio or Harmony command-line tools, open a new PowerShell session or dot-source:'
  Write-Host "  . $(Join-Path $root 'scripts\use-harmony-tools.ps1')"
  exit 1
}

Write-Host 'Environment looks ready for creating the native HarmonyOS project in apps/harmony.'
