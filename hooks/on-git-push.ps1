# Hook PostToolUse: detecta un git commit exitoso y hace push si la rama es feat/* o fix/*
# Necesario en Codex porque su matcher no filtra por comando (corre tras cada Bash);
# por eso se dispara solo cuando el output del comando contiene la confirmacion de commit.
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

    # Solo continuar si el output trae un commit exitoso: patron "[branch hash] mensaje"
    if (-not [regex]::IsMatch($out, '\[([^\] ]+) [a-f0-9]{5,}\] ')) { exit 0 }

    # Directorio del repo desde -C "path" o cwd
    $cmd = if ($data.tool_input -is [string]) { [string]$data.tool_input } else { [string]$data.tool_input.command }
    $dir = $null
    if ($cmd -match '-C\s+"([^"]+)"') { $dir = $matches[1] }
    elseif ($cmd -match "-C\s+'([^']+)'") { $dir = $matches[1] }
    elseif ($cmd -match '-C\s+(\S+)') { $dir = $matches[1] }
    elseif ($data.cwd) { $dir = [string]$data.cwd }
    if (-not $dir -or -not (Test-Path $dir)) { exit 0 }

    $branch = (git -C $dir branch --show-current 2>$null)
    if ($branch -match '^(feat|fix)/') {
        git -C $dir push 2>$null
    }

} catch {
    exit 0
}

exit 0
