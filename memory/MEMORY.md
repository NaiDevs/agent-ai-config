# Memory Index

- [Token economy + modelos](feedback-token-economy.md) — Haiku para git ops, Sonnet default, Opus solo con consulta previa
- [Perfil de usuario](user-profile.md) — Naidelyn, dev full-stack, 6 clientes, 58 repos
- [Log de cambios](changes-log.md) — historial de commits y PRs por proyecto (auto-actualizado por /commit y /pr)
- [Jira cithn.atlassian.net](reference-jira.md) — cloudId + mapping alias→key para YAL, YV, YALOAG, LBO, CBI, CC, UL, ED, CIT
- [Config agent-config](setup-claude-config.md) — Repo portable de configuración, cómo sincronizar entre dispositivos
- [Proyectos YALO](projects-yalo.md) — 22 subproyectos POS/pagos, aliases `yalo *`
- [Proyectos La Bodega](projects-labodega.md) — 10 subproyectos ecommerce, aliases `bodega *`
- [Proyectos CORINSA](projects-corinsa.md) — 7 subproyectos BI/CPA, aliases `corinsa *` y `cpa *`
- [Proyectos Ultimate Labs](projects-ultimatelabs.md) — 6 subproyectos labs, aliases `ult *`
- [Proyectos EMSULA + NAI](projects-otros.md) — 12 subproyectos médicos y personales
- [Workspaces](projects-workspaces.md) — Grupos de repos para trabajo simultáneo con git sync
- [YaloConsole currentUser admin](feedback-yaloconsole-currentuser.md) — currentUser mock siempre admin con acceso total, permisos después
- [Drag-drop nativo en YaloConsole](decision-yaloconsole-dragdrop.md) — usar DnD HTML5 nativo (no CDK) al portar kanban de yalo-sales-flow
- [Perf GET /api/organizations](decision-yaloconsole-organizations-perf.md) — dblink agregando fac_facturas era el 94%; fix con MV remota + pg_cron
- [YaloConsole → Slack Lists](decision-yaloconsole-slack-lists.md) — actividades del kanban como comentarios en Slack List; match email+nombre, post por chat.postMessage al canal C0BJGPESMFS
- [README integración Slack deals](reference-integracion-slack-deals.md) — cómo comentar en elementos de Slack Lists vía chat.postMessage al canal C… (list id con prefijo C), setup y archivos
- [Stock bajo — La Bodega](decision-labodega-stock-low.md) — stock_disponible = stock_real − existenciaBaja; restar en todo EP que muestre o valide stock
