# Hook PostToolUse: detecta git commit y guarda en Engram (changes-log)
param()

try {
    $json = $input | Out-String
    if (-not $json) { exit 0 }

    $data = $json | ConvertFrom-Json -ErrorAction Stop

    $resp = $data.tool_response
    $out = ""
    if ($resp -is [string]) {
        $out = $resp
    } elseif ($null -ne $resp.stdout) {
        $out = [string]$resp.stdout
    } elseif ($null -ne $resp.output) {
        $out = [string]$resp.output
    } else {
        $out = $resp | ConvertTo-Json -Depth 5 -Compress
    }

    # Detectar commit exitoso: patrón "[branch hash] mensaje"
    $m = [regex]::Match($out, '\[([^\] ]+) [a-f0-9]{5,}\] (.+)')
    if (-not $m.Success) { exit 0 }

    $branch = $m.Groups[1].Value.Trim()
    $msg    = ($m.Groups[2].Value -split '\\n')[0].Trim()

    # Extraer nombre del proyecto desde -C "path" o cwd
    $cmd  = if ($data.tool_input -is [string]) { [string]$data.tool_input } else { [string]$data.tool_input.command }
    $proj = "proyecto"
    if ($cmd -match '-C\s+"([^"]+)"') { $proj = Split-Path $matches[1] -Leaf }
    elseif ($cmd -match "-C\s+'([^']+)'") { $proj = Split-Path $matches[1] -Leaf }
    elseif ($cmd -match '-C\s+(\S+)') { $proj = Split-Path $matches[1] -Leaf }
    elseif ($data.cwd) { $proj = Split-Path ([string]$data.cwd) -Leaf }

    $today      = Get-Date -Format "yyyy-MM-dd"
    $changesLog = "$env:USERPROFILE\.claude\projects\C--Users-naide\memory\changes-log.md"
    if (Test-Path $changesLog) {
        "- $today | $proj | commit | $msg ($branch)" | Add-Content $changesLog -Encoding utf8
    }

} catch {
    exit 0
}

exit 0
