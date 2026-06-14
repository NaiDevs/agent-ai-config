---
name: projects-workspaces
description: Multi-repo workspaces for simultaneous work — groups of related projects activated together with git sync
metadata:
  type: project
---

Workspaces son grupos de proyectos que se trabajan simultáneamente. Al activar un workspace con `/proyecto ws [nombre]`, Claude hace git fetch en todos los repos y muestra un status unificado.

**Why:** La mayoría del trabajo involucra al menos FE + API al mismo tiempo. Los workspaces evitan activar repos uno a uno.
**How to apply:** Cuando el usuario dice "quiero trabajar en yalo pos" o activa un workspace, cargar todos los repos del grupo y mostrar su estado.

| Workspace           | Proyectos                                              | Descripción                    |
|---------------------|--------------------------------------------------------|--------------------------------|
| yalo pos            | yalo bo, yalo bo api                                   | POS frontend + backend         |
| yalo pedidos        | yalo monitor, yalo monitor api                         | Monitor de pedidos full stack  |
| yalo full           | yalo bo, yalo bo api, yalo signalr                     | POS con tiempo real            |
| bodega shop         | bodega ecom, bodega bo api                             | E-commerce web + API           |
| bodega full         | bodega ecom, bodega ecom mb, bodega bo api, bodega svc | E-commerce completo            |
| cpa full            | cpa fe, cpa api, cpa reports api                       | CPA completo                   |
| doctor full         | doctor fe, doctor api                                  | Sistema médico completo        |
| ult full            | ult fe, ult api                                        | Ultimate Labs full stack        |

Para agregar un workspace: editar `~/.claude/projects-registry.md`, sección Workspaces, y hacer commit/push al repo `claude-config`.

Ver aliases individuales en [[projects-yalo]], [[projects-labodega]], [[projects-corinsa]], [[projects-ultimatelabs]], [[projects-otros]].
