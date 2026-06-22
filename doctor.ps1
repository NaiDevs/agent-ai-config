# doctor.ps1 — Valida que la instalacion de agent-ai-config este correcta
# Uso: .\doctor.ps1
# Uso: .\doctor.ps1 -Tool claude   (solo Claude Code)
# Uso: .\doctor.ps1 -Tool codex    (solo Codex)

param(
    [ValidateSet("","claude","codex","both")]
    [string]$Tool = ""
)

$IsWin    = ($env:OS -eq "Windows_NT") -or ($PSVersionTable.Platform -eq "Win32NT") -or (-not $PSVersionTable.Platform)
$HomeDir  = if ($IsWin) { $env:USERPROFILE } else { $HOME }
$ClaudeHome = if ($IsWin) { "$HomeDir\.claude" } else { "$HomeDir/.claude" }
$CodexHome  = if ($IsWin) { "$HomeDir\.codex"  } else { "$HomeDir/.codex"  }
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path

$ok   = 0
$warn = 0
$err  = 0

function ok($msg)   { Write-Host "  [OK]    $msg" -ForegroundColor Green;  $script:ok++   }
function warn($msg) { Write-Host "  [WARN]  $msg" -ForegroundColor Yellow; $script:warn++ }
function err($msg)  { Write-Host "  [ERROR] $msg" -ForegroundColor Red;    $script:err++  }

Write-Host ""
Write-Host "╔═══════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     agent-ai-config — Doctor          ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# ─── Herramientas del sistema ────────────────────────────────────────────────
Write-Host "[ Sistema ]" -ForegroundColor Blue

if (Get-Command git -ErrorAction SilentlyContinue) {
    ok "git $(git --version 2>$null)"
} else {
    err "git — no encontrado. Instala desde https://git-scm.com"
}

if (Get-Command node -ErrorAction SilentlyContinue) {
    ok "Node.js $(node --version 2>$null)"
} else {
    err "Node.js — no encontrado. Instala desde https://nodejs.org"
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
    ok "npm $(npm --version 2>$null)"
} else {
    err "npm — no encontrado"
}

if (Get-Command pwsh -ErrorAction SilentlyContinue) {
    ok "PowerShell 7 $(pwsh --version 2>$null)"
} else {
    warn "PowerShell 7 (pwsh) — no encontrado. Los hooks en Mac/Linux no funcionaran sin el."
}

Write-Host ""

# ─── Herramientas de AI ──────────────────────────────────────────────────────
Write-Host "[ Herramientas AI ]" -ForegroundColor Blue

$hasClaude = [bool](Get-Command claude -ErrorAction SilentlyContinue)
$hasCodex  = [bool](Get-Command codex  -ErrorAction SilentlyContinue)

if ($hasClaude) { ok "Claude Code $(claude --version 2>$null)" }
else            { warn "Claude Code — no encontrado" }

if ($hasCodex)  { ok "Codex $(codex --version 2>$null)" }
else            { warn "Codex — no encontrado" }

if ($Tool -eq "") {
    if ($hasClaude -and $hasCodex) { $Tool = "both" }
    elseif ($hasClaude)            { $Tool = "claude" }
    elseif ($hasCodex)             { $Tool = "codex" }
    else                           { $Tool = "both" }
}

$checkClaude = ($Tool -eq "claude" -or $Tool -eq "both")
$checkCodex  = ($Tool -eq "codex"  -or $Tool -eq "both")

Write-Host ""

# ─── Configuracion del repo ──────────────────────────────────────────────────
Write-Host "[ Repo ]" -ForegroundColor Blue

if (Test-Path "$ScriptDir\mcp.env") {
    ok "mcp.env existe"
    # Verificar que tenga al menos una variable activa (sin exponer valores)
    $envContent = Get-Content "$ScriptDir\mcp.env" | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
    if ($envContent.Count -gt 0) {
        ok "$($envContent.Count) variable(s) activa(s) en mcp.env"
    } else {
        warn "mcp.env existe pero no tiene variables activas. Copia mcp.env.example y configura los valores."
    }
} else {
    warn "mcp.env no encontrado — copia mcp.env.example y llena los valores."
}

$ghToken = [System.Environment]::GetEnvironmentVariable("GITHUB_PERSONAL_ACCESS_TOKEN", "User")
if ($ghToken) {
    ok "GITHUB_PERSONAL_ACCESS_TOKEN configurada (oculto)"
} else {
    warn "GITHUB_PERSONAL_ACCESS_TOKEN no configurada. El MCP de GitHub no funcionara."
}

Write-Host ""

