# setup.ps1 — Instalar claude-config en este dispositivo
# Uso: .\setup.ps1
# Uso con path personalizado: .\setup.ps1 -ProjectsRoot "D:\MisProyectos"
param(
    [string]$ProjectsRoot = "$env:USERPROFILE\OneDrive\Documentos\Proyectos"
)

$ClaudeHome = "$env:USERPROFILE\.claude"
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$ErrorActionPreference = "Stop"

Write-Host "=== Instalando claude-config ===" -ForegroundColor Cyan
Write-Host "Usuario:       $env:USERNAME"
Write-Host "Claude home:   $ClaudeHome"
Write-Host "Proyectos:     $ProjectsRoot"
Write-Host ""

# 0. Leer mcp.env si existe y cargar variables de entorno del sistema
$EnvFile = "$ScriptDir\mcp.env"
if (Test-Path $EnvFile) {
    Write-Host "0. Cargando tokens desde mcp.env..." -ForegroundColor Yellow
    $loaded = 0
    Get-Content $EnvFile | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        if ($key -and $value -notmatch 'your_|_here$') {
            [System.Environment]::SetEnvironmentVariable($key, $value, "User")
            $loaded++
        }
    }
    Write-Host "   OK -> $loaded variable(s) cargadas como env vars del sistema" -ForegroundColor Green
} else {
    Write-Host "0. mcp.env no encontrado — copialo desde mcp.env.example y llena los valores" -ForegroundColor DarkYellow
    Write-Host "   cp $ScriptDir\mcp.env.example $ScriptDir\mcp.env"
    Write-Host ""
}


# 1. Comandos custom — instalar en commands/ (ubicación correcta de Claude Code)
Write-Host "1. Instalando comandos custom..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force "$ClaudeHome\commands" | Out-Null
Copy-Item "$ScriptDir\commands\*.md" "$ClaudeHome\commands\" -Force
Write-Host "   OK -> $((Get-ChildItem "$ScriptDir\commands\*.md").Count) comandos instalados en $ClaudeHome\commands\" -ForegroundColor Green

# Limpiar ~/.claude/skills/ si tiene archivos viejos (skills/ era la ubicación incorrecta)
$skillsPath = "$ClaudeHome\skills"
if (Test-Path $skillsPath) {
    $oldFiles = Get-ChildItem $skillsPath -ErrorAction SilentlyContinue
    if ($oldFiles.Count -gt 0) {
        $oldFiles | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   OK -> $($oldFiles.Count) archivo(s) eliminado(s) de skills/ (ubicación obsoleta)" -ForegroundColor DarkYellow
    }
}

# 2. CLAUDE.md global — reglas siempre activas + auto-activación de skills
Write-Host "2. Instalando CLAUDE.md global..." -ForegroundColor Yellow
Copy-Item "$ScriptDir\CLAUDE.md" "$ClaudeHome\CLAUDE.md" -Force
Write-Host "   OK -> $ClaudeHome\CLAUDE.md" -ForegroundColor Green

# 3. Registry editable
Write-Host "2. Copiando registry de proyectos..." -ForegroundColor Yellow
Copy-Item "$ScriptDir\projects-registry.md" "$ClaudeHome\projects-registry.md" -Force
Write-Host "   OK -> $ClaudeHome\projects-registry.md" -ForegroundColor Green
Write-Host "   (edita este archivo para cambiar aliases y workspaces)"

# 3. Detectar path de memoria de Claude Code
# Claude Code codifica el homepath: C:\Users\naide -> C--Users-naide
Write-Host "3. Detectando path de memoria..." -ForegroundColor Yellow
$HomePath = $env:USERPROFILE
$EncodedHome = $HomePath -replace "^([A-Za-z]):\\", '$1--' -replace "\\", "-"
$MemoryPath = "$ClaudeHome\projects\$EncodedHome\memory"
New-Item -ItemType Directory -Force $MemoryPath | Out-Null
Write-Host "   Path codificado: $EncodedHome"
Write-Host "   Memoria en:      $MemoryPath"

# 4. Copiar archivos de memoria
Write-Host "4. Instalando archivos de memoria..." -ForegroundColor Yellow
Copy-Item "$ScriptDir\memory\*.md" "$MemoryPath\" -Force
Write-Host "   OK -> $((Get-ChildItem "$ScriptDir\memory\*.md").Count) archivos copiados" -ForegroundColor Green

