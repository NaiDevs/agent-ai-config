# contract-check.ps1
# Detecta contratos rotos entre DTOs de .NET y tipos/interfaces de Angular
#
# Uso:
#   .\contract-check.ps1 -Api "ruta/al/repo/dotnet" -Fe "ruta/al/repo/angular"
#   .\contract-check.ps1 -Api "C:\...\YaloPOSBackofficeAPI" -Fe "C:\...\YaloPOSBackoffice"
#
# Qué hace:
#   1. Escanea DTOs y Models en C# (public T Prop { get; set; })
#   2. Escanea interfaces y types en TypeScript (prop: type)
#   3. Cruza por nombre de clase/interface (normalizado)
#   4. Reporta propiedades que están en uno pero no en el otro

param(
    [Parameter(Mandatory)][string]$Api,
    [Parameter(Mandatory)][string]$Fe
)

function PascalToCamel([string]$s) {
    if (-not $s) { return $s }
    return $s.Substring(0,1).ToLower() + $s.Substring(1)
}

function CamelToPascal([string]$s) {
    if (-not $s) { return $s }
    return $s.Substring(0,1).ToUpper() + $s.Substring(1)
}

# Parsea un archivo .cs y extrae clases con sus propiedades publicas
function Parse-CSharpClass([string]$path) {
    $content = Get-Content $path -Raw -Encoding utf8
    $results = @{}

    $classMatches = [regex]::Matches($content, '(?:public\s+(?:class|record)\s+)(\w+)')
    foreach ($cm in $classMatches) {
        $className = $cm.Groups[1].Value
        # Ignorar clases genéricas de infraestructura
        if ($className -match 'Controller|Service|Repository|Context|DbSet|Migration|Startup|Program') { continue }

        $props = @()
        $propMatches = [regex]::Matches($content, 'public\s+[\w\?\[\]<>,\s]+\s+(\w+)\s*\{\s*get;')
        foreach ($pm in $propMatches) {
            $props += PascalToCamel $pm.Groups[1].Value
        }
        if ($props.Count -gt 0) {
            $results[$className] = $props
        }
    }
    return $results
}

# Parsea un archivo .ts y extrae interfaces/types con sus propiedades
function Parse-TypeScriptInterface([string]$path) {
    $content = Get-Content $path -Raw -Encoding utf8
    $results = @{}

    $ifMatches = [regex]::Matches($content, '(?:interface|type)\s+(\w+)(?:<[^>]+>)?\s*(?:extends[^{]+)?\{([^}]+)\}')
    foreach ($im in $ifMatches) {
        $ifName = $im.Groups[1].Value
        $body   = $im.Groups[2].Value

        $props = @()
        $propMatches = [regex]::Matches($body, '(\w+)\??:\s*[^;,\n]+')
        foreach ($pm in $propMatches) {
            $props += $pm.Groups[1].Value
        }
        if ($props.Count -gt 0) {
            $results[$ifName] = $props
        }
    }
    return $results
}

Write-Host ""
Write-Host "Contract Check" -ForegroundColor Cyan
Write-Host "  API: $Api" -ForegroundColor DarkGray
Write-Host "  FE:  $Fe" -ForegroundColor DarkGray
Write-Host ""

# Recolectar DTOs de C#
$apiModels = @{}
$csFiles = Get-ChildItem $Api -Recurse -Filter "*.cs" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "\\(obj|bin|Migrations|Tests)\\" }

foreach ($f in $csFiles) {
    $parsed = Parse-CSharpClass $f.FullName
    foreach ($key in $parsed.Keys) {
        $apiModels[$key] = $parsed[$key]
    }
}

# Recolectar interfaces de TypeScript
$feModels = @{}
$tsFiles = Get-ChildItem $Fe -Recurse -Include "*.ts","*.d.ts" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "\\(node_modules|dist|\.angular|spec)\\" }

foreach ($f in $tsFiles) {
    $parsed = Parse-TypeScriptInterface $f.FullName
    foreach ($key in $parsed.Keys) {
        $feModels[$key] = $parsed[$key]
    }
}

Write-Host "  C#  modelos encontrados: $($apiModels.Count)" -ForegroundColor DarkGray
Write-Host "  TS interfaces encontradas: $($feModels.Count)" -ForegroundColor DarkGray
Write-Host ""

# Cruzar por nombre (C# PascalCase ↔ TS PascalCase o camelCase)
$issues = @()
$matched = 0

foreach ($csName in $apiModels.Keys) {
    # Buscar match en TS: nombre igual, sin Dto/Model/Response sufijo, o camelCase
    $tsName = $feModels.Keys | Where-Object {
        $_ -eq $csName -or
        $_ -eq ($csName -replace 'Dto$|Model$|Response$|Request$','') -or
        $csName -eq ($_ -replace 'Dto$|Model$|Response$|Request$','') -or
        $_ -eq (PascalToCamel $csName)
    } | Select-Object -First 1

    if (-not $tsName) { continue }
    $matched++

    $csProps = $apiModels[$csName]
    $tsProps = $feModels[$tsName]

    # Props en C# que faltan en TS
    $missingInFe = $csProps | Where-Object { $_ -notin $tsProps -and (CamelToPascal $_) -notin $tsProps }
    # Props en TS que no existen en C#
    $extraInFe   = $tsProps | Where-Object { $_ -notin $csProps -and (CamelToPascal $_) -notin $csProps }

    if ($missingInFe -or $extraInFe) {
        $issues += [PSCustomObject]@{
            CSharp    = $csName
            TypeScript = $tsName
            MissingInFe = $missingInFe
            ExtraInFe   = $extraInFe
        }
    }
}

if ($matched -eq 0) {
    Write-Host "  No se encontraron modelos con nombres coincidentes entre ambos repos." -ForegroundColor Yellow
    Write-Host "  Tip: los nombres deben ser similares (ej. ClienteModel ↔ Cliente o ClienteModel)" -ForegroundColor DarkGray
    exit 0
}

Write-Host "  Modelos cruzados: $matched" -ForegroundColor DarkGray
Write-Host ""

if ($issues.Count -eq 0) {
    Write-Host "  CONTRATOS OK — sin discrepancias detectadas" -ForegroundColor Green
    exit 0
}

Write-Host "  DISCREPANCIAS ENCONTRADAS ($($issues.Count) modelos):" -ForegroundColor Red
Write-Host ""

foreach ($issue in $issues) {
    Write-Host "  $($issue.CSharp) (C#) ↔ $($issue.TypeScript) (TS)" -ForegroundColor Yellow

    if ($issue.MissingInFe) {
        Write-Host "    En API pero NO en FE:" -ForegroundColor Red
        $issue.MissingInFe | ForEach-Object { Write-Host "      - $_" -ForegroundColor Red }
    }
    if ($issue.ExtraInFe) {
        Write-Host "    En FE pero NO en API:" -ForegroundColor DarkYellow
        $issue.ExtraInFe | ForEach-Object { Write-Host "      + $_" -ForegroundColor DarkYellow }
    }
    Write-Host ""
}
