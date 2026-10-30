param(
    [ValidateSet("claude", "codex", "both")]
    [string]$Tool = "both"
)

$pluginId = "yalo-datos-readonly@yalo-plugins"
$marketplaceName = "yalo-plugins"
$marketplaceSource = "Yalo-Technologies/YALO-PLUGINS"
$isWindowsHost = $env:OS -eq "Windows_NT"
$failed = $false

foreach ($target in @("claude", "codex")) {
    if ($Tool -ne "both" -and $Tool -ne $target) { continue }

    $commandName = if ($isWindowsHost) { "$target.cmd" } else { $target }
    $command = Get-Command $commandName -ErrorAction SilentlyContinue
    if (-not $command) {
        Write-Host "  ! $target no está disponible; YALO-PLUGINS no se instaló" -ForegroundColor Yellow
        $failed = $true
        continue
    }

    $installedJson = & $command.Source plugin list --json 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ! No se pudo consultar los plugins de $target" -ForegroundColor Yellow
        $failed = $true
        continue
    }
    $installed = $installedJson | ConvertFrom-Json
    $entry = if ($target -eq "claude") {
        @($installed) | Where-Object { $_.id -eq $pluginId } | Select-Object -First 1
    } else {
        @($installed.installed) | Where-Object { $_.pluginId -eq $pluginId } | Select-Object -First 1
    }
    if ($entry) {
        Write-Host "  OK → $pluginId ya está instalado en $target" -ForegroundColor Green
        continue
    }

    $marketplacesJson = & $command.Source plugin marketplace list --json 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ! No se pudo consultar marketplaces de $target" -ForegroundColor Yellow
        $failed = $true
        continue
    }
    $marketplaces = $marketplacesJson | ConvertFrom-Json
    $marketplaceEntries = if ($target -eq "claude") { @($marketplaces) } else { @($marketplaces.marketplaces) }
    if (-not (@($marketplaceEntries | Where-Object { $_.name -eq $marketplaceName }).Count)) {
        & $command.Source plugin marketplace add $marketplaceSource
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  ! No se pudo registrar YALO-PLUGINS en $target" -ForegroundColor Yellow
            $failed = $true
            continue
        }
    }

    if ($target -eq "claude") {
        & $command.Source plugin install $pluginId --scope user
    } else {
        & $command.Source plugin add $pluginId
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ! No se pudo instalar $pluginId en $target" -ForegroundColor Yellow
        $failed = $true
        continue
    }
    Write-Host "  OK → $pluginId instalado en $target" -ForegroundColor Green
}

if ($failed) { exit 1 }
