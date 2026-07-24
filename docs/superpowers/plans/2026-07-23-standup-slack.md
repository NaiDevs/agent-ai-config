# Skill `/standup` — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear un skill manual `/standup [alias...] [preview]` que arme un standup diario (Hecho/En progreso/Próximo/Blockers) cruzando git + Jira y lo mande al DM propio de Slack de Naidelyn.

**Architecture:** Skill prompt-based (`commands/standup.md`) que orquesta piezas existentes: barrido git con subagentes Haiku (lógica de `/scan hoy`), Jira vía MCP Atlassian, envío vía MCP Slack. Sin scripts nuevos. Se despliega a Claude Code y Codex por `setup.ps1` (ya copia `commands/*.md`).

**Tech Stack:** Markdown (skill), subagentes Haiku, MCP Atlassian (`searchJiraIssuesUsingJql`), MCP Slack (`slack_send_message`, `slack_search_users`/resolución de self-DM), git.

## Global Constraints

- Idioma: todo en español; tono hondureño natural según `expressions.md`, sin forzarlo.
- Modelos: Haiku para subagentes de barrido git; agente principal ensambla/consulta Jira/envía Slack.
- Identidad git de Naidelyn: autor `Naidelyn Maldonado` / email `naidelyn.maldonado@cit.hn`.
- Jira: cloudId `70102692-578c-4758-a88b-ffb5a3c535cb`; accountId `712020:8322cd00-7bcb-4a0a-bdfa-0d1e58bf4bd3`.
- Destino Slack: DM propio (self-DM). Constante `STANDUP_DESTINO = "self-dm"`.
- Fuente de paths por cliente: `~/.claude/projects-registry.md`. Mapping cliente→Jira key: `~/.claude/projects-registry.md` + `memory/reference-jira.md`.
- Fuente de verdad del skill: `commands/standup.md` en el repo (NO editar solo el desplegado en `~/.claude/commands/`).
- Verificación: corridas reales `/standup ... preview` (nunca envía). No hay unit tests: es un skill prompt-based.
- Commits frecuentes, en español.

---

### Task 1: Esqueleto del skill + resolución de alcance (scope)

**Files:**
- Create: `commands/standup.md`

**Interfaces:**
- Produces: el comando `/standup [alias...] [preview]`. Argumentos: cero o más alias de cliente/repo (resueltos con `projects-registry.md`), y el flag opcional `preview`.

- [ ] **Step 1: Crear `commands/standup.md` con frontmatter, uso, y la sección de resolución de alcance**

````markdown
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
3. Guardar dos cosas: (a) la lista de repos en alcance con su ruta, (b) el conjunto de **clientes** en alcance (para filtrar Jira en el Paso 2/3).
4. Si algún alias no resuelve, avisarlo y seguir con los que sí.
````

- [ ] **Step 2: Verificar resolución de alcance (dry-run parcial)**

