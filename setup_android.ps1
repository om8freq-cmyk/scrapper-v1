$sdkDir = "D:\ScRaPpEr\android-sdk"
$zipPath = "D:\ScRaPpEr\cmdline-tools.zip"

if (-not (Test-Path $sdkDir)) {
    New-Item -ItemType Directory -Path $sdkDir | Out-Null
}

# Download Android SDK command line tools if not present
if (-not (Test-Path $zipPath)) {
    Write-Host "Downloading Android SDK Command Line Tools..."
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip" -OutFile $zipPath
}

# Extract command line tools
$toolsExtractPath = "$sdkDir\cmdline-tools-temp"
if (-not (Test-Path "$sdkDir\cmdline-tools\latest")) {
    Write-Host "Extracting Command Line Tools..."
    if (Test-Path $toolsExtractPath) { Remove-Item -Recurse -Force $toolsExtractPath }
    Expand-Archive -Path $zipPath -DestinationPath $toolsExtractPath
    
    # Structure correctly: android-sdk/cmdline-tools/latest/
    New-Item -ItemType Directory -Path "$sdkDir\cmdline-tools" -Force | Out-Null
    Move-Item -Path "$toolsExtractPath\cmdline-tools" -Destination "$sdkDir\cmdline-tools\latest"
    Remove-Item -Recurse -Force $toolsExtractPath
}

Write-Host "Setting local.properties..."
$localPropertiesPath = "D:\ScRaPpEr\frontend\android\local.properties"
$sdkPathEscaped = $sdkDir.Replace('\', '\\')
"sdk.dir=$sdkPathEscaped" | Out-File -FilePath $localPropertiesPath -Encoding ascii

Write-Host "Accepting licenses..."
$env:ANDROID_HOME = $sdkDir
$sdkmanager = "$sdkDir\cmdline-tools\latest\bin\sdkmanager.bat"

# Run sdkmanager to accept licenses automatically
$yesList = @("y") * 30
$yesList | &$sdkmanager --licenses --sdk_root=$sdkDir | Out-Null

Write-Host "Installing Platform Tools..."
&$sdkmanager "platform-tools" --sdk_root=$sdkDir | Out-Null

Write-Host "Installing Platforms and Build Tools for Android 34..."
&$sdkmanager "platforms;android-34" "build-tools;34.0.0" --sdk_root=$sdkDir | Out-Null

Write-Host "Android SDK configured successfully!"
