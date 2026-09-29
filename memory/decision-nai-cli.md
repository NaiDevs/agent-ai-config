---
name: nai-cli-control-plane
description: "Nai CLI vive dentro de agent-ai-config y unifica Claude Code y Codex sin crear un IDE gráfico"
metadata:
  node_type: memory
  type: decision
---

# Nai CLI como control plane

## Decisión

Nai será únicamente CLI y vivirá en `agent-ai-config/nai-cli/`. No se creará un repositorio separado ni una aplicación Tauri.

## Responsabilidades

- Resolver proyectos desde `projects-registry.md`.
- Alternar entre Claude Code y Codex mediante lenguaje natural.
- Mantener un ID de sesión independiente por proveedor y proyecto.
- Crear un handoff verificable al cambiar de proveedor usando turnos recientes y estado git.
- Mostrar tokens, costo y contexto únicamente cuando el CLI nativo exponga esos datos.
- Reutilizar la autenticación nativa; Nai no guarda credenciales.

## Estado local

`~/.nai/state.json` guarda proveedor activo, IDs de sesión, métricas y hasta 20 turnos recientes por proyecto. No contiene secretos ni razonamiento interno de los modelos.

## Instalación

`setup.ps1` instala el paquete con npm y registra globalmente el comando `nai`. En Windows deshabilita solo el shim `nai.ps1` generado por npm para evitar conflictos con políticas de ejecución, conservando `nai.cmd`.