Run: `/standup nai preview`
Expected: el skill resuelve `nai` a los repos de `C:\Users\naide\OneDrive\Documentos\Proyectos\Nai\` (incluye `agent-ai-config`), reconoce modo preview, y no revienta. Aún no arma secciones completas (se agregan en tareas siguientes) — basta con que el alcance sea correcto.

- [ ] **Step 3: Commit**

```bash
git add commands/standup.md
git commit -m "feat(standup): esqueleto del skill + resolucion de alcance por alias"
```

---

### Task 2: Sección HECHO (barrido git de commits de hoy)

**Files:**
- Modify: `commands/standup.md` (agregar sección "Paso 1 — HECHO")

**Interfaces:**
- Consumes: lista de repos en alcance del Paso 0.
- Produces: estructura interna "Hecho" = por proyecto, lista de commits de hoy de Naidelyn.

- [ ] **Step 1: Agregar la sección Paso 1 al skill**

````markdown
### Paso 1 — HECHO (commits de hoy)
1. Spawnear un subagente **Haiku por cliente en alcance** (en paralelo).
2. Cada subagente, por cada repo del cliente, corre:
   ```
   git -C "<ruta_repo>" log --since="00:00" --author="naidelyn" --oneline --format="%h %s" --date=short
   ```
   (el `--author` hace match parcial case-insensitive sobre nombre/email de Naidelyn).
3. Cada subagente devuelve solo los repos con commits, con su lista (máx 10 por repo; si hay más, "+N commits más").
4. El agente principal arma "Hecho" agrupado por proyecto. Si ningún repo tuvo commits, "Hecho" queda vacío (se omitirá en el ensamblado).
````

- [ ] **Step 2: Verificar HECHO**

Run: `/standup nai preview`
Expected: la sección "Hecho" lista los commits de hoy en `agent-ai-config` (hoy hubo varios: fixes de hooks, spec, etc.), agrupados bajo NAI. Ningún otro cliente aparece (alcance = nai).

- [ ] **Step 3: Commit**

```bash
git add commands/standup.md
git commit -m "feat(standup): seccion Hecho (barrido git Haiku de commits del dia)"
```

---

### Task 3: Secciones Jira (En progreso + Próximo) con filtro por alcance

**Files:**
- Modify: `commands/standup.md` (agregar "Paso 2 — EN PROGRESO" y "Paso 3 — PRÓXIMO")

**Interfaces:**
- Consumes: conjunto de clientes en alcance (Paso 0).
- Produces: estructura interna "En progreso" y "Próximo" = listas de issues Jira (key + summary).

- [ ] **Step 1: Agregar las secciones Jira al skill**

````markdown
### Paso 2 — EN PROGRESO (Jira)
1. Determinar el filtro de proyecto: si hubo alcance explícito, mapear cada cliente en alcance a sus Jira keys con `memory/reference-jira.md`:
   - yalo → YAL, YV, YALOAG · bodega → LBO · cpa → CC · bi → CBI · doctor → ED · ult → UL · nai → (sin Jira, se omite)
2. Consultar Jira con el MCP Atlassian (`searchJiraIssuesUsingJql`), cloudId `70102692-578c-4758-a88b-ffb5a3c535cb`:
   ```
   assignee = "712020:8322cd00-7bcb-4a0a-bdfa-0d1e58bf4bd3" AND statusCategory = "In Progress"
   [AND project IN (<keys en alcance>)]   ← solo si hubo alcance explícito
   ORDER BY updated DESC
   ```
3. Devolver key + summary de cada issue. Si el alcance solo incluye clientes sin Jira (ej. solo `nai`), omitir esta sección.

### Paso 3 — PRÓXIMO (Jira)
Igual que el Paso 2 pero con `statusCategory = "To Do"`, máximo 5 issues, `ORDER BY priority DESC, updated DESC`.
````

- [ ] **Step 2: Verificar Jira con alcance**

Run: `/standup yalo preview`
Expected: "En progreso" y "Próximo" muestran solo issues de proyectos YAL/YV/YALOAG asignados a Naidelyn. Correr también `/standup nai preview` y confirmar que las secciones Jira se **omiten** (nai no tiene Jira).

- [ ] **Step 3: Verificar Jira sin alcance**

Run: `/standup preview`
Expected: "En progreso"/"Próximo" traen los issues asignados a Naidelyn en **cualquier** proyecto (sin `project IN`).

- [ ] **Step 4: Commit**

```bash
git add commands/standup.md
git commit -m "feat(standup): secciones En progreso y Proximo desde Jira con filtro por alcance"
```

---

### Task 4: Blockers + ensamblado del mensaje

**Files:**
- Modify: `commands/standup.md` (agregar "Paso 4 — BLOCKERS" y "Paso 5 — ENSAMBLAR")

**Interfaces:**
- Consumes: estructuras Hecho, En progreso, Próximo.
- Produces: el texto final del mensaje Slack (mrkdwn).

- [ ] **Step 1: Agregar blockers y ensamblado al skill**

````markdown
### Paso 4 — BLOCKERS
Preguntar a la usuaria: "¿Algún blocker para el standup? (enter para omitir)". Si responde vacío, no se incluye la sección.

### Paso 5 — ENSAMBLAR
Construir el mensaje en formato Slack mrkdwn, con tono hondureño natural. Omitir cualquier sección vacía. Plantilla:

```
:sunny: *Standup — <fecha dd mmm yyyy>*

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
````

- [ ] **Step 2: Verificar ensamblado**

Run: `/standup nai preview` (responder un blocker de prueba cuando pregunte)
Expected: se muestra el mensaje armado con "Hecho" (commits NAI), sin secciones Jira (nai sin Jira), y con "Blockers" incluyendo lo que se escribió. Formato mrkdwn correcto, secciones vacías omitidas.

