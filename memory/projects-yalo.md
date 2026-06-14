---
name: projects-yalo
description: YALO subproject aliases and paths — 22 repos covering POS backoffice, payments, scheduling, real-time, order monitoring
metadata:
  type: project
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
