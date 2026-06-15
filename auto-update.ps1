# auto-update.ps1 — Verifica si el repo tiene cambios remotos y actualiza
# Uso: .\auto-update.ps1 [-Tool claude|codex|both|auto]
param(
    [ValidateSet("auto","claude","codex","both")]
    [string]$Tool = "auto",
    [switch]$Silent   # suprimir output si no hay cambios
)

$repo      = "$env:USERPROFILE\OneDrive\Documentos\Proyectos\Nai\agent-ai-config"
$logFile   = "$repo\.last-update.log"

# Verificar que el repo existe
if (-not (Test-Path "$repo\.git")) {
    if (-not $Silent) { Write-Host "[agent-ai-config] Repo no encontrado en $repo" -ForegroundColor Yellow }
    exit 0
}

# Throttle: no verificar más de una vez cada 30 minutos en sesión
$lastCheck = if (Test-Path $logFile) { (Get-Item $logFile).LastWriteTime } else { [DateTime]::MinValue }
$minutosPasados = ([DateTime]::Now - $lastCheck).TotalMinutes
if ($minutosPasados -lt 30 -and -not $env:FORCE_UPDATE) {
    exit 0  # Ya se verificó hace menos de 30 min, salir silenciosamente
}

# Actualizar timestamp del último check
[DateTime]::Now.ToString() | Set-Content $logFile -Encoding utf8

# Fetch silencioso
git -C $repo fetch origin master --quiet 2>$null

# Contar commits por descargar
$behind = (git -C $repo rev-list "HEAD..origin/master" --count 2>$null).Trim()

if ([int]$behind -gt 0) {
    Write-Host ""
    Write-Host "╔══════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  agent-ai-config: $behind commit(s) nuevos   " -ForegroundColor Cyan
    Write-Host "║  Actualizando y re-instalando...         ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════╝" -ForegroundColor Cyan

    git -C $repo pull origin master --quiet

    # Correr setup para la herramienta indicada
    & "$repo\setup.ps1" -Tool $Tool

    Write-Host "✓ Actualización completada." -ForegroundColor Green
    Write-Host ""
} else {
    if (-not $Silent) {
        Write-Host "[agent-ai-config] Al día ✓" -ForegroundColor DarkGray
    }
}
