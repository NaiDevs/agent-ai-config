---
name: replicate
description: Replica o revisa implementaciones entre repos o workspaces — siempre pregunta qué hacer antes de actuar
---

# replicate

Skill para cross-repo workflows: replicar patrones/implementaciones de un repo a otro, o revisar cómo está hecho algo en uno o más repos.

**SIEMPRE arranca con preguntas — nunca asumas ni actúes antes de tener las respuestas.**

## Paso 1 — Preguntas obligatorias

Antes de hacer cualquier cosa, usar `AskUserQuestion` con estas preguntas:

**Pregunta 1 — ¿Qué querés hacer?**
- Opciones: "Replicar algo de un repo a otro" / "Revisar cómo está hecho algo" / "Comparar implementaciones entre repos"

**Pregunta 2 — ¿Qué exactamente?**
- Ejemplos: auth/JWT, Swagger, logging, patrón de servicio, repositorio, endpoint específico, estructura de proyecto, configuración, migración, cualquier otra cosa
- Campo libre — que el usuario lo describa con sus palabras

**Pregunta 3 — ¿En qué repo(s)?**
- Si es replicar: repo origen + repo destino (usar aliases del registry)
- Si es revisar: uno o más repos (puede ser un workspace completo)

Hacer las 3 preguntas en una sola llamada a `AskUserQuestion`.

## Paso 2 — Confirmar el plan

Con las respuestas, armar un plan en 2-3 líneas:
- Qué vas a leer
- Qué vas a comparar o aplicar
- Qué archivos se van a tocar (si aplica)

Mostrarlo y preguntar: **"¿Arrancamos?"** antes de ejecutar.

## Paso 3 — Ejecutar con subagentes paralelos

### Si es REPLICAR:
1. Lanzar dos subagentes Haiku en paralelo:
   - **Agente A** → lee el repo origen: busca los archivos relevantes para lo que se quiere replicar, extrae el patrón completo
   - **Agente B** → lee el repo destino: entiende la estructura actual, identifica dónde y cómo integrar el patrón
2. Con ambos resultados, sintetizar:
   - Qué hay en origen
   - Qué hay (o falta) en destino
   - Lista concreta de cambios a aplicar
3. Aplicar los cambios archivo por archivo, mostrando cada uno antes de escribir

### Si es REVISAR:
1. Lanzar un subagente Haiku por repo (en paralelo si son varios)
2. Cada agente busca los archivos relevantes y extrae el patrón/implementación
3. Presentar el resultado como resumen comparativo si son varios repos, o como explicación detallada si es uno solo

### Si es COMPARAR:
1. Subagentes en paralelo, uno por repo
2. Tabla comparativa al final: qué tiene cada uno, diferencias clave, cuál está más completo

## Paso 4 — Post-acción

Si se hicieron cambios: preguntar si hacer commit con `/commit`.
Si solo fue revisión: preguntar si hay algo que quiera replicar de lo que vio.

## Notas
- Usar aliases del `projects-registry.md` para resolver paths
- Subagentes leen con Haiku — no cargar diffs completos en el contexto principal
- Si el scope es muy amplio (workspace entero), acotar antes de ejecutar: preguntar qué parte del workspace importa más
