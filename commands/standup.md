---
description: Standup diario a tu DM de Slack — Hecho (commits de hoy) + En progreso/Próximo (Jira) + Blockers. Acepta alcance por proyecto.
---

# standup

Arma un standup del día y lo manda a tu propio DM de Slack. Reúne lo hecho (commits de hoy), lo que está en progreso y lo próximo (Jira), y te pregunta los blockers.

## Uso

```
/standup                     → todos los clientes
/standup yalo                → solo YALO
/standup yalo bodega corinsa → solo esos
/standup yalo preview        → arma sin enviar (dry-run)
/standup preview             → todos, sin enviar
```

## Config

```
STANDUP_DESTINO = "self-dm"   # DM propio en Slack. Cambiar solo si querés otro destino.
```

## Comportamiento

### Modelo
Subagentes **Haiku** para los barridos git. El agente principal ensambla, consulta Jira y manda a Slack.

### Paso 0 — Resolver alcance
1. Parsear los argumentos. Si aparece `preview` (en cualquier posición), activar modo dry-run y quitarlo de la lista.
2. Los argumentos restantes son alias. Resolverlos contra `~/.claude/projects-registry.md`:
   - Alias de nivel cliente (`yalo`, `bodega`, `corinsa`, `cpa`, `bi`, `doctor`, `ult`, `nai`) → todos los repos de ese cliente.
   - Alias de repo específico → ese repo.
   - **Sin argumentos** → los 7 clientes base (YALO, LA BODEGA, CORINSA BI, CORINSA CPA, ULTIMATE LABS, EMSULA DOCTOR, NAI).
3. Guardar dos cosas: (a) la lista de repos en alcance con su ruta, (b) el conjunto de **clientes** en alcance (para filtrar Jira en el Paso 2).
4. Si algún alias no resuelve, avisarlo y seguir con los que sí.

### Paso 1 — HECHO (commits de hoy)
1. Spawnear un subagente **Haiku por cliente en alcance** (en paralelo).
2. Cada subagente, por cada repo del cliente, corre:
   ```
   git -C "<ruta_repo>" log --since="00:00" --author="naidelyn" --oneline --format="%h %s" --date=short
   ```
   (el `--author` hace match parcial case-insensitive sobre nombre/email de Naidelyn).
3. Cada subagente devuelve solo los repos con commits, con su lista (máx 10 por repo; si hay más, "+N commits más").
4. El agente principal arma "Hecho" agrupado por proyecto. Si ningún repo tuvo commits, "Hecho" queda vacío (se omitirá en el ensamblado).

### Paso 2 — EN PROGRESO + PRÓXIMO (Jira, UNA sola consulta)
1. Filtro de proyecto: si hubo alcance explícito, mapear cada cliente a sus Jira keys con `memory/reference-jira.md`:
   - yalo → YAL, YV, YALOAG · bodega → LBO · cpa → CC · bi → CBI · doctor → ED · ult → UL · nai → (sin Jira, se omite)
2. **UNA sola** llamada a `searchJiraIssuesUsingJql` (trae En progreso Y Próximo juntos — no hagas dos consultas), cloudId `70102692-578c-4758-a88b-ffb5a3c535cb`:
   - `jql`: `assignee = "712020:8322cd00-7bcb-4a0a-bdfa-0d1e58bf4bd3" AND statusCategory IN ("In Progress","To Do") [AND project IN (<keys en alcance>)] ORDER BY updated DESC`
   - `fields`: `["summary","status","project"]` — **NO** traigas la descripción (pesa cientos de KB y revienta el límite de tokens).
   - `responseContentFormat`: `"markdown"`, `maxResults`: 50.
3. Si el resultado excede el límite y se guarda a archivo, procesalo con **Python** (no hay `jq` instalado en este entorno).
4. Separar por `fields.status.statusCategory.key` — **NO por el nombre** del estado (vienen en español: "En curso", "Tareas por hacer"):
   - `indeterminate` → **En progreso** (listar todos).
   - `new` → **Próximo** (máx 5, los más recientes por `updated`).
5. Si el alcance solo incluye clientes sin Jira (ej. solo `nai`), omitir ambas secciones.

### Paso 3 — BLOCKERS
Preguntar a la usuaria: "¿Algún blocker? (algo que te esté frenando: esperás respuesta/review, una dependencia no lista, falta acceso/credenciales, una decisión pendiente, un bug trabado). Enter o 'no' para omitir." Si responde vacío o "no", no se incluye la sección.

### Paso 4 — ENSAMBLAR
Obtener la hora local (ej. `date +%H` en Bash) y elegir saludo + emoji según el momento del día:
- 05:00–11:59 → `:sunny:` + "Buenos días"
- 12:00–18:59 → `:city_sunset:` + "Buenas tardes"
- 19:00–04:59 → `:crescent_moon:` + "Buenas noches"

Construir el mensaje en formato Slack mrkdwn, con tono hondureño natural. Omitir cualquier sección vacía. Plantilla:

```
<emoji> *<saludo> — Standup <fecha dd mmm yyyy>*

*Hecho hoy*
• <Cliente> — <repo>: <n> commits (<subjects resumidos>)

*En progreso*
• <KEY> — <summary>

*Próximo*
• <KEY> — <summary>

*Blockers*
• <lo que dijo la usuaria>
```

Si no hubo NADA (0 commits y 0 issues), no ensamblar: responder "No hay nada para el standup de hoy" y terminar.

### Paso 5 — PREVIEW (opcional)
Solo si se invocó con el flag `preview`: mostrar el mensaje ensamblado en la conversación, terminar acá (NO enviar) e indicar "modo preview — no se envió".
Si NO es preview, seguir directo al envío **sin pedir confirmación**: el destino es siempre tu propio DM (privado, sin riesgo de destinatario equivocado).

### Paso 6 — ENVIAR
1. Resolver el self-DM: con el MCP Slack, identificar al usuario propio y abrir/usar el DM consigo misma (canal directo del propio usuario).
2. Enviar con `slack_send_message` al self-DM el mensaje ensamblado (mrkdwn).
3. Confirmar en la conversación "Standup enviado a tu DM".

### Manejo de errores (degradar, nunca reventar)
- Jira MCP no responde → armar igual con "Hecho" y poner "⚠️ Jira no disponible" en vez de En progreso/Próximo.
- El barrido de un repo/cliente falla → saltarlo y anotar al pie "(no se pudo leer: <repo>)".
- El envío a Slack falla → mostrar el mensaje completo en la conversación para copiar a mano, y avisar el error. Nunca se pierde el standup.
