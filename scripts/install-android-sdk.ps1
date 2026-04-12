$ErrorActionPreference = 'Stop'

$sdkRoot = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
$zipPath = Join-Path $env:TEMP 'commandlinetools-win-14742923_latest.zip'
$extractRoot = Join-Path $env:TEMP 'android-cmdline-tools'
$latestDir = Join-Path $sdkRoot 'cmdline-tools\latest'

Write-Host "Preparing Android SDK root at $sdkRoot"
New-Item -ItemType Directory -Force -Path $sdkRoot | Out-Null

if (Test-Path $extractRoot) {
  Remove-Item -Recurse -Force $extractRoot
}

if (Test-Path $latestDir) {
  Remove-Item -Recurse -Force $latestDir
}

Write-Host 'Downloading official Android command-line tools...'
Invoke-WebRequest -Uri 'https://dl.google.com/android/repository/commandlinetools-win-14742923_latest.zip' -OutFile $zipPath

Write-Host 'Extracting command-line tools...'
Expand-Archive -Path $zipPath -DestinationPath $extractRoot -Force

$sourceDir = if (Test-Path (Join-Path $extractRoot 'cmdline-tools\bin')) {
  Join-Path $extractRoot 'cmdline-tools'
} else {
  $extractRoot
}

New-Item -ItemType Directory -Force -Path $latestDir | Out-Null
Get-ChildItem -Path $sourceDir -Force | ForEach-Object {
  Move-Item -Path $_.FullName -Destination $latestDir -Force
}

[Environment]::SetEnvironmentVariable('ANDROID_HOME', $sdkRoot, 'User')
[Environment]::SetEnvironmentVariable('ANDROID_SDK_ROOT', $sdkRoot, 'User')

$javaHome = [Environment]::GetEnvironmentVariable('JAVA_HOME', 'Machine')
if (-not $javaHome) {
  throw 'JAVA_HOME was not found at machine scope.'
}

$env:JAVA_HOME = $javaHome
$env:ANDROID_HOME = $sdkRoot
$env:ANDROID_SDK_ROOT = $sdkRoot

$entries = @(
  (Join-Path $sdkRoot 'platform-tools'),
  (Join-Path $sdkRoot 'cmdline-tools\latest\bin')
)

$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
foreach ($entry in $entries) {
  if ($userPath -notlike "*$entry*") {
    if ([string]::IsNullOrWhiteSpace($userPath)) {
      $userPath = $entry
    } else {
      $userPath = "$userPath;$entry"
    }
  }
}
[Environment]::SetEnvironmentVariable('Path', $userPath, 'User')

$env:Path = "$($javaHome.TrimEnd('\'))\bin;" + ($entries -join ';') + ';' + $env:Path

$sdkManager = Join-Path $latestDir 'bin\sdkmanager.bat'
if (-not (Test-Path $sdkManager)) {
  throw "sdkmanager was not found at $sdkManager"
}

Write-Host 'Accepting Android SDK licenses...'
$yes = 1..30 | ForEach-Object { 'y' }
$yes | & $sdkManager --sdk_root=$sdkRoot --licenses | Out-Null

Write-Host 'Installing platform-tools into the Android SDK root...'
& $sdkManager --sdk_root=$sdkRoot 'platform-tools'

Write-Host ''
Write-Host "JAVA_HOME=$javaHome"
Write-Host "ANDROID_HOME=$sdkRoot"
Write-Host "ANDROID_SDK_ROOT=$sdkRoot"
Write-Host "SDKMANAGER=$sdkManager"
Write-Host "ADB_PATH=$(Join-Path $sdkRoot 'platform-tools\adb.exe')"