- [ ] **Step 3: Commit**

```bash
git add commands/standup.md
git commit -m "feat(standup): blockers interactivos + ensamblado del mensaje Slack"
```

---

### Task 5: Envío a Slack self-DM + preview + manejo de errores

**Files:**
- Modify: `commands/standup.md` (agregar "Paso 6 — PREVIEW/CONFIRMAR", "Paso 7 — ENVIAR" y "Manejo de errores")

**Interfaces:**
- Consumes: mensaje ensamblado (Paso 5), flag preview (Paso 0).
- Produces: envío a Slack o dry-run.

- [ ] **Step 1: Agregar preview, envío y errores al skill**

````markdown
### Paso 6 — PREVIEW / CONFIRMAR
Mostrar el mensaje ensamblado en la conversación. Si el modo es `preview`, terminar acá (NO enviar) e indicar "modo preview — no se envió". Si no, pedir confirmación explícita antes de enviar.

### Paso 7 — ENVIAR
1. Resolver el self-DM: con el MCP Slack, identificar al usuario propio y abrir/usar el DM consigo misma (canal directo del propio usuario).
2. Enviar con `slack_send_message` al self-DM el mensaje ensamblado (mrkdwn).
3. Confirmar en la conversación "Standup enviado a tu DM".

### Manejo de errores (degradar, nunca reventar)
- Jira MCP no responde → armar igual con "Hecho" y poner "⚠️ Jira no disponible" en vez de En progreso/Próximo.
- El barrido de un repo/cliente falla → saltarlo y anotar al pie "(no se pudo leer: <repo>)".
- El envío a Slack falla → mostrar el mensaje completo en la conversación para copiar a mano, y avisar el error. Nunca se pierde el standup.
````

- [ ] **Step 2: Verificar que preview NO envía**

Run: `/standup nai preview`
Expected: muestra el mensaje y termina con "modo preview — no se envió". Nada llega a Slack.

- [ ] **Step 3: Verificar envío real**

Run: `/standup nai` (confirmar cuando pida)
Expected: llega el mensaje al DM propio de Slack de Naidelyn. Verificar visualmente en Slack.

- [ ] **Step 4: Commit**

```bash
git add commands/standup.md
git commit -m "feat(standup): preview dry-run, envio a self-DM de Slack y manejo de errores"
```

---

### Task 6: Despliegue y registro

**Files:**
- Modify: `CLAUDE.md` (tabla de auto-activación — opcional según decisión de la usuaria)

**Interfaces:**
- Consumes: `commands/standup.md` completo.

- [ ] **Step 1: (Opcional) Registrar auto-activación en `CLAUDE.md`**

Si Naidelyn quiere que frases como "armá el standup" / "qué hice hoy" lo disparen, agregar a la tabla "Flujo de trabajo y proyecto" de `CLAUDE.md` (y su copia en el repo):

```markdown
| standup / qué hice hoy / armá el daily | `/standup` |
```

Si prefiere mantenerlo solo manual, saltar este step.

- [ ] **Step 2: Desplegar a las herramientas**

Run: `.\setup.ps1 -Tool both` (o `-Tool claude`)
Expected: setup copia `commands/standup.md` a `~/.claude/commands/` y lo convierte a skill de Codex. Confirmar que `~/.claude/commands/standup.md` existe.

- [ ] **Step 3: Verificación end-to-end final**

Run: `/standup preview` (todos los clientes)
Expected: arma el standup completo de todos los clientes con actividad hoy, sin enviar. Revisar que Hecho/En progreso/Próximo se vean bien.

- [ ] **Step 4: Commit + push**

```bash
git add CLAUDE.md
git commit -m "feat(standup): registra /standup en auto-activacion (opcional)"
git push origin master
```

---

## Notas de verificación

- Toda verificación es por corrida real del skill en modo `preview` (no envía). El único step que envía a Slack es Task 5 Step 3, hecho a conciencia contra el DM propio.
- NAI/`agent-ai-config` es el mejor proyecto de prueba porque hoy tiene commits reales y no tiene Jira (prueba la omisión de secciones Jira).
- YALO es el mejor para probar el filtro de Jira por alcance (keys YAL/YV/YALOAG).
