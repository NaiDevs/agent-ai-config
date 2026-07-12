# scaffold-guard.ps1
# Protege entidades custom de EF Core scaffold (EF Power Tools o dotnet ef)
#
# Uso:
#   .\scaffold-guard.ps1 --pre   → backup de entidades modificadas antes de scaffold
#   .\scaffold-guard.ps1 --post  → restaura backups y muestra diff del scaffold
#
# Ejecutar desde la raiz del repo .NET

param(
    [switch]$Pre,
    [switch]$Post
)

$BackupDir = Join-Path $PSScriptRoot ".scaffold-backup"
$RepoRoot  = Get-Location

function Get-EntityFolders {
    # Carpetas típicas donde EF genera entidades
    @("DB", "Models", "Entities", "Data") | Where-Object { Test-Path (Join-Path $RepoRoot $_) }
}

if ($Pre) {
    Write-Host "Scaffold Guard — PRE" -ForegroundColor Cyan

    # Detectar archivos .cs con cambios locales en carpetas de entidades
    $entityFolders = Get-EntityFolders
    if (-not $entityFolders) {
        Write-Host "  No se encontraron carpetas de entidades (DB/, Models/, Entities/)" -ForegroundColor Yellow
        exit 0
    }

    $modified = @()
    foreach ($folder in $entityFolders) {
        $gitOut = git diff --name-only HEAD -- "$folder/**/*.cs" 2>$null
        if ($gitOut) { $modified += $gitOut }
        # También archivos untracked con cambios staged
        $staged = git diff --cached --name-only -- "$folder/**/*.cs" 2>$null
        if ($staged) { $modified += $staged }
    }

    $modified = $modified | Select-Object -Unique | Where-Object { Test-Path $_ }

    if (-not $modified) {
        Write-Host "  No hay entidades con cambios custom para proteger" -ForegroundColor DarkGray
        Write-Host "  Podés correr el scaffold con tranquilidad" -ForegroundColor Green
        exit 0
    }

    # Crear carpeta de backup
    if (Test-Path $BackupDir) { Remove-Item $BackupDir -Recurse -Force }
    New-Item -ItemType Directory -Force $BackupDir | Out-Null

    # Guardar lista de archivos y sus contenidos
    $manifest = @()
    foreach ($file in $modified) {
        $dest = Join-Path $BackupDir ($file -replace "[/\\]", "__")
        Copy-Item $file $dest -Force
        $manifest += $file
        Write-Host "  backup: $file" -ForegroundColor Green
    }

    $manifest | Set-Content (Join-Path $BackupDir "manifest.txt") -Encoding utf8
    Write-Host ""
    Write-Host "  $($modified.Count) archivo(s) protegidos en .scaffold-backup/" -ForegroundColor Cyan
    Write-Host "  Ahora corrí el scaffold en Rider/VS o con dotnet ef" -ForegroundColor Yellow
}

elseif ($Post) {
    Write-Host "Scaffold Guard — POST" -ForegroundColor Cyan

    $manifestPath = Join-Path $BackupDir "manifest.txt"
    if (-not (Test-Path $manifestPath)) {
        Write-Host "  No hay backup previo — corrí --pre primero" -ForegroundColor Red
        exit 1
    }

    $manifest = Get-Content $manifestPath

    foreach ($file in $manifest) {
        $backup = Join-Path $BackupDir ($file -replace "[/\\]", "__")
        if (Test-Path $backup) {
            Copy-Item $backup $file -Force
            Write-Host "  restaurado: $file" -ForegroundColor Green
        } else {
            Write-Host "  FALTA backup de: $file" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "  Archivos custom restaurados. Cambios del scaffold en otros archivos:" -ForegroundColor Cyan
    git diff --stat HEAD -- $(Get-EntityFolders | ForEach-Object { "$_/**/*.cs" }) 2>$null

    Write-Host ""
    Write-Host "  Revisá 'git diff' para ver qué entidades NUEVAS trajo el scaffold" -ForegroundColor Yellow

    # Limpiar backup
    Remove-Item $BackupDir -Recurse -Force
}

else {
    Write-Host "Uso:"
    Write-Host "  .\scaffold-guard.ps1 --pre    antes de correr el scaffold en Rider/VS"
    Write-Host "  .\scaffold-guard.ps1 --post   despues del scaffold para restaurar custom fields"
}
