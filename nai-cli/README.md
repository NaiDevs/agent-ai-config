# Nai CLI

Una sola terminal para trabajar con Claude Code o Codex sobre los proyectos definidos en `projects-registry.md`.

## Desarrollo

```powershell
npm install
npm test
npm link
```

En Windows, `setup.ps1` deshabilita únicamente el shim `nai.ps1` generado por npm cuando la política de ejecución lo bloquearía. PowerShell resuelve entonces `nai.cmd` al escribir `nai`.

## Uso

```powershell
nai "yalo console"
nai "yalo console" --claude
nai "yalo console" --codex
nai status
nai list
```

Dentro de la sesión se puede escribir `usá Claude`, `pasate a Codex`, `estado`, `proyectos` o una solicitud normal.

Para adjuntar imágenes, copialas y presioná `Ctrl+V`: Nai inserta un marcador como `[imagen 1]` directamente en el prompt. También podés arrastrar un archivo `.png`, `.jpg`, `.gif`, `.webp` o `.bmp`, escribir `imagen <ruta> [pedido]`, o usar `pegar imagen [pedido]`. Codex recibe el archivo como adjunto nativo y Claude lo abre desde su ruta local.

Nai reutiliza los inicios de sesión nativos de ambos CLI. Solo guarda IDs de sesión, métricas, turnos recientes y handoffs en `~/.nai/state.json`.
