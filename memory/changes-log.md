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
