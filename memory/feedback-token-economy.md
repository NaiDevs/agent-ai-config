---
name: feedback-token-economy
description: "Rules for model selection and token efficiency — Haiku for git ops, Sonnet as default, Opus only with explicit approval"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: baa97b0f-6550-4a98-92f2-501e6aea9d37
---

Nunca usar Opus sin consultarlo primero con el usuario. Default es Sonnet para análisis, Haiku para operaciones simples.

**Why:** El usuario lo indicó explícitamente — Opus es costoso y debe reservarse solo para tareas SUPER complejas que no se pueden resolver con Sonnet.
**How to apply:** Antes de usar Opus en cualquier contexto (subagente, model override, recomendación), preguntar: "Esta tarea requeriría Opus, ¿lo usamos?"

## Tiering de modelos

| Tarea | Modelo |
|---|---|
| git log, status, fetch, grep | Haiku 4.5 |
| Leer y resumir diffs, output de comandos | Haiku 4.5 |
| Análisis de código, bugs, diseño | Sonnet 4.6 (default) |
| Tareas SUPER complejas | Opus — solo previa consulta |

## Reglas de contexto

- No leer archivos completos si solo se necesita git log o grep
- Usar subagentes Haiku para operaciones read-only (git, grep, status checks)
- Usar `/compact` al cambiar de proyecto o cliente para no arrastrar contexto viejo
- No expandir diffs completos a menos que se pida explícitamente
- Para workspace status (múltiples repos): subagentes Haiku paralelos, no cargar en contexto principal
