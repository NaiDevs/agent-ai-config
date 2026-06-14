---
description: Crea epics, historias y tareas en Jira — asigna a ti misma o a cualquier persona en cualquier proyecto
---

# jira

Crea issues en Jira (epics, historias, tareas, subtareas) en lenguaje natural. Resuelve el proyecto desde el alias del registry y busca automáticamente el account ID del asignado.

## Uso

```
/jira crea un epic "Módulo de reportería avanzada" en yalo reporteria asignado a mí
/jira crea una historia "Como usuario quiero ver mis pagos del mes" en yalo pos api
/jira crea una tarea "Revisar endpoints de facturación" en yalo bo api asignada a Daniel
/jira crea una subtarea de YAL-123 "Agregar validación de RFC"
/jira crea un bug "Error 500 al generar factura" en yalo pos api asignado a mí
```

## Instrucciones

### Paso 1 — Parsear la instrucción

Extraer:
- **Tipo de issue**: epic / historia / tarea / subtarea / bug (error)
- **Título/Summary**: el texto entre comillas o después del nombre del tipo
- **Proyecto**: alias del registry (`yalo bo api`, `bodega ecommerce`, etc.) o nombre directo del proyecto Jira
- **Asignado**: "a mí" / "a [nombre]" / vacío (sin asignar)
- **Parent** (solo para subtareas): clave del issue padre (`YAL-123`)
- **Descripción**: si el usuario agrega contexto adicional, incluirla

### Paso 2 — Resolver el proyecto

Leer `~/.claude/projects-registry.md`, sección **Jira Projects**, y mapear el alias al Jira Key.

Ejemplos:
- `yalo bo api` → `YAL` (YALOCobro)
- `yalo vendo` → `YV` (YaloVendo)
- `yalo agendo` → `YALOAG` (YaloAgendo)
- `bodega *` → `LBO`
- `bi *` → `CBI`
- `cpa *` → `CC`
- `ult *` → `UL`
- `doctor *` → `ED`

Si el usuario menciona el nombre del proyecto Jira directamente ("en YALOCobro", "en LaBodega"), usar ese key directamente.
Si el proyecto no está en el registry: preguntar.

### Paso 3 — Resolver el asignado

**"a mí" / "asignado a mí":**
Usar directamente: `712020:8322cd00-7bcb-4a0a-bdfa-0d1e58bf4bd3` (Naidelyn)

**"a [nombre]":**
Usar `lookupJiraAccountId` con el nombre para obtener el account ID.
Si hay más de un resultado, mostrar opciones y preguntar cuál es.

**Sin asignado:**
Dejar el campo `assignee` vacío.

### Paso 4 — Confirmar antes de crear

Mostrar un resumen antes de crear:

```
Proyecto:  YAL (YALOCobro)
Tipo:      Epic
Título:    Módulo de reportería avanzada
Asignado:  Naidelyn Maldonado (tú)
Descripción: —

¿Creamos el issue? (s/editar/n)
```

### Paso 5 — Crear el issue

Llamar a `createJiraIssue` con:
- `cloudId`: `70102692-578c-4758-a88b-ffb5a3c535cb`
- `projectKey`: el key resuelto
- `summary`: el título
- `issueType`: el tipo en inglés → ver mapeo abajo
- `assignee`: el account ID (si aplica)
- `description`: (si se proporcionó)
- `parentKey`: (solo para subtareas)

**Mapeo de tipos (español → Jira):**
| Usuario dice | issueType en Jira |
|---|---|
| epic | Epic |
| historia / story | Historia |
| tarea | Tarea |
| subtarea | Subtarea |
| bug / error | Error |

### Paso 6 — Mostrar resultado

Mostrar la clave del issue creado y el link directo:
```
✓ Creado: YAL-847
  https://cithn.atlassian.net/browse/YAL-847
```

## Casos especiales

### Crear desde contexto de código
Si hay un proyecto git activo y el usuario no especifica proyecto, inferir el Jira Key desde el directorio actual usando el registry.

### Descripción automática para features grandes
Si el tipo es **epic** y el usuario da contexto ("es para refactorizar el módulo de pagos"), generar una descripción concisa en español que describa el objetivo y el alcance esperado.

### Sin proyecto especificado
Si no se menciona proyecto: preguntar "¿En qué proyecto Jira lo creo? (alias o nombre)"

### CITStuffs (CIT)
Usar solo si el usuario lo menciona explícitamente. No inferirlo para repos `nai *` automáticamente.
