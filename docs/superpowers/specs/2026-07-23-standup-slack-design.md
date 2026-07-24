# Diseño — skill `/standup` (rollup diario → Slack)

Fecha: 2026-07-23
Repo: NaiDevs/agent-ai-config
Estado: aprobado por Naidelyn, pendiente de spec review

## Propósito

Comando manual que arma un **standup diario** con lo trabajado hoy y lo manda al DM propio de Slack de Naidelyn. Resuelve la fricción de reconstruir a mano "qué hice / en qué estoy / qué sigue" cruzando git + Jira.

No es time-tracking ni worklog: es **comunicación** (una bitácora/standup para uno mismo).

## Decisiones tomadas (brainstorming)

| Punto | Decisión |
|---|---|
| Artefacto final | Mensaje de standup a Slack |
| Contenido | Standup completo: Hecho + En progreso + Próximo + Blockers |
| Próximo / Blockers | Próximo desde Jira; Blockers preguntados al usuario (se omite si no hay) |
| Destino | DM propio de Naidelyn (self-DM), un solo mensaje con todos los clientes |
| Disparo | Comando manual `/standup` |
| Enfoque | Orquestador que reusa `/scan` (git), MCP Atlassian (Jira) y MCP Slack |

## Arquitectura

Skill nuevo `commands/standup.md` en el repo `agent-config`, desplegado a `~/.claude/commands/` por `setup.ps1` (igual que los otros skills). Es un skill prompt-based que orquesta piezas existentes; no agrega scripts nuevos.

## Flujo

```
/standup  (o  /standup preview  para dry-run)
  1. HECHO       barrido git con subagentes Haiku por cliente (lógica de /scan hoy),
                 filtrado a los commits de Naidelyn:
                   git log --since="00:00 today" --author=<email/nombre> --oneline
                 sobre los repos de cada cliente en projects-registry.
                 Agrupado por proyecto. Máx 10 commits por repo (igual que /scan).
  2. EN PROGRESO Jira MCP (searchJiraIssuesUsingJql):
                   assignee = <accountId> AND status = "In Progress"
                 cloudId 70102692-578c-4758-a88b-ffb5a3c535cb
                 accountId 712020:8322cd00-7bcb-4a0a-bdfa-0d1e58bf4bd3
  3. PRÓXIMO     Jira MCP: assignee = <accountId> AND status = "To Do"
                 (sprint abierto primero si aplica; máx ~5 issues)
  4. BLOCKERS    preguntar a la usuaria; si no hay, se omite la sección
  5. ENSAMBLAR   mensaje Slack (mrkdwn) con tono hondureño natural, por secciones
  6. PREVIEW     mostrar el mensaje armado y pedir confirmación
                 (este es el momento de meter/ajustar blockers)
  7. ENVIAR      Slack MCP (slack_send_message) al self-DM de Naidelyn
                 salvo que se haya invocado en modo `preview` (no envía)
```

## Fuentes de datos

- **Paths de repos por cliente**: leídos de `~/.claude/projects-registry.md` (los 7 clientes base). Solo se reportan repos con actividad hoy.
- **Identidad git**: autor = `Naidelyn Maldonado` / `naidelyn.maldonado@cit.hn`.
- **Jira**: cloudId y accountId de `memory/reference-jira.md`. El JQL no filtra por proyecto (trae los tickets asignados a Naidelyn en cualquier proyecto).
- **Slack**: destino = self-DM. El skill resuelve el usuario propio vía MCP Slack y envía al DM consigo misma.

## Formato del mensaje (borrador)

```
:sunny: *Standup — 23 jul 2026*

*Hecho hoy*
• YALO — YaloPOSBackofficeAPI: 3 commits (fix facturas, feat descuento, …)
• La Bodega — LaBodegaServices: 1 commit (stock bajo)

*En progreso* (Jira)
• YAL-123 — Endpoint de cobros parciales
• LBO-45 — Ajuste de existencias

*Próximo*
• YV-88 — Validación de descuentos
• CC-12 — Reporte CPA mensual

*Blockers*
• (lo que diga la usuaria, o se omite)
```

Tono: hondureño natural según `expressions.md`, sin forzarlo. Secciones vacías se omiten (si no hubo commits hoy, no aparece "Hecho").

## Config

Constante al inicio de `standup.md`:
```
STANDUP_DESTINO = "self-dm"   # DM propio de Naidelyn en Slack
```
Un solo valor. Si a futuro quiere otro canal, cambia esta línea.

## Modelos

- **Haiku**: subagentes de barrido git (consistente con `/scan` y la economía de tokens).
- **Agente principal**: ensambla, consulta Jira MCP y envía a Slack.

## Manejo de errores (degradar, nunca reventar)

- **Jira MCP no disponible** → se manda igual con "Hecho"; En progreso/Próximo se reemplazan por "⚠️ Jira no disponible".
- **Barrido de un cliente/repo falla** → se salta ese repo y se anota al pie del mensaje.
- **Envío a Slack falla** → se muestra el mensaje completo en la conversación para copiar a mano. El trabajo nunca se pierde.
- **Sin actividad hoy (0 commits y 0 tickets)** → avisar "no hay nada para el standup de hoy" y no enviar.

## Verificación

- No hay unit tests (skill prompt-based).
- Modo `/standup preview`: arma y muestra el mensaje **sin enviar**. Es la red de seguridad.
- Primera corrida real verificada en conjunto con Naidelyn.

## Fuera de alcance (YAGNI)

- Posteo de worklogs a Jira / integración con Hubstaff (se descartó a favor de standup).
- Envío automático programado (cron). El diseño queda simple para agregarlo después si se quiere.
- Canales por cliente / múltiples destinos (se eligió self-DM único).
- Sección de PRs (no se pidió).

## Archivos afectados

- `commands/standup.md` — nuevo skill (fuente de verdad, se despliega por setup.ps1).
- `CLAUDE.md` — agregar `/standup` a la tabla de auto-activación (opcional; standup es manual, quizá no requiere auto-trigger).
