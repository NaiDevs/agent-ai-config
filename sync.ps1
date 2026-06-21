# sync.ps1 - Sincroniza cambios locales de vuelta al repo agent-config
# Copia projects-registry.md y memoria de vuelta al repo y hace push automatico
# Se ejecuta automaticamente al cerrar sesion (Stop hook) y en el task diario
param(
    [switch]$Silent
)

try {
    $IsWin   = ($env:OS -eq "Windows_NT") -or (-not $PSVersionTable.Platform)
    $HomeDir = if ($IsWin) { $env:USERPROFILE } else { $HOME }
    $ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ClaudeHome = if ($IsWin) { "$HomeDir\.claude" } else { "$HomeDir/.claude" }

    if (-not (Test-Path "$ScriptDir\.git")) { exit 0 }

    # Resolver path de memoria (mismo encoding que setup.ps1)
    if ($IsWin) {
        $EncodedHome = $env:USERPROFILE -replace "^([A-Za-z]):\\", '$1--' -replace "\\", "-"
    } else {
        $EncodedHome = $HOME -replace "^/", "" -replace "/", "-"
    }
    $LiveMemory = Join-Path (Join-Path $ClaudeHome "projects") "$EncodedHome\memory"

    $changed = $false

    # Sincronizar projects-registry.md
    $liveReg = Join-Path $ClaudeHome "projects-registry.md"
    $repoReg = Join-Path $ScriptDir "projects-registry.md"
    if ((Test-Path $liveReg) -and (Test-Path $repoReg)) {
        $liveHash = (Get-FileHash $liveReg -Algorithm MD5).Hash
        $repoHash = (Get-FileHash $repoReg -Algorithm MD5).Hash
        if ($liveHash -ne $repoHash) {
            Copy-Item $liveReg $repoReg -Force
            if (-not $Silent) { Write-Host "  >> projects-registry.md sincronizado" -ForegroundColor Green }
            $changed = $true
        }
    }

    # Sincronizar archivos de memoria
    $repoMemory = Join-Path $ScriptDir "memory"
    if ((Test-Path $LiveMemory) -and (Test-Path $repoMemory)) {
        Get-ChildItem "$LiveMemory\*.md" -ErrorAction SilentlyContinue | ForEach-Object {
            $dest = Join-Path $repoMemory $_.Name
            if (Test-Path $dest) {
                $srcHash  = (Get-FileHash $_.FullName -Algorithm MD5).Hash
                $destHash = (Get-FileHash $dest -Algorithm MD5).Hash
                if ($srcHash -ne $destHash) {
                    Copy-Item $_.FullName $dest -Force
                    if (-not $Silent) { Write-Host "  >> memory/$($_.Name) sincronizado" -ForegroundColor Green }
                    $changed = $true
                }
            }
        }
    }

    # Commit + push si hubo cambios
    if ($changed) {
        $gitOut = git -C $ScriptDir status --porcelain 2>$null
        if ($gitOut) {
            git -C $ScriptDir add "projects-registry.md" "memory/*.md" 2>$null
            $date = Get-Date -Format "yyyy-MM-dd HH:mm"
            git -C $ScriptDir commit -m "sync: actualiza config local [$date]" --quiet 2>$null
            git -C $ScriptDir push origin master --quiet 2>$null
            if (-not $Silent) { Write-Host "  OK - Cambios pusheados a GitHub" -ForegroundColor Cyan }
        }
    } elseif (-not $Silent) {
        Write-Host "  sync: sin cambios locales" -ForegroundColor DarkGray
    }

} catch {
    exit 0
}

exit 0