# 5. Actualizar MEMORY.md (sin duplicar entradas)
Write-Host "5. Actualizando MEMORY.md..." -ForegroundColor Yellow
$MemoryIndex = "$MemoryPath\MEMORY.md"
$NewEntries = @(
    "- [Proyectos YALO](projects-yalo.md) — 22 subproyectos POS/pagos, aliases ``yalo *``",
    "- [Proyectos La Bodega](projects-labodega.md) — 10 subproyectos ecommerce, aliases ``bodega *``",
    "- [Proyectos CORINSA](projects-corinsa.md) — 7 subproyectos BI/CPA, aliases ``corinsa *`` y ``cpa *``",
    "- [Proyectos Ultimate Labs](projects-ultimatelabs.md) — 6 subproyectos labs, aliases ``ult *``",
    "- [Proyectos EMSULA + NAI](projects-otros.md) — 12 subproyectos médicos y personales",
    "- [Workspaces](projects-workspaces.md) — Grupos de repos para trabajo simultáneo con git sync"
)

$existing = if (Test-Path $MemoryIndex) { Get-Content $MemoryIndex } else { @() }
$toAdd = $NewEntries | Where-Object { $existing -notcontains $_ }
if ($toAdd.Count -gt 0) {
    if (-not (Test-Path $MemoryIndex)) {
        "# Memory Index" | Set-Content $MemoryIndex -Encoding utf8
    }
    $toAdd -join "`n" | Add-Content $MemoryIndex -Encoding utf8
    Write-Host "   OK -> $($toAdd.Count) entradas agregadas a MEMORY.md" -ForegroundColor Green
} else {
    Write-Host "   OK -> MEMORY.md ya estaba actualizado" -ForegroundColor Green
}

# 6. MCPs locales — instalar paquetes npm
Write-Host "6. Instalando paquetes de MCPs locales..." -ForegroundColor Yellow
npm install -g @modelcontextprotocol/server-github @modelcontextprotocol/server-filesystem @modelcontextprotocol/server-memory mcp-server-postgres brave-search-mcp --silent 2>$null
Write-Host "   OK -> paquetes MCP instalados globalmente" -ForegroundColor Green

# 7. MCPs — agregar a settings.json
Write-Host "7. Configurando MCPs en settings.json..." -ForegroundColor Yellow
$SettingsPath = "$ClaudeHome\settings.json"
$username = $env:USERNAME
$proyectosPath = "C:/Users/$username/OneDrive/Documentos/Proyectos"
$claudePath    = "C:/Users/$username/.claude"

if (Test-Path $SettingsPath) {
    $settings = Get-Content $SettingsPath -Raw | ConvertFrom-Json
} else {
    $settings = [PSCustomObject]@{}
}

# Agregar permiso Write para settings.json si no existe
$writePermission = "Write($SettingsPath)"
if (-not ($settings.permissions.allow -contains $writePermission)) {
    $settings.permissions.allow += $writePermission
}

# Agregar mcpServers si no existe ya
if (-not $settings.PSObject.Properties['mcpServers']) {
    $settings | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([PSCustomObject]@{
        github          = [PSCustomObject]@{ command="npx"; args=@("-y","@modelcontextprotocol/server-github"); shell="powershell" }
        postgres        = [PSCustomObject]@{ command="npx"; args=@("-y","mcp-server-postgres"); shell="powershell" }
        filesystem      = [PSCustomObject]@{ command="npx"; args=@("-y","@modelcontextprotocol/server-filesystem",$proyectosPath,$claudePath); shell="powershell" }
        "brave-search"  = [PSCustomObject]@{ command="npx"; args=@("-y","brave-search-mcp"); shell="powershell" }
        memory          = [PSCustomObject]@{ command="npx"; args=@("-y","@modelcontextprotocol/server-memory"); shell="powershell" }
    }) -Force
    $settings | ConvertTo-Json -Depth 10 | Set-Content $SettingsPath -Encoding utf8
    Write-Host "   OK -> MCPs configurados en settings.json" -ForegroundColor Green
} else {
    Write-Host "   OK -> MCPs ya estaban configurados" -ForegroundColor Green
}

# 8. Hook de git fetch (mostrar fragmento para agregar manualmente)
Write-Host ""
Write-Host "8. Hook de git fetch (opcional)" -ForegroundColor Yellow
Write-Host "   Para tener info del remoto actualizada automaticamente, agrega esto"
Write-Host "   a $ClaudeHome\settings.json en la seccion 'hooks':"
Write-Host ""
Get-Content "$ScriptDir\settings-hook.json"
Write-Host ""

Write-Host "=== Instalacion completa ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Proximos pasos:"
Write-Host "  1. Configura variables de entorno para MCPs (ver mcp-secrets-guide.md):"
Write-Host "     GITHUB_PERSONAL_ACCESS_TOKEN, DATABASE_URL, BRAVE_API_KEY"
Write-Host "  2. Reinicia Claude Code"
Write-Host "  3. Usa /proyecto para ver todos los proyectos"
Write-Host "  4. Usa /proyecto yalo bo para activar un proyecto"
Write-Host "  5. Edita $ClaudeHome\projects-registry.md para personalizar aliases"
Write-Host ""
