---
name: changes-log
description: Log de commits y PRs realizados por proyecto — referencia rápida de qué se trabajó recientemente
metadata: 
  node_type: memory
  type: project
  originSessionId: baa97b0f-6550-4a98-92f2-501e6aea9d37
---

Registro cronológico de cambios. Cada entrada: `fecha | alias | tipo | descripción`.
Máximo 100 entradas — las más antiguas se eliminan cuando se supera ese límite.

<!-- formato: - YYYY-MM-DD | alias | commit/pr | descripción -->

- 2026-06-21 | engram | config | Integración de agente Engram en hook Stop — sincronización automática de sesiones
- 2026-06-21 | engram | bug-fix | Hooks no guardaban correctamente en Engram — agregado agente de persistencia
- 2026-06-21 | agent-ai-config | feat | Hook Stop completo: on-session-stop.ps1 + agent Engram + fix filtros PostToolUse sin 'if'
- 2026-06-21 | agent-ai-config | feat | setup.ps1 actualizado: despliega stop hook para Claude Code y Codex, CLAUDE.md sincronizado
- 2026-06-21 | agent-ai-config | feat | Engram agent hook: rutea a Clientes/ y Decisiones/ segun tipo de sesion (DECISION/BUG/CONFIG)
- 2026-06-21 | agent-ai-config | refactor | Elimina integracion Obsidian de hooks — Engram (changes-log.md) queda como unico sistema automatico
- 2026-06-21 | NAI | config | Configuración de agent Stop hook para Engram — sincronización de cambios con memoria de Obsidian
- 2026-06-21 | NAI | config | Engram detecta proyecto activo por rutas del transcript — escanea tool calls (Read/Write/Edit/Bash) para mapear a clientes
