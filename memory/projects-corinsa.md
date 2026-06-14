---
name: projects-corinsa
description: CORINSA BI and CPA subproject aliases — 7 repos covering business intelligence and accounting platform
metadata:
  type: project
---

CORINSA tiene dos productos: BI (Business Intelligence, 2 repos) y CPA (Contabilidad/Pagos, 5 repos).

**Why:** Dos productos distintos bajo el mismo cliente. Aliases diferenciados por prefijo `bi *` vs `cpa *`.
**How to apply:** Al mencionar alias `bi *` o `cpa *`, resolver path desde esta tabla.

Base path CORINSA BI: `C:\Users\naide\OneDrive\Documentos\Proyectos\CORINSA BI\`
Base path CORINSA CPA: `C:\Users\naide\OneDrive\Documentos\Proyectos\CORINSA CPA\`

| Alias          | Carpeta                        | Stack      | Descripción     |
|----------------|--------------------------------|------------|-----------------|
| bi fe          | CMProject                      | Angular/TS | Frontend BI     |
| bi api         | CMWebApi                       | C#/.NET    | API BI          |
| cpa api        | UCC API V2                     | C#/.NET    | API principal   |
| cpa reporteria | UCCv2ReportsAPI                | C#/.NET    | API reportería  |
| cpa web api    | UCCv2WebApi                    | C#/.NET    | Web API         |
| cpa fe         | UCCv2WebApp                    | Angular/TS | Frontend        |
| cpa ventas     | ventas-corinsa-cpa             | C#/.NET    | Módulo ventas   |

Workspace: `cpa full` (cpa fe + cpa api + cpa reporteria).
Ver `~/.claude/projects-registry.md`.
