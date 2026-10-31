param([switch]$IncludeDebugUpgrade)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$project = Split-Path -Parent $PSScriptRoot
$signingDir = Join-Path $env:LOCALAPPDATA 'NaiMobileSigning'
$keystore = Join-Path $signingDir 'nai-mobile-release.p12'
$passwordFile = Join-Path $signingDir 'release-password.txt'
$lineage = Join-Path $signingDir 'debug-to-release.lineage'
$debugStore = Join-Path $env:USERPROFILE '.android\debug.keystore'
$keytool = 'C:\Program Files\Java\jdk-25\bin\keytool.exe'
$apksigner = Join-Path $env:LOCALAPPDATA 'Android\Sdk\build-tools\36.0.0\apksigner.bat'
$alias = 'nai-mobile-release'

if (-not (Test-Path -LiteralPath $keytool) -or -not (Test-Path -LiteralPath $apksigner)) {
    throw 'Faltan keytool o Android build-tools 36.0.0.'
}
if ($IncludeDebugUpgrade -and -not (Test-Path -LiteralPath $debugStore)) {
    throw 'Falta la clave debug original; no se puede preparar una actualizacion sin perder datos.'
}

New-Item -ItemType Directory -Path $signingDir -Force | Out-Null
$account = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls.exe $signingDir /inheritance:r /grant:r "${account}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'No se pudo restringir el directorio de firma.' }

$hasKey = Test-Path -LiteralPath $keystore
$hasPassword = Test-Path -LiteralPath $passwordFile
if ($hasKey -ne $hasPassword) {
    throw 'La clave y su contrasena local deben existir juntas. No se reemplazaron.'
}
if (-not $hasKey) {
    $bytes = [byte[]]::new(32)
    $random = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $random.GetBytes($bytes) } finally { $random.Dispose() }
    $generated = [Convert]::ToBase64String($bytes)
    Set-Content -LiteralPath $passwordFile -Value $generated -Encoding Ascii -NoNewline
    $env:NAI_ANDROID_RELEASE_STORE_PASSWORD = $generated
    & $keytool -genkeypair -alias $alias -keyalg RSA -keysize 3072 -validity 10000 `
        -dname 'CN=Nai Mobile, O=NaiDevs' -keystore $keystore -storetype PKCS12 `
        -storepass:env NAI_ANDROID_RELEASE_STORE_PASSWORD `
        -keypass:env NAI_ANDROID_RELEASE_STORE_PASSWORD -noprompt
    if ($LASTEXITCODE -ne 0) { throw 'No se pudo generar la clave de distribucion.' }
    $generated = $null
} else {
    $env:NAI_ANDROID_RELEASE_STORE_PASSWORD = (Get-Content -LiteralPath $passwordFile -Raw).Trim()
}

try {
    $env:NAI_ANDROID_RELEASE_STORE_FILE = $keystore
    $env:NAI_ANDROID_RELEASE_KEY_PASSWORD = $env:NAI_ANDROID_RELEASE_STORE_PASSWORD
    if ($IncludeDebugUpgrade) { $env:NAI_ANDROID_DEBUG_STORE_PASSWORD = 'android' }

    if ($IncludeDebugUpgrade -and -not (Test-Path -LiteralPath $lineage)) {
        & $apksigner rotate --out $lineage --old-signer --ks $debugStore `
            --ks-key-alias androiddebugkey --ks-pass env:NAI_ANDROID_DEBUG_STORE_PASSWORD `
            --new-signer --ks $keystore --ks-key-alias $alias `
            --ks-pass env:NAI_ANDROID_RELEASE_STORE_PASSWORD
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo crear la transicion de firma.' }
    }

    Push-Location $project
    try {
        & flutter build apk --release
        if ($LASTEXITCODE -ne 0) { throw 'Fallo la compilacion release.' }
    } finally { Pop-Location }

    $versionMatch = [regex]::Match((Get-Content -LiteralPath (Join-Path $project 'pubspec.yaml') -Raw),
        '(?m)^version:\s*([0-9A-Za-z.+-]+)\s*$')
    if (-not $versionMatch.Success) { throw 'Version de pubspec.yaml invalida.' }
    $version = $versionMatch.Groups[1].Value
    $outputDir = Join-Path $project 'build\release'
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    $builtApk = Join-Path $project 'build\app\outputs\flutter-apk\app-release.apk'
    $plainApk = Join-Path $outputDir "nai-mobile-$version.apk"
    $upgradeApk = Join-Path $outputDir "nai-mobile-$version-upgrade-debug.apk"
    Copy-Item -LiteralPath $builtApk -Destination $plainApk -Force

    & $apksigner verify --min-sdk-version 24 $plainApk
    if ($LASTEXITCODE -ne 0) { throw 'Firma release invalida.' }
    Write-Output "APK de distribucion: $plainApk"

    if ($IncludeDebugUpgrade) {
        & $apksigner sign --ks $debugStore --ks-key-alias androiddebugkey `
            --ks-pass env:NAI_ANDROID_DEBUG_STORE_PASSWORD --next-signer `
            --ks $keystore --ks-key-alias $alias `
            --ks-pass env:NAI_ANDROID_RELEASE_STORE_PASSWORD --lineage $lineage `
            --out $upgradeApk $plainApk
        if ($LASTEXITCODE -ne 0) { throw 'No se pudo firmar el APK de transicion.' }
        & $apksigner verify --min-sdk-version 24 $upgradeApk
        if ($LASTEXITCODE -ne 0) { throw 'Firma de transicion invalida.' }
        Write-Output "APK de transicion para el Samsung: $upgradeApk"
    }
    Write-Output "Clave local y contrasena: $signingDir (no subir a Git)"
} finally {
    Remove-Item Env:NAI_ANDROID_RELEASE_STORE_FILE -ErrorAction SilentlyContinue
    Remove-Item Env:NAI_ANDROID_RELEASE_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:NAI_ANDROID_RELEASE_KEY_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:NAI_ANDROID_DEBUG_STORE_PASSWORD -ErrorAction SilentlyContinue
}