# ─── Claude Code ─────────────────────────────────────────────────────────────
if ($checkClaude) {
    Write-Host "[ Claude Code (~/.claude/) ]" -ForegroundColor Blue

    if (Test-Path "$ClaudeHome\CLAUDE.md") {
        ok "CLAUDE.md"
    } else {
        err "CLAUDE.md — falta en $ClaudeHome. Corre setup.ps1."
    }

    if (Test-Path "$ClaudeHome\commands") {
        $cmdCount = (Get-ChildItem "$ClaudeHome\commands\*.md" -ErrorAction SilentlyContinue).Count
        if ($cmdCount -gt 0) { ok "$cmdCount commands instalados" }
        else                 { warn "~/.claude/commands existe pero esta vacio" }
    } else {
        err "~/.claude/commands — no encontrado. Corre setup.ps1."
    }

    if (Test-Path "$ClaudeHome\settings.json") {
        try {
            Get-Content "$ClaudeHome\settings.json" -Raw | ConvertFrom-Json | Out-Null
            ok "settings.json valido (JSON sintaxis OK)"
        } catch {
            err "settings.json — JSON invalido. Revisa el archivo."
        }
    } else {
        warn "settings.json — no encontrado"
    }

    if (Test-Path "$ClaudeHome\projects-registry.md") {
        ok "projects-registry.md"
    } else {
        warn "projects-registry.md — no encontrado"
    }

    $EncodedHome = $HomeDir -replace "^([A-Za-z]):\\", '$1--' -replace "\\", "-"
    $MemPath = "$ClaudeHome\projects\$EncodedHome\memory"
    if (Test-Path $MemPath) {
        $memCount = (Get-ChildItem "$MemPath\*.md" -ErrorAction SilentlyContinue).Count
        ok "Memoria Engram — $memCount archivos en $MemPath"
    } else {
        warn "Memoria Engram — carpeta no encontrada en $MemPath"
    }

    if (Test-Path "$ClaudeHome\hooks\on-git-commit.ps1") {
        ok "Hook on-git-commit.ps1"
    } else {
        warn "Hook on-git-commit.ps1 — no encontrado en ~/.claude/hooks/"
    }

    Write-Host ""
}

# ─── Codex ────────────────────────────────────────────────────────────────────
if ($checkCodex) {
    Write-Host "[ Codex (~/.codex/) ]" -ForegroundColor Blue

    if (Test-Path "$CodexHome\config.toml") {
        $tomlRaw = Get-Content "$CodexHome\config.toml" -Raw -ErrorAction SilentlyContinue
        if ($tomlRaw -match '\[mcp_servers\.' ) {
            ok "config.toml con MCPs configurados"
        } else {
            warn "config.toml existe pero no tiene MCPs. Corre setup.ps1."
        }
    } else {
        warn "config.toml — no encontrado en ~/.codex/"
    }

    if (Test-Path "$CodexHome\skills") {
        $skillCount = (Get-ChildItem "$CodexHome\skills" -Directory -ErrorAction SilentlyContinue).Count
        if ($skillCount -gt 0) { ok "$skillCount skills instalados" }
        else                   { warn "~/.codex/skills existe pero esta vacio" }
    } else {
        warn "~/.codex/skills — no encontrado"
    }

    if (Test-Path "$CodexHome\engram-instructions.md") {
        ok "engram-instructions.md"
    } else {
        warn "engram-instructions.md — no encontrado en ~/.codex/"
    }

    if (Test-Path "$CodexHome\projects-registry.md") {
        ok "projects-registry.md"
    } else {
        warn "projects-registry.md — no encontrado en ~/.codex/"
    }

    Write-Host ""
}

# ─── Engram ───────────────────────────────────────────────────────────────────
Write-Host "[ Engram ]" -ForegroundColor Blue

if (Get-Command engram -ErrorAction SilentlyContinue) {
    ok "engram $(engram --version 2>$null)"
} else {
    warn "engram — no encontrado. La memoria MCP no estara disponible. El sistema funciona igual con archivos."
}

Write-Host ""

# ─── MCPs locales ─────────────────────────────────────────────────────────────
Write-Host "[ MCPs locales ]" -ForegroundColor Blue

# Playwright — MCP para automatizacion de browser y pruebas UI
if (Get-Command playwright -ErrorAction SilentlyContinue) {
    ok "playwright CLI instalado"
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    warn "playwright CLI no encontrado. El MCP @playwright/mcp usa npx, deberia funcionar igual."
} else {
    warn "playwright — npx no disponible. El MCP de Playwright no podra iniciarse."
}

# Codex — verificar Playwright en config.toml
if ($checkCodex -and (Test-Path "$CodexHome\config.toml")) {
    $tomlRaw = Get-Content "$CodexHome\config.toml" -Raw -ErrorAction SilentlyContinue
    if ($tomlRaw -match '\[mcp_servers\.playwright\]') {
        ok "Playwright MCP configurado en Codex"
    } else {
        warn "Playwright MCP no esta en ~/.codex/config.toml. Corre setup.ps1."
    }
}

