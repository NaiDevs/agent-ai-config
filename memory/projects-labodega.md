---
name: projects-labodega
description: La Bodega subproject aliases and paths — 10 repos covering ecommerce, backoffice, mobile, microservices
metadata:
  type: project
---

La Bodega es una plataforma e-commerce con 10 subproyectos. Incluye web, móvil, backoffice, microservicios y features especiales.

**Why:** Cliente con stack variado (Angular, Node, mobile). Aliases agrupados por "bodega *" para navegación rápida.
**How to apply:** Al mencionar alias `bodega *`, resolver path desde esta tabla.

Base path: `C:\Users\naide\OneDrive\Documentos\Proyectos\LA BODEGA\`

| Alias               | Carpeta                | Stack        | Descripción        |
|---------------------|------------------------|--------------|--------------------|
| bodega bo           | LaBodegaBackoffice     | Node/TS      | Backoffice admin   |
| bodega bo api       | LaBodegaBOAPI          | Node/Express | API de backoffice  |
| bodega ecommerce    | LaBodegaEcommerce      | Node/TS      | E-commerce web     |
| bodega app          | labodega-ecommerceMB   | Node/TS      | E-commerce móvil   |
| bodega mobile       | LaBodegaMobile         | Node/TS      | App móvil          |
| bodega services     | LaBodegaServices       | Node/TS      | Microservicios     |
| bodega ruleta       | APP-Ruleta             | Angular/TS   | App ruleta         |
| bodega cobro ruleta | yalocobro-ruleta       | Node/TS      | Pagos ruleta       |
| bodega visual       | labodega-visual-search | TS           | Búsqueda visual    |
| bodega geo          | hn-geo                 | —            | Geodatos HN        |

Workspaces: `bodega shop` (bodega ecommerce + bodega bo api), `bodega full` (ecommerce + app + bo api + services).
Ver [[projects-workspaces]] y `~/.claude/projects-registry.md`.
