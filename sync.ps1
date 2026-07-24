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
            # Pre-check: no commitear secretos (esto es lo que trababa el push en silencio)
            $scanFiles = @(Join-Path $ScriptDir "projects-registry.md")
            $scanFiles += (Get-ChildItem "$ScriptDir\memory\*.md" -ErrorAction SilentlyContinue | ForEach-Object { $_.FullName })
            $secretPatterns = @('AKIA[0-9A-Z]{16}', 'ghp_[0-9A-Za-z]{36}', 'xox[baprs]-[0-9A-Za-z-]+', '-----BEGIN [A-Z ]*PRIVATE KEY-----')
            $hits = @()
            foreach ($f in $scanFiles) {
                if (Test-Path $f) {
                    $m = Select-String -Path $f -Pattern $secretPatterns -ErrorAction SilentlyContinue
                    if ($m) { $hits += $m }
                }
            }
            if ($hits.Count -gt 0) {
                $where = (($hits | ForEach-Object { "$([System.IO.Path]::GetFileName($_.Path)):$($_.LineNumber)" }) | Select-Object -Unique) -join ', '
                $warn  = "sync ABORTADO: posible secreto en $where. Enmascaralo antes de sincronizar."
                Add-Content "$ScriptDir\.sync-errors.log" "$(Get-Date -Format 'u') | $warn" -Encoding utf8
                Write-Host "  x $warn" -ForegroundColor Red
                Write-Output (@{ systemMessage = "[agent-ai-config] $warn" } | ConvertTo-Json -Compress)
                exit 0
            }

            git -C $ScriptDir add "projects-registry.md" "memory/*.md" 2>$null
            $date = Get-Date -Format "yyyy-MM-dd HH:mm"
            git -C $ScriptDir commit -m "sync: actualiza config local [$date]" --quiet 2>$null

            # Push CON visibilidad de error (antes se tragaba con --quiet 2>$null y acumulaba commits)
            $pushOut = git -C $ScriptDir push origin master 2>&1
            if ($LASTEXITCODE -ne 0) {
                $msg = "sync: PUSH FALLO (exit $LASTEXITCODE) - hay commits locales sin subir. $($pushOut -join ' ')"
                Add-Content "$ScriptDir\.sync-errors.log" "$(Get-Date -Format 'u') | $msg" -Encoding utf8
                Write-Host "  x $msg" -ForegroundColor Red
                Write-Output (@{ systemMessage = "[agent-ai-config] $msg" } | ConvertTo-Json -Compress)
            } elseif (-not $Silent) {
                Write-Host "  OK - Cambios pusheados a GitHub" -ForegroundColor Cyan
            }
        }
    } elseif (-not $Silent) {
        Write-Host "  sync: sin cambios locales" -ForegroundColor DarkGray
    }

} catch {
    if ($ScriptDir) { Add-Content "$ScriptDir\.sync-errors.log" "$(Get-Date -Format 'u') | sync EXCEPCION: $($_.Exception.Message)" -Encoding utf8 }
    exit 0
}

exit 0