# Redis — verificar si hay variables configuradas
$redisVars = [System.Environment]::GetEnvironmentVariables("User").Keys | Where-Object { $_ -match '_REDIS$' }
if ($redisVars) {
    ok "$(@($redisVars).Count) variable(s) Redis configuradas ($(@($redisVars) -join ', '))"
    # Verificar MCPs Redis en Codex
    if ($checkCodex -and (Test-Path "$CodexHome\config.toml")) {
        $tomlRaw = Get-Content "$CodexHome\config.toml" -Raw -ErrorAction SilentlyContinue
        if ($tomlRaw -match '\[mcp_servers\.redis-') {
            ok "MCP(s) Redis configurados en Codex"
        } else {
            warn "Hay variables Redis pero no hay MCPs redis-* en config.toml. Corre setup.ps1."
        }
    }
    # Verificar MCPs Redis en Claude Code mcp.json
    if ($checkClaude -and (Test-Path "$ClaudeHome\mcp.json")) {
        $mcpJson = Get-Content "$ClaudeHome\mcp.json" -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json -ErrorAction SilentlyContinue
        if ($mcpJson -and ($mcpJson.mcpServers.PSObject.Properties.Name | Where-Object { $_ -match '^redis-' })) {
            ok "MCP(s) Redis configurados en Claude Code (mcp.json)"
        } else {
            warn "Hay variables Redis pero no hay MCPs redis-* en ~/.claude/mcp.json. Corre setup.ps1."
        }
    }
} else {
    warn "No hay variables *_REDIS en env. Si usas Redis, agrega NOMBRE_REDIS en mcp.env."
}

# Docker — informativo
if (Get-Command docker -ErrorAction SilentlyContinue) {
    $dockerInfo = docker --version 2>$null
    ok "Docker disponible — $dockerInfo"
    warn "MCP de Docker no se auto-instala. Documentado en README si lo necesitas."
} else {
    warn "Docker no encontrado. Si lo usas, instala Docker Desktop."
}

# Firebase Admin — informativo
$fbProjectId = [System.Environment]::GetEnvironmentVariable("FIREBASE_PROJECT_ID", "User")
if ($fbProjectId) {
    ok "FIREBASE_PROJECT_ID configurada (oculto)"
    $fbEmail = [System.Environment]::GetEnvironmentVariable("FIREBASE_CLIENT_EMAIL", "User")
    $fbKey   = [System.Environment]::GetEnvironmentVariable("FIREBASE_PRIVATE_KEY",  "User")
    if (-not $fbEmail -or -not $fbKey) {
        warn "Firebase: FIREBASE_CLIENT_EMAIL o FIREBASE_PRIVATE_KEY faltantes — MCP no funcionara."
    }
} else {
    warn "FIREBASE_PROJECT_ID no configurada. Si usas Firebase Admin/FCM, agrega las vars en mcp.env."
}

# AWS — informativo
$awsKey = [System.Environment]::GetEnvironmentVariable("AWS_ACCESS_KEY_ID", "User")
if ($awsKey) {
    ok "AWS_ACCESS_KEY_ID configurada (oculto)"
} else {
    warn "AWS_ACCESS_KEY_ID no configurada. Si usas AWS (Secrets Manager, S3, SES), agrega las vars en mcp.env."
}

# Azure — informativo
$azTenant = [System.Environment]::GetEnvironmentVariable("AZURE_TENANT_ID", "User")
if ($azTenant) {
    ok "AZURE_TENANT_ID configurada (oculto)"
} else {
    warn "AZURE_TENANT_ID no configurada. Si usas Azure AD u otros servicios Azure, agrega las vars en mcp.env."
}

Write-Host ""

# ─── Resumen ──────────────────────────────────────────────────────────────────
$total = $ok + $warn + $err
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host "  Resultado: $ok OK  |  $warn WARN  |  $err ERROR  (de $total checks)" -ForegroundColor $(if ($err -gt 0) { "Red" } elseif ($warn -gt 0) { "Yellow" } else { "Green" })
Write-Host ""

if ($err -gt 0) {
    Write-Host "  Hay errores criticos. Corre .\setup.ps1 para resolverlos." -ForegroundColor Red
} elseif ($warn -gt 0) {
    Write-Host "  Hay advertencias. Revisa las indicadas arriba." -ForegroundColor Yellow
} else {
    Write-Host "  Todo OK. La instalacion parece correcta." -ForegroundColor Green
}
Write-Host ""
