---
name: projects-yalo
description: "YALO subproject aliases and paths — 22 repos covering POS backoffice, payments, scheduling, real-time, order monitoring"
metadata: 
  node_type: memory
  type: project
  originSessionId: cda80a1e-8dea-41ef-98d1-c73d6a501d27
---

YALO es una plataforma POS/pagos con 22 subproyectos. Cliente principal con arquitectura de microservicios.

**Why:** Proyecto más grande del portafolio — requiere acceso rápido a subproyectos sin recordar paths completos.
**How to apply:** Cuando el usuario mencione cualquier alias `yalo *`, resolver el path desde esta tabla o del [[projects-registry]] completo.

Base path: `C:\Users\naide\OneDrive\Documentos\Proyectos\YALO\`

| Alias            | Carpeta                    | Stack      | Descripción             |
|------------------|----------------------------|------------|-------------------------|
| yalo bo          | YaloPOSBackoffice          | Angular/TS | POS Backoffice UI       |
| yalo bo api      | YaloPOSBackofficeAPI       | C#/.NET    | POS API                 |
| yalo consumer    | consumer-angular19         | Angular 19 | App consumidor          |
| yalo agendo      | YALO-Agendo-FE             | Angular/TS | App agendamiento        |
| yalo agendo api  | YALO-Agendo-API            | C#/.NET    | API agendamiento        |
| yalo monitor     | YALO_APP_MonitorPedidos    | Node/TS    | Monitor pedidos UI      |
| yalo monitor api | YALO_API_MonitorPedidos    | C#/.NET    | Monitor pedidos API     |
| yalo pos api     | YaloCobroApiNew            | C#/.NET    | API cobros              |
| yalo reporteria  | YALO-API-DataReporteria    | C#/.NET    | API reportería          |
| yalo external leg| YALO-API-ExternalService   | C#/.NET    | API servicio externo    |
| yalo signalr     | YALO-API-SignalR           | C#/.NET    | API tiempo real         |
| yalo stripe      | YALO-API-Stripe            | C#/.NET    | API pagos Stripe        |
| yalo whastapp    | YALO-API-WS                | C#/.NET    | API WebSockets          |
| yalo pos fe      | YALO-APP-CAP               | Node/TS    | App CAP                 |
| yalo trackeo     | yalo-trackeo               | Supabase   | Tracker Jira/GitHub/Slack |

**yalo trackeo (Supabase Edge Functions):**
- Repo GitHub: `Yalo-Technologies/yalo-trackeo` (privado). Clonado en `C:\Users\naide\yalo-trackeo`.
- Proyecto Supabase: `yalo-trackeo`, project-ref `ybxrkydqphwoilewpwrv`, región us-west-2.
- Deploy: `cd C:\Users\naide\yalo-trackeo && supabase functions deploy --project-ref ybxrkydqphwoilewpwrv` (login ya tiene acceso — no repite el 403 viejo).
- Al 2026-08-06: 19 functions (ai-create-tasks, ai-summary, device-token, github-prs, github-repos, github-webhook, invite-user, jira-epic, jira-epics, jira-issue-types, jira-projects, jira-send, jira-sprint, jira-sync, jira-transition, manage-member, slack-channels, slack-send, time-ingest).
- OJO: hay un scaffold `supabase/functions` VACÍO suelto en `C:\Users\naide\supabase` — no es el repo, ignorarlo/borrarlo.
| yalo dashboard   | YALO-Dashboard-API         | C#/.NET    | Dashboard API           |
| yalo external    | YALO-ExternalService       | C#/.NET    | Servicio externo        |
| yalo spc delasa  | yalo-spc-delasa            | C#/.NET    | Integración Delasa      |
| yalo console     | YaloConsole                | Node/TS    | Consola Yalo            |
| yalo vendo       | YaloVendoEntrego           | C#/.NET    | Vendo y Entrego         |
| yalo console api | YALO_API_Administrator     | Node/TS    | API administrador       |
| yalo invoice     | fx-create-invoice          | —          | Generador facturas      |
| yalo pos encoder | esc-pos-encoder-previewer  | Node/TS    | Encoder ESC/POS         |

Workspaces: `yalo bo` (bo + bo api), `yalo pedidos` (monitor + monitor api), `yalo full` (bo + bo api + signalr).
Ver tabla completa en [[projects-workspaces]] y `~/.claude/projects-registry.md`.
