# ENGRAM Memory - Changes Log

## Session 84ee29d2-08e4-4345-ad73-d36dc53bb5de

- 2026-10-25 | yalo agendo | commit | feat(workspace): agrega script de inicio orquestado para workspace local
- 2026-10-29 | yalo-trackeo-desktop | commit | feat(updater): chequea actualizaciones al sincronizar, no solo al arranque
- 2026-10-29 | yalo-trackeo-desktop | commit | feat(timer): acumula tiempo de tickets igual que tareas en el desktop
- 2026-10-25 | yalo agendo api | commit | feat(certificados): implementa módulo completo de certificados
- 2026-10-25 | yalo mfe catalogo inventario | commit | feat(recursos): conecta módulo con la API real de Yalo Agendo
- 2026-10-25 | yalo agendo api | commit | feat(recursos): agrega módulo completo de recursos a la API
- 2026-10-25 | yalo mfe catalogo inventario | commit | feat(servicios): agrega sección "Recursos que consume" conectada al API
- 2026-10-25 | yalo agendo api | commit | feat(recursos): agrega endpoints GET/PUT por-servicio para recursos consumidos
- 2026-10-27 | yalo agendo | commit | feat(recursos): agrega módulo de recursos y corrige validación de sesión
- 2026-10-27 | yalo bo api | commit | feat(liquidaciones): agrega código cliente YALO, zona y número de factura en órdenes pendientes
- 2026-10-27 | yalo bo | commit | feat(liquidaciones): rediseña historial de órdenes pendientes como tabla con columnas YALO

## Session config-engram-go-migration

- 2026-10-18 | NAI | CONFIG | MigraciÃ³n a Engram Go oficial (v3.4.0): instalado via `go install`, reemplazado MCP memory (@modelcontextprotocol/server-memory) por binario nativo `engram mcp`. Stop hook simplificado a mem_session_finalize. 20 tools mcp__engram__* en allowlist.
- 2026-10-22 | yalo-mfe-catalogo-inventario | commit | feat(catalogo,inventario): agrega sub-rutas y componentes por sección

## Session 7a9202c9-50e5-437f-8359-42815cb59cbd

- 2026-10-21 | yalo trackeo | commit | docs(qa): actualiza feedback de revisión para Amy con hallazgos nuevos

## Session 4251dca8-8196-41b5-a2d2-7d2792c9025e

- 2026-10-19 | yalo console fe | commit | feat(header): muestra tasa de cambio en navbar
- 2026-10-19 | yalo console fe | commit | feat(pagos-parciales): implementa flujo de comprobantes parciales en modal de confirmaciÃ³n
- 2026-10-19 | yalo console api | commit | feat(pagos-parciales): implementa flujo de acumulaciÃ³n de comprobantes para suscripciones
- 2026-10-17 | yalo console api | feat | OCR recibos transferencia: AwsTextractService (S3 upload + polling GetExpenseAnalysis), endpoint POST /organizations/ocr-receipt (JWT, sharp PNG, banco+cuenta query params), DTOs + helpers de validaciÃ³n, script SQL para systemrootconfig(terminosClaveValidarRecibo). Fix: Blocks en GetExpenseAnalysis vienen en ExpenseDocument.Blocks no a nivel raÃ­z. Credenciales AWS vienen de Secrets Manager secreto yalocore/keys (igual que bo api).
- 2026-10-17 | yalo console fe | feat | OCR disparado bidireccional: ngOnInit subscribe a cambios de banco + fileUpload subscribe a cambios de imagen â€” OCR se ejecuta cuando ambos valores estÃ¡n presentes (bank selected + file loaded). Imports: `distinctUntilChanged` agregado a RxJS operators para evitar emisiones duplicadas en confirm-payment.component.ts. Cambios compilados sin errores; ng serve reloading automÃ¡ticamente.

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

- 2026-10-14 | yalo-trackeo | commit | docs(qa): agrega feedback de revisiÃ³n de cÃ³digo para Amy â€” rama Fix/Amy/noti
- 2026-10-15 | yalo-trackeo | GENERAL | feedback-amy-noti.md modificado sin commitear â€” rama fix/Amy/noti con cambios en documentaciÃ³n de notificaciones (estado, motivos, compactaciÃ³n de avisos, formato de fechas)

## Session 20e46849-50f1-4ec2-ac6b-011f93d56228

2026-10-14 | yalo-trackeo-desktop | feat | UpdateBanner reescrito como modal forzado (sin dismiss), PromptIdle y UpdateBanner ahora llaman show()+setFocus() para restaurar ventana minimizada, sleep detection mejorada con PBT_APMRESUMESUSPEND+PBT_APMRESUMEAUTOMATIC en windows.rs
2026-10-14 | yalo-trackeo | tag v0.2.0 | fix(trackeo): corrige countdown de pausas y normaliza campo trackeable â€” release pausas trackeables
2026-10-15 | yalo-trackeo | commit | fix(rls): permite a cualquier miembro del workspace leer time_entries
2026-10-15 | yalo-trackeo | commit | feat(permisos): agrega permiso granular "Ver tiempo del equipo"
2026-10-15 | yalo-trackeo-desktop | fix | detecta cierre de tapa en Modern Standby via GUID_MONITOR_POWER_ON â€” v0.1.14
2026-10-14 | yalo-trackeo | feat | Pausas trackeables implementadas: migraciÃ³n SQL (trackeable+description+suggested_minutes en time_pauses), modelo TimePause/PauseReason actualizado, pauseTimer con snapshot, resumeTimer crea tarea+TimeEntry manual, PauseTimerModal con texto dinÃ¡mico y campo descripciÃ³n, TimerChip con countdown y auto-resume, toggle trackeable en Settings â€” 2 commits en feat-mcp-servidor

2026-10-14 | YALO | GENERAL | ActivaciÃ³n proyectos yalo-trackeo (web) y yalo-trackeo-desktop â€” rama feat-mcp-servidor (limpio, Ãºltimo commit 2026-10-07), rama claude/yalo-trackeo-desktop-mvp-sg0b9f (limpio, Ãºltimo commit 2026-09-26), ambos sin upstream remoto configurado

- 2026-10-14 | yalo console api | commit | fix(crm-deals): alinea cÃ¡lculo BANT con lÃ³gica del FE y cambia tipo de columna a float
- 2026-10-14 | yalo console api | commit | fix(slack): escapa caracteres especiales en todos los servicios que envÃ­an mensajes
- 2026-10-14 | yalo console | commit | fix(crm-deals): corrige URL doble /api en bÃºsqueda y fusiÃ³n de deals
- 2026-10-14 | yalo console | commit | feat(crm-deals): BANT con patrÃ³n draft, guarda en BD solo al dar Listo
- 2026-10-14 | yalo console | commit | perf(crm-catalogs): agrega guards para evitar llamadas duplicadas al API en carga
- 2026-10-14 | YALO | DECISION | Micro-repos compartidos: dos repos nuevos (yalo-shared-fe + YaloShared.Core) como deps npm/NuGet para BO API/FE y Agendo API/FE â€” elimina duplicaciÃ³n de cÃ³digo, modelos DTOs compartidos, SharedServices layer
- 2026-10-13 | yalo console api | commit | feat(crm-cockpit): incluye orgs enterprise+trialing como clientes activos con MRR real
- 2026-10-12 | yalo console api | commit | feat(crm): agrega calendario de actividades con recordatorios (cron Slack DM + Crm-notifications)
- 2026-10-12 | yalo console | commit | feat(calendario): agrega modulo de calendario CRM (dia/semana/mes, drag-drop, recordatorios in-app)
- 2026-10-12 | yalo console | commit | feat(ventas): bÃºsqueda, orden y mejoras a la ficha del deal
- 2026-10-12 | yalo console api | commit | feat(crm-deals): agrega endpoint DELETE para archivar deal con motivo
- 2026-10-12 | YALO | DECISION | CRM-Onboarding: espeja actividades a mÃºltiples canales Slack (ventas-yalotech via n8n, sac-yalo via bot directo) con persistencia de hilo SAC

## Session 3c9c30c4-debc-41af-b4cc-2be6b6929e21

2026-10-07 | yalo-trackeo | commit | feat(qa): agrega mejoras del mÃ³dulo QA (9 items solicitados por Cristian)
2026-10-07 | yalo-trackeo | commit | fix(qa): corrige visibilidad de reportes y mejora mÃ³dulo QA
2026-10-07 | yalo-trackeo | commit | feat(TaskDetail): muestra panel QA en solicitudes de origen de la tarea

## Session d30762e8-962c-4159-8f8f-e8c98fbb2684

2026-09-26 | YALO | CONFIG | SES integration: debug destinatarios, lotes y MessageId en AWS SES para yalo-trackeo
2026-09-26 | YALO | BUG | SES deliverability: emails bloqueados por servidor corporativo (cit.hn) debido a baja reputaciÃ³n de sandbox IPs â€” requiere salir de sandbox + configurar DKIM en dominio yalotechnologies.com

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | yalo bo api | commit | fix(liquidaciones): corrige saldo que excede total del pedido y pagos con monto cero
2026-10-01 | yalo bo | commit | fix(liquidaciones): oculta ordenes con monto a liquidar en cero
2026-10-04 | agendivo | commit | fix(onboarding): permite crear negocio sin sesiÃ³n autenticada
2026-10-04 | agendivo | commit | feat(billing): registra suscripcion past_due al crear negocio y separa pantallas de acceso
2026-10-06 | yalo trackeo | commit | feat(novedades): implementa footer HTML email-safe con Ã­conos en Supabase Storage

## Session 05c3b771-276d-4e19-b3e1-5069376fddfe

2026-09-29 | YALO | CONFIG | Firma de aplicaciÃ³n Tauri (yalo-trackeo-desktop): roadmap para certificado OV Windows (DigiCert/Sectigo/SSL.com ~$100-500), Apple Developer ($99 + notarizaciÃ³n), GitHub Secrets (WINDOWS_CERTIFICATE, APPLE_CERTIFICATE, TAURI_SIGNING_PRIVATE_KEY), y updater obligatorio bloqueante
2026-09-29 | YALO | CONFIG | Certificados de firma: instrucciones para obtener .pfx de Windows (empresarial OV), Apple Developer ID Application (.p12), Team ID y App-Specific Password â€” canales seguros (1Password, Bitwarden) vs inseguro (Slack/email)

## Session b623c5ee-0c39-4259-a75b-476c49c7ef62

2026-10-05 | YALO | BUG | ELB health checks fallaban: .NET 8 en Dockerfile escucha puerto 8080 por defecto, deployment usa 80 â€” fix: agregar ENV ASPNETCORE_URLS=http://+:80
2026-10-05 | YALO | BUG | HealthController eliminÃ³ verificaciÃ³n innecesaria de conectividad a AUTH+Cobro DB (retorna 200 sin deps)

## Session 464a9139-485a-45a0-80fb-01ca2f3a0abb

2026-09-29 | YALO | DECISION | Desarrollo en rama feat-mcp-servidor: cambios en rutas (Changelog, SettingsComms), store, funciones Supabase (mcp, novedad-email) con nueva clase compartida yalo-email
2026-09-29 | YALO | BUG | Aplicadas propiedades backgroundColor y background:#ffffff a canvas builder e HTML email para evitar fondo negro en imÃ¡genes PNG transparentes
2026-09-29 | yalo console api | commit | feat(organizations): agrega endpoint GET /api/trackeo/accounts para Yalo Trackeo
2026-09-29 | yalo trackeo | commit | feat(novedades): constructor visual de correo y campo cuenta API propia
2026-09-29 | YALO | DECISION | Edge Functions para bulk operations: procesa 1000 registros en ~30s server-side (vs 8min UI bloqueada) â€” 100 lotes de 10 en paralelo con 300ms entre lotes
2026-09-29 | yalo trackeo | commit | feat(novedades): envio masivo WhatsApp via Edge Function wa-send-bulk
2026-09-29 | yalo trackeo | commit | fix(wa): corrige token y saltos de lÃ­nea en envÃ­os WhatsApp
2026-09-29 | YALO | DECISION | Deploy wa-send-bulk exitoso (status ACTIVE): procesa cartera completa en lotes paralelos (10 registros server-side simultÃ¡neos) sin bloqueo cliente; commit 486b960
- 2026-10-29 | yalo monitor | commit | feat(filtros): agrega filtros de territorio y vendedor para cuentas Yalo Vendo
- 2026-10-29 | yalo monitor api | commit | feat(filtros): agrega endpoints /Zonas y /Vendedores; filtra ordenes por territorio y vendedor
2026-10-28 | yalo console | commit | feat(equipment): agrega eliminar en marcas/categorias/equipo y refactoriza no-series a relacional
2026-10-28 | yalo console api | commit | feat(equipment): migra serial/status/ubicacion a tablas relacionales y agrega eliminacion
2026-09-29 | YALO | CONFIG | WhatsApp Meta Cloud API: sandbox mode requiere agregar phone numbers como test recipients en Meta Business Manager â€” code correcto, issue es restricciÃ³n Meta en modo Development
- 2026-10-29 | yalo-trackeo-desktop | commit | fix(timer): corrige contador congelado al trackear un ticket
- 2026-10-29 | yalo-trackeo-desktop | commit | feat(linux): agrega soporte de instalación para Ubuntu
2026-09-29 | YALO | BUG | WhatsApp Meta: nÃºmero +50495349633 (Naidelyn) marcado como spam en Business Account â€” API retorna messageId pero Meta no entrega; soluciÃ³n requiere desbloquear en Phone Numbers Manager o revisar restricciÃ³n de calidad de cuenta
2026-09-29 | YALO | CONFIG | WhatsApp: saltos de lÃ­nea en parÃ¡metros de plantilla NO son soportados por Meta Cloud API â€” redeploy v6/v20 usa formato en lÃ­nea plana (sin \n) como workaround validado
2026-09-29 | yalo trackeo | commit | feat(novedades): agrega envÃ­o masivo por correo a toda la cartera
2026-09-29 | yalo trackeo | commit | feat(proyectos): usa RichTextEditor en descripciÃ³n del modal de proyecto
2026-09-29 | yalo trackeo | commit | feat(tiempo): timesheet estilo Hubstaff con reportes y billable
2026-09-29 | YALO | DECISION | Modal de proyecto: campo DescripciÃ³n migrado de textarea a RichTextEditor (toolbar con bold, italic, listas, links igual que en tareas) para mejor ediciÃ³n de contexto y objetivos
2026-09-29 | YALO | DECISION | Timesheet mÃ³dulo completo (YATR-142): filtros sidebar, Group By (persona/proyecto/tarea/fuente), EditTimeEntryModal, columnas Facturable/No facturable, exportaciÃ³n Excel (ExcelJS con logo y colores) y PDF (pdf-lib A4 landscape), campos billable en TimeEntry y Tarea con acciones store + persistencia
2026-09-29 | yalo trackeo | commit | feat(tiempo): exportaciÃ³n Excel en formato plano estilo Hubstaff
2026-09-29 | YALO | GENERAL | Columna Actividad: mostrar porcentaje calculado desde activity_blocks de cada entrada (mismo cÃ¡lculo que actividadPct() en componente); vacÃ­o si entrada es manual o sin bloques

## Session 464a9139-485a-45a0-80fb-01ca2f3a0abb (continuaciÃ³n)

2026-09-30 | YALO | BUG | activityBlocks solo se cargaba con vista='actividad'; exports mostraban 0% actividad. SoluciÃ³n: ambos exports (Excel/PDF) ahora cargan directamente de activity_blocks al exportar, independiente del tab activo, usando snake_case fields (tracked_s, keyboard_s, mouse_s, pantalla_s, time_entry_id)
2026-09-30 | yalo trackeo | BUG | Indicador visual (puntito) en campo de fecha "MAR 29" desalineaba fila â€” removido, solo aplica cambio de color (brand azul) al marcar como destacado

## Session 403530a7-7dff-4b6a-ba43-7eea3875745f
- 2026-10-20 | YaloConsole | commit | feat(equipo-oficina): agrega módulo de inventario para equipos de oficina

2026-09-30 | YALO | DECISION | YA-143 (BitÃ¡cora pedidos cliente): nuevo endpoint GET /api/contingencias/clientes/pedidos + componente BitacoraPedidosClienteComponent con bÃºsqueda por cliente (nombre/telÃ©fono/cÃ³digo) y muestra facturas
2026-09-30 | YALO | DECISION | YA-144 (Actualizar info cliente): nuevo endpoint PATCH /api/contingencias/clientes/:codCliente + modal de ediciÃ³n en yalo-vendo-entrego categorÃ­a Clientes (referencia campos yalo bo)
2026-09-30 | YALO | DECISION | Arquitectura YaloConsole bitÃ¡coras: componentes standalone (bitacora-pedidos, bitacora-clientes), service pattern con endpoints GET /bitacoras/**/buscar, signal-based state management, timeline diff tracking

## Session b9ac393f-93e0-47b9-9b2d-5a7d7a0aa985

## Session 22a83bab-58b6-4972-a052-5758d237bc8d

- 2026-10-02 | yalo console api | commit | feat(secrets): agrega modulo de secretos de un solo uso con cifrado E2E
- 2026-10-02 | yalo console | commit | feat(organizations): agrega secretos de un solo uso con cifrado E2E
2026-10-02 | YALO | FEATURE | Secretos de un solo uso: tab "Secretos" en Organizations (YaloConsole), cifrado E2E AES-GCM con clave en fragmento URL, POST auth + GET pÃºblico delete-on-read en YALO_API_Administrator, ruta pÃºblica /secret/:id sin auth

2026-10-02 | YALO | DECISION | Onboarding UI: permitir asignar/reasignar leads en onboarding con interfaz drag-drop y modal de asignaciÃ³n, integraciÃ³n con sacAgentId en API

## Session 798cab57-c118-483a-a449-2f5d538bb092

2026-10-10 | NAI | CONFIG | Payment methods card: reemplaza @/components/ui/switch (no disponible) con toggle customizado Tailwind + remueve imports muertos para compilaciÃ³n TypeScript
2026-10-02 | YALO | DECISION | Sales Pipeline: agregar motivo configurable (lista desplegable) al reasignar lead a otro asesor; motivo seleccionable por defecto (no texto libre) integrado con endpoint PATCH /crm-deals
2026-10-02 | YALO | FEATURE | Organizations: agrega valor suscripciÃ³n USD/LPS (calcula USD desde productos activos, LPS con tasa del Ãºltimo pago/fallback 24.7), oculta productos con cantidad=0, corrige dark mode en tab Productos

2026-09-30 | YALO | DECISION | AnÃ¡lisis de arquitectura YALO-API-Soporte: clone de repo y anÃ¡lisis completo via subagent (stack, estructura, mÃ³dulos, integraciones, patterns, BD, Swagger)
2026-09-30 | YALO | DECISION | YALO-API-Soporte patterns: ServiceResult + ApiResponse wrappers, ApiKey auth (AWS Secrets), Read Replica interceptor (GETâ†’reader, POST/PUT/PATCH/DELETEâ†’writer), 3 PostgreSQL contexts + DynamoDB, BugReportsâ†”Jira bidireccional, 56 endpoints (GET 27, POST 15, PUT 11, PATCH 2, DELETE 1)

## Session 6d163bc8-0381-4c0e-bc87-77b50f74de2c

2026-10-01 | YALO | GENERAL | MÃ³dulo QA v2 â€” porting completo desde v3 NM: constants (5339-4419), state fields, helpers (5366-5700), screen principal (1091-3026), drawers/modales (3026-3826), resumen en detalle tarea (786-840) con orden de ejecuciÃ³n verificado

## Session 56d0bcc2-ada8-4c9b-9ba5-23aa04478125

- 2026-10-05 | yalo trackeo | commit | feat(novedades): migra envÃ­o de correos a YALO-API con AWS SES
- 2026-10-05 | yalo sendgrid | commit | feat(ses): agrega endpoint EnvioHtml con AWS SES v2
- 2026-10-05 | YALO | BUG | YALO_EMAIL_API_URL en secrets Supabase apunta a tÃºnel ngrok offline (ERR_NGROK_3200) â€” requiere levantar API localmente con ngrok o deployar a servidor permanente (ECS/EC2)

- 2026-10-13 | yalo console | commit | feat(crm): calendario en lista, filtro por responsable y fix notificaciones onboarding a SAC
- 2026-10-13 | yalo console api | commit | feat(crm-activities): endpoint deal-owners, fix hilo SAC onboarding y replica actividades del deal en SAC
2026-10-01 | YALO | DECISION | Sistema de colores dinÃ¡micos en mÃ³dulo QA: cada tipo de retorno (Bug/Sugerencia/Requerimiento) tiene activeColor y activeBg propios (rojo/dodoria, morado, azul brand) â€” mapeo en RETURN_TYPES.map con const active para refactorizaciÃ³n limpia en Qa.tsx lÃ­nea 221
2026-10-01 | YALO | BUG | QA preview persistencia: cambio estructura attachments de `string[]` (solo nombre, URL se perdÃ­a) a `{ name, url }[]` con data URL persistido en Zustand/Supabase â€” preview ahora abre tras recarga de sesiÃ³n
2026-10-01 | YALO | BUG | Case row interactividad: agrega `cursor-pointer` explÃ­cito, `transition-colors` o `transition-opacity` (150ms) a elementos clickeables, y `transition-all` al checkbox para cambios de color/borde â€” mejora feedback visual en mÃ³dulo QA
2026-10-01 | YALO | GENERAL | Report cards UX: agrega `cursor-pointer` + `transition-colors duration-150` a todos elementos interactivos, y display de evidencias del reporte como chips clickeables con lightbox para visualizaciÃ³n
2026-10-02 | YALO | BUG | Badge Release tab QA: contaba tareas "listo" sin filtrar por `enabledBoards`, mostraba "1" con tableros vacÃ­os â€” corregido en Qa.tsx lines 1485-1498 filtrando qaTasks/qaTickets por enabledBoards en useMemo

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | YALO | BUG | ValidaciÃ³n de liquidaciones: error en cÃ¡lculo o UI que valida "valores deben ser mayor a 0" o "valores a liquidar son mayores al total" â€” validaciones localizadas en LiquidacionesController.cs lÃ­neas 427-429 (PostLiquidacion, montoLiquidar <= 0) y 475-477 (total pedido excedido); tambiÃ©n en LiquidacionesService.cs lÃ­neas 82-89 (organizationId y employeeId <= 0)
2026-10-01 | YALO | BUG | Redondeo decimales en liquidaciones: Backend `ObtenerPagosPendientesAsync` topa saldoDisponible vs totalPedido para evitar "excede el total" con decimales; Frontend `loadOrdenesPendientes` filtra `.filter((orden) => orden.totalLiquidar > 0)` para no mostrar Ã³rdenes de CrÃ©dito con monto 0 en la lista
2026-10-01 | YALO | BUG | QA config dropdown: mismatch de claves al guardar â€” ahora usa estados reales del workflow (backlog, todo, progreso, review, done, canceled) con labels de ISTATUS; auto-envÃ­o agregado en setTaskStatus/setTaskState â€” verifica qaCfg?.autoSendStatus y envÃ­a automÃ¡ticamente si no hay entrada QA previa
2026-10-01 | YALO | DECISION | Grid campos mÃ³dulo QA: reorganiza 7 campos en 2 filas (BUILD, AMBIENTE, TESTER, ENVIADA A QA | PUBLICACIÃ“N, TIEMPO DE PRUEBA, EN COLA) con semÃ¡ntica: ENVIADA A QA (fecha sin hora), PUBLICACIÃ“N (release date o "â€”"), TIEMPO DE PRUEBA (sum time entries o "â€”"), EN COLA (dÃ­as/horas); removido campo ENVIADA POR

## Session 22a83bab-58b6-4972-a052-5758d237bc8d

2026-10-02 | yalo console api | feat | reassignmentReason en UpdateCrmDealDto + motivo en descripciÃ³n de actividad al reasignar asesor (rama fix/naidelyn/caracteres-especiales-slack)
2026-10-02 | yalo console | feat | Modal de motivo al reasignar asesor en deal drawer (5 motivos hardcodeados); botones Asignar/Reasignar con dropdown en kanban card de onboarding (solo manager/admin); campo SAC editable en drawer de onboarding via modal popup; "Tomar cuenta" eliminado del drawer de onboarding (rama feat/naidelyn/ventas)
2026-10-02 | yalo console | feat | Valor suscripcion USD/LPS en Historial de Pagos (calculado desde productos activos con tasa del ultimo pago); oculta productos con cantidad 0; dark mode tab Productos via section bg-neutral-white + :host-context(.dark)

## Session 1e9a05e0-795d-4bee-b9cd-c6a9f6e69ab7

2026-10-02 | YALO | BUG | ValidaciÃ³n liquidaciones: falso positivo "montos exceden total pedido" â€” saldoEfectivo redonda a 2 decimales, pero comparaciÃ³n usaba NormalizarMonto (4 decimales), causando diferencias hasta 0.003 en pedidos con centavos en 3er decimal; fix: redondea totalPedido y totalSolicitado a 2 decimales antes de validar
2026-10-02 | yalo bo api | commit | fix(liquidaciones): corrige falso positivo al validar monto contra total del pedido
2026-10-02 | YALO | BUG | Rutas con parÃ¡metros opcionales: soluciona error al listar Ã³rdenes donde querystring faltaba parametrizaciÃ³n en URL base â€” corregido en endpoint con cast seguro de queryParameters en hotfix/naidelyn/rutas
2026-10-02 | yalo console api | BUG | IntegraciÃ³n Stripe en notas de crÃ©dito (credit-notes.service.ts): `applyStripeBalance` llamaba a endpoint sin `/api/` prefix, causando 404 en YALO_API_Stripe; `reverseStripeBalance` ya tenÃ­a `/api/` â€” fix: aÃ±ade `/api/` al endpoint CustomerBalance para consistencia
2026-10-02 | YALO | CONFIG | Variables de entorno yalo console api: investigaciÃ³n de dÃ³nde estÃ¡n configuradas (AWS Secrets, .env de servidor, pipeline) para diferenciar prod/staging â€” revertido cambio previo para replantear configuraciÃ³n correcta
- 2026-10-02 | naide | commit | feat(customer-balance): agrega crâ”œâŒditos y reversiones (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | feat(crâ”œâŒdito): integra notas con Stripe y PDF fiscal (fix/naidelyn/caracteres-especiales-slack)
- 2026-10-02 | naide | commit | feat(console): integra notas de crâ”œâŒdito y mejoras operativas (feat/naidelyn/ventas)
- 2026-10-02 | naide | commit | fix(customer-balance): refuerza seguridad e idempotencia (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(crâ”œâŒdito): envâ”œÂ¡a moneda al saldo de Stripe (fix/naidelyn/caracteres-especiales-slack)
- 2026-10-02 | naide | commit | fix(customer-balance): asegura idempotencia y auditorâ”œÂ¡a (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): corrige configuraciâ”œâ”‚n y compatibilidad (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): maneja fallos parciales de auditorâ”œÂ¡a (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): garantiza unicidad y libera recursos (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): valida configuraciâ”œâ”‚n y entradas Stripe (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): explicita estado de procesamiento (feat/naidelyn/stripe)
2026-10-02 | YALO | FEATURE | Commit 5418174 pusheado en feat/naidelyn/ventas â€” integraciÃ³n completa de asignaciÃ³n/reasignaciÃ³n de leads en onboarding y pipeline de ventas
2026-10-02 | YALO | BUG | FormaPago inconsistencia en confirmaciÃ³n de pago: YaloConsole POST /organizations/confirm-pay envÃ­a FormaPago=3, pero YaloPOSBackofficeAPI endpoint PagoFacturaTransferencia/ActivarSuscripcion hardcodea formapago=2 en BD ignorando parÃ¡metro â€” Slack se genera correctamente (leyendo FormaPago=3), pero tabla muestra transferencia. Fix necesario en BO API para respetar el FormaPago enviado

## Session e43e024d-dccc-41eb-a6b9-5b46cd8739ce

2026-10-02 | CORINSA | BUG | Inventario septiembre - correlativo AI-18-A-2025-00170 no aparece en reportes (Inventario, AI, PronÃ³stico, Dashboard) por vigencia extendida con adendum
2026-10-02 | CORINSA | BUG | Inventario septiembre - correlativo AI-12-C-2022-00191 cambiÃ³ ramo a Salud pero reporterÃ­a sigue mostrando Tradicional
2026-10-02 | CORINSA | BUG | Inciso duplicado al agregar Ã­tem manual en Recursos>Suministros>Otros (Periodicidades: Por Ãºnica vez, Anualmente, Cada dos aÃ±os) â€” bloquea deploy a producciÃ³n; Jonathan coordinarÃ¡ after fix
2026-10-02 | CORINSA | GENERAL | Payback CD El Progreso desajuste: 2.25 actual vs 2.42 correcto â€” ~38 correlativos de trabajos ing/adendums no estÃ¡n sumando
2026-10-02 | CORINSA | CONFIG | Repos con cambios sin commitear: cpa webapi (rama 2025-cambio-estados, 1 archivo), cpa webapp (rama feat/naidelyn/reporteRentabilidad, 5 archivos), cpa ventas (rama feat/naidelyn/ventas2021, 17 archivos)

## Session 3ce5c0e8-22f6-45b4-837a-1b9598bf68a6

2026-10-03 | YALO | DECISION | Feature jerarquÃ­a de tareas: anÃ¡lisis UX para identificaciÃ³n de contexto â€” breadcrumb en vista detalle (/task/:id) vs columna proyecto/epic en lista (/tasks) vs ambas; propuesta de diseÃ±o pendiente
2026-10-03 | YALO | DECISION | Ciclos scoped a tableros: `Ciclo` con `boardId?` opcional, `createCycle` filtra activaciÃ³n por board, ReleaseTab toma Ãºltima release sin firmar, selector de tablero en /ciclos global, secciÃ³n "Ciclos" en ProjectDetail con listado, badge "Activo", botÃ³n "Nuevo ciclo" pre-asignado
2026-10-03 | YALO | DECISION | MÃ³dulo QA v2 completo: routes/Qa.tsx (inline-edit build/env, retornos Editar/Quitar, borrar con confirm, tab Release con firma, dedup releasedIn), store actions (createQaRelease, signRelease reescrito con releasedIn/aiGenerated/boardIds, createCycle con boardId, ciclos por tablero), types (boardId en Ciclo, releasedIn en QATask), Changelog ordena novedades ASC por id, CycleModal exportado con boardId, dark mode CSS (--color-bg, tokens navy/cyan/cell, semÃ¡foros), supabase migrations qa_module + qa_board_id
2026-10-03 | YALO | FEATURE | Sort novedades: ordena Changelog de mÃ¡s reciente a mÃ¡s antigua por id (Changelog.tsx), visible en tab "Novedades" de mÃ³dulo QA
2026-10-03 | yalo-trackeo | commit | feat(qa/ciclos/novedades): mÃ³dulo QA completo, ciclos por tablero y orden de novedades
2026-10-03 | YALO | CONFIG | Servidor MCP: desarrollo en rama feat-mcp-servidor, commit 4771095 pusheado â€” integraciÃ³n MCP para yalo-trackeo

## Session fe50de79-b897-4353-9e59-4e5736f3971d

2026-10-03 | La Bodega | BUG | Monitor de pedidos no apareciendo: tres causas raÃ­z histÃ³ricas resueltas por Daniel Brizuela en BD/config â€” (1) pedidos viejos (filtro fecha creaciÃ³n), (2) monitor sobreescribiendo estados desde otra bodega (patrÃ³n con MerendÃ³n), (3) monitores duplicados o correlativo incorrecto en establecimiento â€” diagnÃ³stico para #419148 (Mall GalerÃ­as) requiere validar antigÃ¼edad pedido, cantidad de monitores configurados, y si jalando estados de otra bodega
2026-10-03 | La Bodega | BUG | Orden 615931 no aparece en monitor de establecimiento 485 (Mall GalerÃ­as): codpuntoemision=1094 asignado pero establecimiento solo posee punto de emisiÃ³n 547 â€” monitor filtra por establecâ†’punto emisiÃ³n y no encuentra registro; soluciÃ³n: UPDATE ordenes SET codpuntoemision=547 WHERE codorden=615931
2026-10-03 | YALO | BUG | Monitor de Ã³rdenes: filtro de 24 horas estricto en controller (lÃ­nea 355) excluye Ã³rdenes con > 24h de antigÃ¼edad â€” diagnosticado orden con fechacreacion 2026-10-02 10:50 que a 2026-10-03 11:46 suma 25h, cae fuera de ventana; soluciÃ³n: cambiar fecha_creacion para caer dentro de Ãºltimas 24h o revisar lÃ³gica de rango temporal
2026-10-03 | La Bodega | BUG | Monitor de pedidos Mall GalerÃ­as: polling de 30 segundos comentado en home.page.ts (lÃ­nea 327-329); monitor carga Ã³rdenes solo al inicio y vÃ­a SignalR â€” orden con fecha actualizada 2026-10-02â†’2026-10-03 no dispara evento SignalR, requiere F5 manual o descomentar polling de actualizaciÃ³n periÃ³dica

## Session 615b1d85-6254-4ff1-8b94-a0a04ebc03ef

2026-10-04 | NAI | CONFIG | Engram auto-save: actualmente guardando automÃ¡ticamente (CLAUDE.md triggers), genera inquietud sobre consumo de tokens. Propuesta: afinar triggers para guardar solo decisiones arquitectÃ³nicas relevantes, no bugs menores ni config rutinarios. Alternativa: explicit save-on-demand quitando auto-save del CLAUDE.md

## Session 73c74dd6-0562-45cd-a487-3d7282570282

2026-10-04 | NAI | CONFIG | Code signing agendivo (Windows + macOS): target principal Honduras (mayormente Windows). Windows SmartScreen advierte sin certificado; macOS Gatekeeper bloquea sin firma Apple (baja prioridad para Honduras). OpciÃ³n evaluada: Azure Trusted Signing ($9.99/mes, SmartScreen-compatible, sin hardware token, integra con GitHub Actions). Apple Developer ($99/aÃ±o) diferido. DecisiÃ³n: implementar Azure Trusted Signing para Windows primero.
2026-10-04 | NAI | CONFIG | NormalizaciÃ³n line endings agendivo: configurado .gitattributes con `* text=auto eol=lf` (todos los archivos en LF) y `*.bat text eol=crlf` (batch scripts permanecen CRLF para Windows) â€” commit 46cedbe pusheado, CI deberÃ­a pasar ahora
2026-10-04 | NAI | CONFIG | Tauri 2 dmg build: commit e34a982 pusheado â€” bloque configuraciÃ³n `dmg` removido en Tauri 2 (incompatible), target `dmg` en `targets` sigue siendo vÃ¡lido; customizaciÃ³n de layout DMG debe ir dentro de `macOS` build config, no como bloque separado
2026-10-04 | NAI | GENERAL | Graphify (skill de visualizaciÃ³n de grapos/DAGs): configurado en CLAUDE.md pero nunca activado en uso real hasta hoy â€” sesiÃ³n explora estado actual y opciones para integraciÃ³n
2026-10-04 | NAI | BUG | onboarding: fix en src/stores/app.store.ts â€” crea empleado propietario solo si hay usuario autenticado; en modo offline (Supabase no configurado) inicia employees vacÃ­o sin lanzar error â€” resolve "No encontramos la cuenta propietaria activa"
2026-10-04 | NAI | CONFIG | agendivo: commit 71532dc pusheado â€” correcciÃ³n para pasar CI (verificable en conversaciÃ³n posterior)
2026-10-04 | NAI | CONFIG | Release v0.2.1 agendivo: tag pusheado, GitHub Actions workflow ejecutÃ¡ndose â€” buildea Windows + macOS y sube instaladores a Supabase

## Session 73c74dd6-0562-45cd-a487-3d7282570282

2026-10-05 | NAI | CONFIG | agendivo: reset de base de datos anterior (contenÃ­a migraciÃ³n desactualizada/incompatible), relanzado dev environment con Tauri dev â€” resoluciÃ³n de estado inconsistente de BD para nueva sesiÃ³n de desarrollo
2026-10-05 | NAI | DECISION | agendivo: flujo de acceso a suscripciÃ³n con Stripe â€” (1) registro nuevo â†’ `ensureBusiness` crea negocio en Supabase + inserta `past_due` automÃ¡ticamente; (2) pantalla "Tu acceso estÃ¡ pendiente" con clock icon y botÃ³n "Verificar acceso"; (3) webhook Stripe â†’ `sync-subscription` â†’ status `active` desbloquea app; (4) otros estados (cancelado, vencido) â†’ pantalla genÃ©rica "Sin acceso" con estado visible

## Session b623c5ee-0c39-4259-a75b-476c49c7ef62

2026-10-05 | YALO | CONFIG | ActivaciÃ³n de proyecto yalo-trackeo: rama feat-mcp-servidor, Ã¡rbol limpio, commits recientes en moduleQA y ciclos por tablero
2026-10-05 | YALO | DECISION | SES + Gmail DMARC policy: envÃ­o desde @gmail.com imposible por polÃ­tica `p=reject` de Google (solo servidores Google pueden enviar desde @gmail.com). SoluciÃ³n: usar dominio controlado (yalocobro.com, yalotechnologies.com) verificado en SES + configurar CNAME en DNS; toma ~5 minutos

## Session 8f8c98d5-80b7-45d5-8f6d-5d1aff068f52

2026-10-05 | NAI | CONFIG | AutenticaciÃ³n Edge Functions agendivo: flujo Bearer token â€” ADMIN_SECRET configurado en Supabase, replicado en app como "Admin Secret", cada request envÃ­a `Authorization: Bearer <valor>` validado por funciÃ³n
2026-10-05 | NAI | BUG | nai-admin: AuthProvider.setPin() no seteaba _isUnlocked=true, causando redirecciÃ³n a PIN despuÃ©s de crear PIN â€” fix: setPin() ahora actualiza _isUnlocked y notifica listeners para permitir navegaciÃ³n a /projects
2026-10-05 | NAI | CONFIG | nai-admin: rebuild APK release tras creaciÃ³n del proyecto Flutter â€” compilaciÃ³n en progreso
2026-10-05 | NAI | CONFIG | agendivo release v0.2.1: instalaciÃ³n y configuraciÃ³n de credenciales Supabase (URL + Admin Secret) via modal de setup en app â€” workflow eliminaciÃ³n/reinicio de proyecto para reconfiguraciÃ³n
2026-10-05 | NAI | BUG | nai-admin: funcionalidad delete bloqueada en app mÃ³vil â€” investigaciÃ³n iniciada para identificar causas (UI no ejecuta acciÃ³n, lÃ³gica en backend, o validaciÃ³n de permisos)
2026-10-05 | NAI | BUG | nai-admin: problemas de carga de datos desde backend â€” "sigue sin cargar" indica timeouts o errores en peticiones HTTP/sincronizaciÃ³n
2026-10-05 | NAI | BUG | nai-admin APK: faltaba permiso `INTERNET` en AndroidManifest.xml â€” APK generado sin conectividad red; agregado `<uses-permission android:name="android.permission.INTERNET"/>` y rebuild release apk completado
2026-10-05 | NAI | CONFIG | nai-admin: instalaciÃ³n y prueba post-fix de APK con permiso de internet â€” testeo de funcionalidad "Negocios" en dispositivo mÃ³vil
2026-10-05 | YALO | BUG | YALO-API-Sendgrid: .NET 8 cambiÃ³ puerto default 80â†’8080 pero ECS/ELB mapeaba puerto 80, causando que contenedor no respondiera en deployment. Fix: environment variable ASPNETCORE_URLS=http://+:80 para escuchar en puerto correcto (commit c1f2c65). Requiere rebuild de imagen en ECS.
2026-10-05 | YALO | CONFIG | ECS/ELB health checks pendientes: deployment revisiÃ³n 49 exitoso (1 running), ELB status "Unknown" se resuelve en prÃ³ximos minutos tras health checks completados (normal en inicial deployment) â€” requiere actualizar secret YALO_EMAIL_API_URL en Supabase Settingsâ†’Edge Functionsâ†’Secrets a `https://apiv2sendgriddev.yalocobro.dev/api/` para resolver error 404 del ngrok offline
2026-10-05 | YALO | CONFIG | SES deliverability: bounce en Gmail indica SES enviÃ³ correo exitosamente pero Gmail lo rechazÃ³ porque dominio `cit.hn` no tiene SPF/DKIM configurado para AWS SES â€” problema es configuraciÃ³n de dominio, no cÃ³digo. SoluciÃ³n: (1) Verificar dominio `cit.hn` en SES + agregar CNAME records en DNS, o (2) usar dominio de producciÃ³n (yalocobro.com/yalotechnologies.com) como sender identity verificado en SES

## Session f8acfac3-b27e-47ef-bdcc-b66544599219

2026-10-06 | CORINSA | GENERAL | ReporterÃ­a CPA: identificaciÃ³n del SP usado en endpoint GET /api/Reportes/ReporteInventario â€” endpoint llamado `GetReporteInventario()` en repo ejecuta SP `[dbo].[UCCv2_GetDetallePronosticoVenta]` que recibe parÃ¡metro @FECHA (string), nombre confuso comparado con endpoint
2026-10-06 | CORINSA | BUG | Incisos duplicados en contrato (Recursos>Suministros>Otros con Periodicidades: Por Ãºnica vez, Anualmente, Cada dos aÃ±os) â€” root cause: TVF `UCCv2_Function_GetClausulasContrato` genera 2 filas por Ã­tem manual; raÃ­z en `ClausulasDetalle` donde existen dos entradas con mismo `CodPeriodicidad` (una con `CodSubCategoriaRecurso = NULL`, otra con `= 211 "Otros"`). JOIN de TVF no discrimina bien para Ã­tems manuales (`NombreRecursoManual IS NOT NULL`). Fix: verificar duplicados en ClausulasDetalle con queries diagnÃ³stico + ajustar condiciÃ³n de la TVF. C# backend estÃ¡ limpio (guardado temporal y parsers correctos).
2026-10-06 | YALO | GENERAL | ReemplazÃ³ emojis y Remix Icons por SVGs de Tabler en preview de contactos/redes sociales de SettingsComms.tsx: mail/phone/whatsapp Tabler SVG, Instagram/Facebook/LinkedIn/WhatsApp SVG, fallback Remix Icon para TikTok/YouTube/X/etc
2026-10-05 | YALO | CONFIG | Edge Function `buildFooter()`: deployed con estructura en tabla, secciones con `border-top`, badges oscuros con texto, y copyright usando el nombre del workspace â€” integraciÃ³n en yalo-trackeo enviador de emails
2026-10-06 | YALO | CONFIG | buildEmailHtmlFromBlocks: integraciÃ³n final de footer con workspaceName, padding:0 en <td>, estructura alineada con preview â€” compilaciÃ³n limpia en yalo-trackeo, emails envÃ­an con footer nuevo

## Session b623c5ee-0c39-4259-a75b-476c49c7ef62

2026-10-05 | YALO | BUG | Novedades email footer: fondo gris #F3F4F6 en cada <td> del footer para mantener estilo consistente en emails enviados vs preview
2026-10-05 | YALO | BUG | Ãconos contactos SettingsComms.tsx: reemplazÃ³ emojis y Remix Icons por SVGs de Tabler (mail/phone/whatsapp) para mantener consistencia visual con preview de emails
2026-10-05 | YALO | CONFIG | SVG en emails: sustituciÃ³n `<svg>` inline por `<img src="data:image/svg+xml;base64,...">` para compatibilidad con clientes email (Gmail, Outlook) que bloquean SVG inline pero renderizan `<img>` sin problema. Paths de Tabler embebidos en data URI.
2026-10-06 | YALO | BUG | Social icons email: renombrados a `social-instagram.png`, `social-facebook.png`, etc. con color secundario #52BAE1 (sin cÃ­rculo de fondo); tabla de contactos ahora usa `align="center"` + `cellspacing="8"` sin flex para mÃ¡xima compatibilidad con clientes email
- 2026-10-06 | naide | commit | fix(ventas): detecta errores al reasignar vendedor (feat/naidelyn/ventas)
- 2026-10-06 | naide | commit | fix(crm-deals): corrige persistencia al reasignar vendedor (fix/naidelyn/caracteres-especiales-slack)
- 2026-10-06 | naide | commit | fix(ecommerce): corrige navegaciâ”œâ”‚n, catâ”œÃ­logo, sucursales y blogs (temp/naidelyn/fixes)
- 2026-10-06 | naide | commit | Merge branch 'development' of https://github.com/Creative-Information-Technologies/LaBodegaEcommerce into temp/naidelyn/fixes (temp/naidelyn/fixes)

## Session 3c9c30c4-debc-41af-b4cc-2be6b6929e21

2026-10-07 | YALO | GENERAL | Feedback mÃ³dulo QA: comentarios sin evidencia obligatoria, timeline para regresiones+nuevos casos, estado "Fix listo" con notificaciÃ³n, cierre en timeline, cÃ³digos HTTP en reportes, barra de bÃºsqueda, reportes excluyen no-completados, textos descriptivos en sugerencias/requerimientos
2026-10-07 | YALO | DECISION | AnÃ¡lisis QA feedback: 9 tareas priorizadas â€” (1) barra bÃºsqueda FeedbackBoard, (2) estado "fix_listo" + notificaciÃ³n, (3) timeline activity para Solicitud (creaciÃ³n, regresiÃ³n, completado), (4) evidencia no-obligatoria en QA, (5) cÃ³digos HTTP en reportes, (6) reiniciar pruebas sin completar release, (7) reporte por estado+release, (8) labels descriptivos tipo/mÃ³dulo, (9) integraciÃ³n activity log en RequestDetail
2026-10-07 | YALO | CONFIG | Ancho mÃ¡ximo tabs yalo-trackeo: Integraciones/Equipo/Roles/Estados/QA/Tickets sin lÃ­mite (responsive), Reuniones `max-w-[720px]`, Labels `max-w-[680px]` (contenido simple, evita estiramiento horizontal en full-width)
2026-10-07 | YALO | commit | feat(qa): agrega mejoras del mÃ³dulo QA (9 items solicitados por Cristian) â€” estado fix_listo, activity timeline en solicitudes, evidencia no-obligatoria, cÃ³digos HTTP, barra bÃºsqueda, reiniciar pruebas, labels con hints, migration Supabase

## Session b623c5ee-0c39-4259-a75b-476c49c7ef62 (continuaciÃ³n)

2026-10-05 | YALO | FEATURE | feat(perfil): agrega pantalla de perfil con ediciÃ³n de nombre y contraseÃ±a â€” Profile.tsx (secciones Identidad/Correo/ContraseÃ±a), edita nombre (upsert en tabla equipo + actualiza store), cambia contraseÃ±a vÃ­a supabase.auth.updateUser; rutas App.tsx (/w/:wsId/profile); navegaciÃ³n GlobalTopbar.tsx ("Mi perfil" navega a /profile)

## Session 3c9c30c4-debc-41af-b4cc-2be6b6929e21 (continuaciÃ³n)

2026-10-07 | YALO | FEATURE | TaskDetail.tsx: panel QA en "Solicitudes de origen" extiende card con estado, errorCode (HTTP), Ãºltimas 3 actividades con timestamp, botones "Marcar Fix Listo" y "Reiniciar pruebas" â€” condicional isQa = r.type === 'qa' delimita render, store actions classifyRequest/reiniciarPruebas integrados
2026-10-07 | YALO | FEATURE | Panel QA solicitudes: estado coloreado con RSTATUS catalog, errorCode en badge monoespaciado, activity entries (ActivityEntry type) muestran descripciÃ³n + timeAgo, botones habilitados segÃºn status (fix_listo/completado desactivan "Marcar Fix Listo"), transiciones UI lisas (transition-colors 150ms)
2026-10-07 | YALO | FEATURE | Qa.tsx: timeline de QA invertida (mÃ¡s reciente arriba) â€” permite visualizar casos mÃ¡s recientes sin scroll
2026-10-07 | YALO | FEATURE | TaskDetail.tsx: attachments de casos QA como links clickeables â€” mejora accesibilidad a evidencias en solicitudes
2026-10-07 | YALO | BUG | fix(qa): corrige reiniciar prueba, padding timeline y badge DEV â€” (1) botÃ³n "Reiniciar prueba" llamaba advanceQaTask('aprobado') que marcaba tarea como listo, ahora usa reiniciarPruebas con status='probar' sin registrar intento falso; (2) paddingBottom timeline usaba tl.isLast invertido post-.reverse(), ahora usa i < length-1 consistente con conector; (3) badge DEV mostraba 'Reportado' hardcodeado, ahora usa st.label/st.color del estado real â€” commit 3371ff9
2026-10-07 | YALO | DECISION | AuditorÃ­a store Solicitud (updateRequestContent/classifyRequest): verificaciÃ³n de integridad persistRows() y serializaciÃ³n solicitudâ†’ row en persist.ts; arquitectura write-through con queue de cambios; validaciÃ³n de permisos en updateRequestContent (permDenied check 'editar_solicitud') â€” anÃ¡lisis completado sin hallazgos crÃ­ticos
2026-10-07 | YALO | BUG | fix(qa): 4 bugs â€” releasedIn no persistÃ­a (tareas liberadas reaparecÃ­an en releases tras reload); evidencia no abrÃ­a tras reload (openPreview usaba previewMap vacÃ­o en vez de c.evidenceUrl); attachments de casos nuevos se guardaban como base64 en JSONB (ahora van a Storage); expandedReports se desfasaba al eliminar un caso (resetea al confirmar delete) â€” commit 4ef64f3

## Session 798cab57-c118-483a-a449-2f5d538bb092

2026-10-07 | NAI | GENERAL | ActivaciÃ³n de proyectos: nai agendivo (rama main, status limpio, Ãºltimo commit bump v0.2.2) y nai admin (nuevo repo registrado en projects-registry.md)
2026-10-07 | NAI | BUG | Dispositivo vinculado a otra cuenta: SQLite local guardaba auth_user_id del primer usuario; assertDeviceAccount comparaba ID guardado vs actual y lanzaba error en dev. Fix: se limpiÃ³ device_metadata para permitir re-vinculaciÃ³n â€” resoluciÃ³n de conflicto de mÃºltiples cuentas por dispositivo
2026-10-07 | NAI | BUG | stripe_price_id null: edge function admin-update-subscription hacÃ­a UPDATE (0 filas afectadas) mintiendo success=true, nunca creaba suscripciÃ³n. Fix: cambiar a INSERT cuando no existe fila + usar 'manual' como placeholder + hacer campo nullable en Zod/Supabase + parchear fila existente con UPDATE a 'manual'
2026-10-07 | NAI | FEATURE | nai-admin: detalle de negocio muestra tres cards en fila (Clientes activos sin borrar, Servicios activos sin borrar, Ventas=citas completadas sincronizadas en Supabase) â€” integraciÃ³n de vistas de datos resumidas en UI de detalles de negocio
2026-10-07 | NAI | CONFIG | IntegraciÃ³n Stripe desactivada en agendivo: UI de pagos removida, flujo de suscripciÃ³n simplificado para desarrollo local sin transacciones reales
2026-10-07 | NAI | FEATURE | KPI cards nai-admin: agrega cards de resumen (clientes, servicios, ventas) en pantalla principal â€” vistas de datos sincronizadas desde Supabase
2026-10-07 | NAI | CONFIG | InstalaciÃ³n APK nai-admin en mÃ³vil: permiso INTERNET agregado a AndroidManifest.xml, rebuild release completado tras diagnosticar falta de conectividad de red
2026-10-07 | NAI | CONFIG | Push notifications nai-admin: Firebase FCM completo (Edge Functions admin-register-token + admin-notify-inactive, migration admin_fcm_tokens, Flutter FcmService) â€” bloqueado en credentials (google-services.json, FIREBASE_SERVICE_ACCOUNT_JSON, FIREBASE_PROJECT_ID en Supabase secrets) y pg_cron diario para inactividad 15 dÃ­as
2026-10-07 | NAI | FEATURE | KPIs con rango de fechas: chip de fechas encima de cards; date picker al tocarlo; filtros por created_at (clientes/servicios) y starts_at (ventas)
2026-10-07 | NAI | CONFIG | Firebase credenciales reales: google-services.json real, firebase_options.dart generado con credenciales Naidelyn, APK compilado con FCM real
2026-10-07 | NAI | FEATURE | FCM tokens automÃ¡ticos: app pide permisos al abrir, guarda token automÃ¡ticamente, registra en Supabase al entrar pantalla negocios
2026-10-07 | NAI | FEATURE | Edge functions deployadas: admin-register-token + admin-notify-inactive con soporte CRON_SECRET
2026-10-07 | NAI | DECISION | FunciÃ³n SQL get_inactive_businesses(cutoff_date): lista negocios activos sin ventas en X dÃ­as para notificaciones
2026-10-07 | NAI | CONFIG | Cron job diario: pg_cron + pg_net habilitadas (supabase db push), schedule 09:00 UTC llamando admin-notify-inactive con x-cron-secret token

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n)

2026-10-07 | NAI | GENERAL | Testing dev environment: setup Tauri dev server + Firebase/Flutter logs capture para validaciÃ³n de agendivo en lista de negocios
2026-10-07 | NAI | BUG | admin-list-businesses PostgREST relation mismatch: subscriptions tiene business_id como primary key (1-a-1), PostgREST retorna objeto directo, no array â€” cÃ³digo hacÃ­a `b.subscriptions?.[0]` que siempre era undefined, rompiendo conteo status activo en summary. Fix: removido `[0]` para acceso directo al objeto suscripciÃ³n â€” deploy admin-list-businesses completado
2026-10-07 | NAI | CONFIG | agendivo date range picker: styling oscuro (AppColors.ground/surface) con franja de rango naranja semitransparente (#33F5A623), dÃ­as seleccionados en cÃ­rculo naranja con texto oscuro (accent color), botÃ³n "Save" renombrado a "Guardar" â€” APK build completado
2026-10-07 | NAI | FEATURE | Selector de servicios agendivo: campo seleccionable con servicios (ej. "Manicura Â· 30 min Â· HNL 100.00"), autocompleta monto en formulario de cita sin sesiÃ³n autenticada

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 2)

2026-10-07 | NAI | DECISION | POS redesign agendivo: display oscuro con monto prominente en la parte superior, integraciÃ³n con formulario de servicios, hot reload aplicado correctamente en Tauri dev server â€” diseÃ±o visual validado y deploying en rama main

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 3)

2026-10-07 | NAI | BUG | nai-admin registerFcmToken: error handling inconsistente en admin_api_client.dart â€” reemplazÃ³ `_checkStatus()` helper (reutilizado en otros mÃ©todos) con inline check + ApiException thrown con mensaje HTTP explÃ­cito; retorna HTTP statusCode + response.body para debug de 401 invalid jwt â€” validado con app mÃ³vil
2026-10-08 | NAI | BUG | Timezone Honduras (UTC-6) en agendivo: `new Date("2026-10-07T19:00").toISOString()` convertÃ­a al UTC resultando "2026-10-08T01:00:00.000Z", `.slice(0,10)` daba "2026-10-08" en lugar de "2026-10-07" â€” no matcheaba comparaciÃ³n de fechas en paid-screen y expenses-screen. Fix: usar `format(new Date(p.paidAt), "yyyy-MM-dd")` que convierte UTC de vuelta a hora local antes de comparar (misma soluciÃ³n en `spentAt`)

## Session e0566b7b-330d-43da-94ad-366f27919ae1

2026-10-09 | YALO | BUG | AddTrialDays.cs â€” DateTime.Now.AddDays() causa doble cobro en suscripciones activas: reinicia ciclo de facturaciÃ³n desde ahora, no desde fin del perÃ­odo actual. Afectados: Johan Andrade (Novedades Gema), Paola (Nort1401). Fix: cambiar a subscription.CurrentPeriodEnd.AddDays(model.dias)
2026-10-09 | YALO | BUG | PagoFacturaController.cs webhook flow: payment link manual genera factura nueva cuando Stripe ya cobrÃ³ automÃ¡ticamente (ambos disparas webhooks, segundo genera factura porque no hay "pendiente" en BD) â€” afectado caso Paola. Root cause: lÃ³gica busca factura pendiente, si no existe genera nueva, sin validar si ya fue pagada por otro medio
2026-10-09 | YALO | BUG | Paola (Nort1401) doble cobro: dos facturas mismo perÃ­odo (ago 28 â€“ sep 28) â€” una por tarjeta, una por link. InvestigaciÃ³n: AddTrialDays causa reinicio ciclo desde DateTime.Now; webhook double-charge por falta de idempotencia en validaciÃ³n de pagos ya procesados

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 4)

2026-10-09 | NAI | BUG | agendivo modal portal: modales montados dentro de `<section class="page-enter">` con transform de animaciÃ³n que afectaba overlay â€” z-index no cubrÃ­a toda la app. Fix: montar modales en `document.body` directamente con `ReactDOM.createPortal()`, fuera del contexto de transform â€” overlay ahora cubre correctamente y scroll del form funciona sin restricciones

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 5)

2026-10-10 | NAI | GENERAL | agendivo payment-receipt: cambios visuales para consistencia con YALO â€” fuente system-ui/sans-serif en lugar de Courier New, filas de datos inline en lugar de justify-between, ReceiptRowBlock para CAI y Rango con word-break, texto total "Total a pagar" (era "Monto recibido"), CSS print simplificado sin flex-direction hack
2026-10-10 | NAI | BUG | agendivo payment-receipt modal portal: modales renderizados en document.body con createPortal() en lugar de dentro de secciÃ³n con transform â€” z-index y overlay ahora cubren correctamente sin restricciÃ³n de scroll

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 6)

2026-10-07 | NAI | CONFIG | agendivo Tauri dev build: levantar servidor dev en progreso, compila cambios de app desktop con hot reload habilitado

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 7)

2026-10-10 | NAI | CONFIG | agendivo payment-receipt styling: aÃ±adido word-break:break-all y overflow-wrap:anywhere al .receipt-fiscal-header para forzar CAI dentro de 80mm del sheet (ajuste de layout para impresiÃ³n)

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 8)

2026-10-10 | NAI | CONFIG | agendivo Tauri dev server: levantamiento exitoso con `npm run tauri dev`, vite en localhost:1420, frontend hot-reload habilitado para testing en progress

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 9)

2026-10-10 | NAI | BUG | Device auth vinculado a otra cuenta: SQLite local guardaba auth_user_id del primer usuario, bloqueaba re-vinculaciÃ³n. Fix: limpiar device_metadata, permitir mÃºltiples cuentas por dispositivo sin error tenancy

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 10)

2026-10-10 | NAI | CONFIG | agendivo payment-receipt YALO template: estructura definitiva alineada â€” nombre negocio bold centrado, RTNâ†’CAI inline, dashes separadores, folio centrado, cliente/telÃ©fono/fecha/atendido por, tabla Producto|Total con prefijo [G]/[E], subtotales Exento/Gravado/ISV 15%, **Total a Pagar** destacado, forma de pago con dashes igual que YALO, fecha lÃ­mite emisiÃ³n/rango autorizado, footer gracias â€” Vite dev reloading correctamente con hot module replacement

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 11)

2026-10-07 | NAI | CONFIG | nai-admin registry: agregado proyecto a projects-registry.md bajo secciÃ³n NAI (carpeta nai-admin, stack Flutter)
2026-10-07 | NAI | BUG | agendivo subscription activation: usuario no puede activar suscripciÃ³n en nai-admin â€” investigaciÃ³n en progreso para identificar causas en flujo de integraciÃ³n entre agendivo y nai-admin

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 12)

2026-10-10 | NAI | DECISION | agendivo payment-receipt refactor: cambio de tipo `taxBreakdown: TaxBreakdown | null` a `taxBreakdown: TaxBreakdown` (obligatorio) â€” lÃ³gica siempre calcula breakdown de impuestos (exento, gravado15, isv15), eliminado ternario condicional en UI (payment-receipt.tsx), simplifica renders eliminando caso nulo
2026-10-10 | NAI | CONFIG | agendivo subscription-card: mensaje sin fecha vencimiento cambiado a "Para renovaciones o cambios de plan, contactÃ¡ al soporte." (antes: "El pago se procesa de forma segura en Stripe.")
2026-10-10 | NAI | CONFIG | payment-methods-card: limpia imports y props sin usar (remueve BuiltinPaymentMethod import, method prop de BuiltinRowProps) para compilaciÃ³n TypeScript limpia â€” solo errores pre-existentes del spec de cloud-sync

2026-10-10 | NAI | GENERAL | AnÃ¡lisis de mercado Agendivo: mercado objetivo son pequeÃ±os negocios de servicio en Honduras (salones, barberÃ­as, spas) que necesitan control de citas y cobros; diferenciador clave es facturaciÃ³n SAR (CAI, rango, ISV) lista; pendientes: reportes bÃ¡sicos, multi-usuario/PIN caja, precio y modelo de distribuciÃ³n

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n 13)

2026-10-07 | NAI | GENERAL | ExploraciÃ³n Supabase agendivo: estructura de datos y disponibilidad de campos para implementaciÃ³n de reportes â€” sesiÃ³n enfocada en mapeo de tablas y relaciones para anÃ¡lisis de negocio

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n final)

2026-10-07 | NAI | FEATURE | agendivo Reportes: paneles diario y mensual ahora consultan Supabase directamente para datos en tiempo real (sin cache local), botones "Excel" y "PDF" separados â€” PDF usa jsPDF con autotable, formato A4 landscape automÃ¡tico, estado cargando "Cargando datos desde Supabaseâ€¦"
2026-10-07 | NAI | FEATURE | agendivo PIN de equipo: Settings card "PIN de equipo" con numpad modal para crear/cambiar/quitar PIN â€” header muestra icono candado cuando PIN estÃ¡ configurado, app arranca bloqueada automÃ¡ticamente si hay PIN seteado, pantalla bloqueo cubre toda app, sin persistencia isLocked (siempre locked on startup si PIN existe)

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n revisiÃ³n final)

2026-10-10 | NAI | BUG | nai-admin suscripciÃ³n usuario: edge function admin-update-subscription no persistÃ­a cambios cuando stripe_price_id era null â€” INSERT no ejecutaba por validaciÃ³n, UPDATE retornaba 0 filas pero reportaba success=true. Fix: cambiar lÃ³gica a INSERT OR UPDATE con 'manual' placeholder + hacer campo nullable + parchear fila existente
2026-10-10 | NAI | FEATURE | nai-admin tarjetas negocio: mÃ³dulo Equipo con botones candado por empleado â€” candado gris (sin PIN) â†’ click crea PIN con numpad; candado azul (con PIN) â†’ botÃ³n para quitar + confirmaciÃ³n re-ingresando PIN dos veces
2026-10-10 | NAI | FEATURE | agendivo pantalla de bloqueo: grid de empleados activos mostrados con Ã­conos candado pequeÃ±os si tienen PIN, click ingresa numpad para 4 dÃ­gitos, empleados sin PIN inician sesiÃ³n directamente
2026-10-10 | NAI | CONFIG | agendivo botÃ³n bloqueo header: se activa automÃ¡ticamente cuando hay al menos un empleado con PIN configurado
2026-10-07 | NAI | BUG | Sistema de folios Ãºnico por caja: pagos de cajas distintas generaban folios duplicados â€” implementado prefijo Ãºnico derivado de device_id (primeros 4 chars hex, ej: A1B2) combinado con contador atÃ³mico en device_metadata. Folio generado como A1B2-000001, A1B2-000002, etc. Nunca duplica entre cajas, inmutable en tabla payments.receipt_folio; fallback calculado para pagos migrados sin SP actualizado

## Session 798cab57-c118-483a-a449-2f5d538bb092 (continuaciÃ³n - Sistema de roles y permisos)

2026-10-10 | NAI | DECISION | Sistema de roles y permisos agendivo: EmployeesScreen tabs Profesionales+Roles, cada empleado con <select> asignable a rol desde useRolesStore, AppShell filtra navegaciÃ³n por permisos del activeEmployeeId â€” restricciÃ³n Settings omitida intencionalmente para permitir setup del negocio
2026-10-10 | NAI | CONFIG | Dropdown custom roles agendivo: reemplaza @/components/ui/select (no disponible) con toggle customizado Tailwind + Badge con "Actual"/"Sistema" â€” compilaciÃ³n TypeScript limpia sin errores, diseÃ±o con fondo secondary, Ã­cono Shield primary, rotaciÃ³n chevron al abrir, items con Ã­cono cuadrado pintado primary cuando activo
2026-10-07 | NAI | DECISION | Flujo reactivo cambio de rol agendivo: (1) cambias rol empleado â†’ employeeRoles en store se actualiza; (2) Nav actualiza inmediatamente porque activePermissions selecciona directamente del estado (no funciÃ³n derivada), Zustand re-renderiza AppShell con secciones correctas; (3) si empleado activo pierde permiso secciÃ³n actual â†’ useEffect en App.tsx redirige a primera secciÃ³n disponible; (4) sin empleado activo â†’ todos Ã­tems visibles como antes
2026-10-07 | NAI | DECISION | SincronizaciÃ³n offline agendivo: anÃ¡lisis arquitectura Yalo POS (IndexedDB+Dexie, sync flag por registro, 500ms delay + 30s fallback, SignalR WebSocket) vs Agendivo (SQLite+Tauri, flag global has_pending_changes, 1.2s trigger automÃ¡tico) â€” recomendaciÃ³n: adoptar sync flag granular por registro para multi-dispositivo futuro (diferencia key: Yalo sabe exactamente quÃ© filas pendientes, Agendivo sube todo desde lastSyncedAt)
2026-10-10 | NAI | DECISION | AnÃ¡lisis riesgo de pÃ©rdida de datos agendivo: flujo pull con guardia de versiÃ³n (excluded.version > current.version OR versiones iguales pero updated_at mÃ¡s reciente), soft-deletes con deleted_at propagado, fallback seguro sin actualizar lastSyncedAt si falla. Riesgos identificados: (1) dos dispositivos editando mismo registro offline â†’ "last write wins" sin merge de campos (muy baja probabilidad operativa), (2) stored procedure sync_push opaco sin verificaciÃ³n de guardia de versiÃ³n (requiere audit en Supabase), (3) roles/PINs en localStorage sin respaldo (se pierden al limpiar app). RecomendaciÃ³n: verificar SP sync_push en Supabase para confirmar conflict resolution equivalente

## Session 4f593bdf-fa55-4dbf-a30d-489673ccedb3

2026-10-11 | NAI | CONFIG | agent-ai-config: correcciÃ³n permanente en .gitignore â€” `mcp-servers/**/node_modules/` excluido para no trackear dependencias MCP, commit 4d7c22f pusheado a master

## Session e24fa3b3-6d2e-4833-9913-69ab74c4c6f9

2026-10-19 | NAI | DECISION | Gap analysis gentle-ai: investigaciÃ³n paralela con dos subagentes â€” comparar setup actual (CLAUDE.md, settings.json, memory manual, skills superpowers) vs componentes de gentle-ai (Engram Go MCP binario 26 herramientas, SDD framework 9 fases, skills React/TS/Tailwind, Context7/Notion MCPs, persona + security denylist)
2026-10-11 | NAI | DECISION | API Testing loop: tabla de 12 tipos de pruebas (unitaria, integraciÃ³n, funcional/endpoint, contrato, E2E, regresiÃ³n, smoke, rendimiento, carga, seguridad, validaciÃ³n datos, fuzzing) con criterio de cuÃ¡ndo aplica cada una + rangos por complejidad (CRUD simple 3â€“5, con validaciones 5â€“10, con auth +3â€“5) y paso de deduplicaciÃ³n antes de commit â€” trigger automÃ¡tico `/testing` al mencionar "nuevo endpoint / nueva funciÃ³n en API"
2026-10-11 | NAI | DECISION | FE Testing loop: tabla de 11 tipos de pruebas (unitaria, componente, integraciÃ³n, E2E, regresiÃ³n visual, accesibilidad, rendimiento, compatibilidad, usabilidad, seguridad, smoke) con criterio de cuÃ¡ndo aplica cada una + rangos por complejidad (UI puro 2â€“4, con lÃ³gica 4â€“8, conectado a servicios 6â€“12) y paso de deduplicaciÃ³n antes de commit â€” trigger automÃ¡tico `/testing` al mencionar "nuevo componente / pÃ¡gina / vista / pantalla FE"
2026-10-11 | NAI | DECISION | Criterio de cantidad de pruebas: proporcional a complejidad no a arbitrio; nunca permutaciones redundantes (elimina duplicados antes de commitear); rangos orientativos por contexto (botÃ³n con disable prop = 3 pruebas, no 40)
2026-10-11 | NAI | DECISION | API Testing loop: tabla de 12 tipos de pruebas (unitaria, integraciÃ³n, funcional/endpoint, contrato, E2E, regresiÃ³n, smoke, rendimiento, carga, seguridad, validaciÃ³n datos, fuzzing) con criterio de cuÃ¡ndo aplica + rangos por complejidad (CRUD simple 3â€“5, con validaciones 5â€“10, con auth +3â€“5) â€” trigger automÃ¡tico `/testing` al mencionar "nuevo endpoint / nueva funciÃ³n en API"
2026-10-11 | NAI | DECISION | FE Testing loop: tabla de 11 tipos de pruebas (unitaria, componente, integraciÃ³n, E2E, regresiÃ³n visual, accesibilidad, rendimiento, compatibilidad, usabilidad, seguridad, smoke) con criterio de cuÃ¡ndo aplica + rangos por complejidad (UI puro 2â€“4, con lÃ³gica 4â€“8, conectado a servicios 6â€“12) â€” trigger automÃ¡tico `/testing` al mencionar "nuevo componente / pÃ¡gina / vista / pantalla FE"
2026-10-11 | NAI | CONFIG | agent-ai-config: .gitignore â€” excluir `mcp-servers/**/node_modules/` para no trackear dependencias MCP
2026-10-19 | NAI | DECISION | Engram official migration: gap analysis completado â€” oficial (FTS5+mem_judge) > actual (MEMORY.md+Haiku). Pasos: (1) go install engram@latest; (2) engram setup claude-code auto-config; (3) settings.json reemplazar memory por engram MCP config; (4) Hook Stop simplificable. SDD: features sÃ­, hotfixes no. Skills: superiores. Jira/Notion: OK via Context7. Denylist: ALTA prioridad â€” defaultMode:dontAsk + 3 BDs prod
2026-10-11 | NAI | DECISION | Loops de arquitectura FE: YaloConsole (Angular) con core/modules lazy-loaded/shared standalone + inject(); yalo-trackeo (React) con components flat/routes por pÃ¡gina/store Zustand â€” documentaciÃ³n de patrones en CLAUDE.md, commit a83662a pusheado
2026-10-11 | NAI | CONFIG | agent-ai-config .gitignore: actualizaciÃ³n permanente para excluir `mcp-servers/**/node_modules/` y `mcp-servers/**/dist/` â€” previene tracking de dependencias transitorias de MCP servers locales y compilados

## Session 4251dca8-8196-41b5-a2d2-7d2792c9025e

2026-10-17 | YALO | BUG | GetExpenseAnalysisCommandOutput de AWS Textract â€” `Blocks` no existe a nivel raÃ­z, estÃ¡n dentro de `ExpenseDocument.Blocks` â€” fix en AwsTextractService: extrae bloques con `flatMap((d) => d.Blocks ?? [])` desde expenseDocs en analyzeExpense()
2026-10-17 | YALO | REVIEW | PR 11659 (API) + PR 11658 (FE) â€” feat(organization): indicador de prÃ³rroga de pago â€” AggregateError en TLS:uploadImagePay (existente, no PRs) â‰  OCR nuevo /ocr-receipt; error apunta a configuraciÃ³n Stripe (URL/token .env) mal en local vs endpoint nuevo diagnosticado correctamente

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

2026-10-14 | YALO | GENERAL | ActivaciÃ³n proyecto yalo-trackeo: rama Fix/Amy/noti (limpia, Ãºltimo commit 2026-10-14 deno-Amy de Amy Valeria Fajardo); revisiÃ³n de 425 commits en rama con desarrollo de notificaciones (Amy) + trabajo previo de Naidelyn

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b

2026-10-12 | YALO | GENERAL | ActivaciÃ³n proyecto yalo console: skill proyecto resolviÃ³ aliases desde projects-registry.md â€” yalo console (YaloConsole, Node/TS FE) en rama feat/naidelyn/ventas (limpia, Ãºltimo commit vendedor reassignment 2026-10-06); yalo console api (YALO_API_Administrator, Node/TS) sin upstream tracking. Lanzado status en paralelo via subagents Haiku

## Session b244a219-4c94-4142-8337-320fd12a1d08

2026-10-15 | YALO | DECISION | Arquitectura MFE (Micro Frontend) â€” Polyrepo + Custom Elements Angular 21 como remotes (yalo-mfe-clientes, yalo-mfe-catalogo, yalo-mfe-colaboradores) con contrato @yalo/mfe-contracts compartido. Shell (BO Angular 15 + Agendo) carga remotes vÃ­a manifest JSON por ambiente (S3 bucket yalo-mfe-static). DecisiÃ³n: rechazar Module Federation por incompatibilidad versiones Angular (15 vs 21). Frontera fÃ­sica entre repos, ownership claro por equipo en paralelo, rolling upgrades independientes por remote.
- 2026-10-15 | yalo-mfe-contracts | commit | feat(contratos-mfe): agrega contrato compartido para microfrontends
2026-10-12 | YALO | CONFIG | Sales Pipeline: bÃºsqueda por organizaciÃ³n con signal searchQuery='', sort alfabÃ©tico por columna con alphaStages signal, botÃ³n ArrowUpAZ se resalta azul/violeta/verde segÃºn zona â€” icono ArrowUpAZ registrado en lucide-icons.ts
2026-10-12 | YALO | GENERAL | SesiÃ³n iniciada: trabajo en yalo console api y fe â€” usuario autenticÃ³ pero token OAuth expirÃ³ (401) interrumpiendo sesiÃ³n
2026-10-12 | YALO | CONFIG | Search bar yalo console: estandarizaciÃ³n de estilos con componente `yalo-search` â€” mismo fondo gris, icono tamaÃ±o 16, clase `input input-default` para consistencia visual
2026-10-12 | YALO | DECISION | ValidaciÃ³n permisos reasignaciÃ³n asesor: lÃ­nea 92 de componente verifica `!editing || !isManagerOrAdmin` para mostrar select; sales_advisor ve nombre pero no puede reasignar; solo manager/admin pueden reasignar con modal de motivo (lÃ­nea 216) â€” arquitectura de control acceso validada en CRM deals
2026-10-12 | YALO | FEATURE | EliminaciÃ³n de deals: implementado DELETE /api/crm-deals/:id con body `{ reason }` (archiva deal + registra actividad note + log auditorÃ­a DELETE_DEAL) en API; frontend drawer con botÃ³n rojo "Eliminar deal" + modal textarea motivo obligatorio (optimistic delete de store, llamada API, cierre drawer) â€” rama feat/naidelyn/ventas (FE) y rama API actual
2026-10-12 | YALO | BUG | Barra de acciones panel deal: reemplazÃ³ tres elementos `absolute` (conflictos right-10/right-12/right-4) por `flex items-center justify-between` al tope â€” chip de duplicado a izquierda, trash + X a derecha. confirmDelete() corregido: usa `this._dealId()` en vez de `this.dealId` (setter @Input)
2026-10-12 | YALO | BUG | Merger de deals: corregidos 4 bugs â€” (1) quotationNumber no se guardaba al reasignar: agregado en body del PATCH; (2) chip "Posible duplicado" aparecÃ­a para closed_lost: excluye stage !== 'closed_lost' en computed; (3) candidatos de merge incluÃ­an closed_lost: mismo filtro en openMergeModal; (4) drawer colgado tras merge archivador deal actual: llama cerrarDrawer() si keepCurrentDeal = false
2026-10-12 | YALO | FEATURE | Sales Pipeline: bÃºsqueda por organizaciÃ³n + orden alfabÃ©tico con signal alphaStages; botÃ³n ArrowUpAZ resalta (azul/violeta/verde por zona)
2026-10-12 | YALO | FEATURE | Ficha deal header: barra de acciones fija (flex, no absolute) con chip "Posible duplicado" izquierda + trash/cerrar derecha
2026-10-12 | YALO | FEATURE | Etapa editable: campo stage en formulario deal como dropdown con 9 etapas; asesor editable por cualquier usuario con permiso (no solo manager/admin)
2026-10-12 | YALO | FEATURE | Eliminar deal: botÃ³n trash (solo si canEdit) + modal textarea motivo obligatorio â†’ archiva + actividad nota + log auditorÃ­a; endpoint DELETE /api/crm-deals/:id
2026-10-12 | YALO | BUG | quotationNumber no persistÃ­a: agregado en body PATCH /crm-deals/:id al reasignar asesor
2026-10-12 | YALO | BUG | closed_lost en chip duplicado: excluye stage='closed_lost' del filtro de candidatos merge
2026-10-12 | YALO | BUG | Drawer post-merge: cerrarDrawer() correctamente cuando deal archivado en merge
2026-10-12 | YALO | FEATURE | Onboarding activity notifications: nuevo mÃ©todo `pushOnboardingActivity()` en CrmDealSlackService â€” si hay dealId, llama `pushDealActivity` (â†’ n8n â†’ ventas-yalotech con hilo del deal) y en paralelo hace `postMessage` directo al canal SAC (C07B6MT3JCC por defecto, configurable via SLACK_SAC_CHANNEL_ID env var). Integramiento en crm-activities.service.ts: cuando `scopeType === 'onboarding'`, invoca el nuevo mÃ©todo con datos de la actividad â€” rama feat/naidelyn/ventas, compilaciÃ³n limpia

## Session 4251dca8-8196-41b5-a2d2-7d2792c9025e (revisiÃ³n Engram)

2026-10-17 | YALO | CONFIG | OCR endpoint debuggeo: dos errores simultÃ¡neos â€” (1) `/ocr-receipt` con banco=BAC Credomatic tardÃ³ 13.5s â†’ 500 (AWS SDK sin credenciales, timeout); (2) flujo viejo uploadImagePay fallaba con AggregateError TLS (Stripe no configurado en local). Variables AWS (.env) vacÃ­as: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET. Necesario llenar credenciales y reiniciar servidor para que OCR funcione â€” problema preexistente en local, no relacionado a PR de OCR nuevo
2026-10-12 | YALO | CONFIG | Slack onboarding threading: migraciÃ³n BD requiere ALTER TABLE "Crm-onboarding" ADD COLUMN IF NOT EXISTS "slackSacThreadTs" text; en prod/dev â€” ventas-yalotech continÃºa con hilos por deal vÃ­a n8n (dealActivity webhook), sac-yalo (C07B6MT3JCC) ahora usa slackSacThreadTs para replies de "NUEVA CUENTA EN SETUP" (fallback sin hilo si campo vacÃ­o)
2026-10-12 | YALO | FEATURE | Onboarding activity notifications: nuevo mÃ©todo `pushOnboardingActivity()` en CrmDealSlackService â€” si hay dealId, llama `pushDealActivity` (â†’ n8n â†’ ventas-yalotech con hilo del deal) y en paralelo hace `postMessage` directo al canal SAC (C07B6MT3JCC por defecto). IntegraciÃ³n en crm-activities.service.ts: cuando `scopeType === 'onboarding'`, invoca el nuevo mÃ©todo â€” rama feat/naidelyn/ventas, compilaciÃ³n limpia
2026-10-12 | YALO | CONFIG | Slack onboarding threading: migraciÃ³n BD requiere ALTER TABLE "Crm-onboarding" ADD COLUMN IF NOT EXISTS "slackSacThreadTs" text; â€” ventas-yalotech continÃºa con hilos por deal vÃ­a n8n, sac-yalo ahora usa slackSacThreadTs para replies
2026-10-12 | YALO | DECISION | Calendario de actividades: requerimiento nuevo explorando estructura CRM activities â€” skill brainstorming invocado, subagent Explore analizando entity/DTOs/service/controller/filtering

## Session 61373d74-777b-4c93-a149-5fa7c395f54d

2026-10-12 | YALO | CONFIG | GitHub App creation para yalo-trackeo webhook: pasos en GitHub Settingsâ†’Developer settingsâ†’GitHub Apps (nombre, Homepage URL, Webhook URL en Edge Function, Webhook secret con `openssl rand -hex 20`), permisos mÃ­nimos (Contents:Read, Pull requests:Read, Metadata:Read), generaciÃ³n Private Key (.pem), instalaciÃ³n en Yalo-Technologies org, y flujo JWT para obtener installation_access_token

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (continuaciÃ³n)

2026-10-12 | YALO | BUG | Calendar component Angular binding syntax: `[class.dark:bg-blue-900/10]` causaba compilaciÃ³n fallida â€” Angular template parser ve `:` como separador y no reconoce `dark:` como modifier Tailwind, rompe AST del template. El error subÃ­a al importador como "Cannot find module". Fix: remover binding `[class.dark:bg-blue-900/10]`, `bg-blue-50` ya proporciona suficiente feedback visual en hover (commit fa20d1f en rama feat/naidelyn/ventas)
2026-10-12 | yalo console | DECISION | Build limpio en rama feat/naidelyn/ventas (pusheado) â€” Calendario de actividades compila correctamente y disponible en ruta `/sales/calendar`
2026-10-12 | YALO | CONFIG | PermissionsService caching: mÃ³dulos de permisos se cachean en `localStorage` bajo clave 'permissions_modules'. Al actualizar permisos en backend, el frontend carga versiÃ³n en cachÃ©; requiere logout/login para refrescar tokens y recargar mÃ³dulos desde API â€” verificable con `JSON.parse(localStorage.getItem('permissions_modules'))?.find(m => m.permissionModuleRoute?.includes('calendar'))`
2026-10-12 | YALO | DECISION | Onboarding activity notifications refactor: mÃ©todo `pushOnboardingActivity()` en CrmDealSlackService integra mÃºltiples canales Slack (ventas-yalotech via n8n con hilo del deal; sac-yalo C07B6MT3JCC directo con threading en slackSacThreadTs BD); migration ALTER TABLE "Crm-onboarding" ADD COLUMN IF NOT EXISTS "slackSacThreadTs" text; rama feat/naidelyn/ventas compilaciÃ³n limpia
2026-10-12 | YALO | BUG | Calendar component Angular: `[class.dark:bg-blue-900/10]` rompe template parser (ve `:` como separador, no reconoce `dark:` modifier) â€” fix: remover binding, `bg-blue-50` proporciona feedback visual en hover. Commit fa20d1f rama feat/naidelyn/ventas
2026-10-12 | YALO | CONFIG | Login permisos mÃ³dulos: localStorage cache 'permissions_modules' â€” requiere logout/login para refrescar tokens y recargar mÃ³dulos desde API; mÃ³dulo calendario solo visible si backend INSERT en RolesXPermissionsModules ya hizo efecto
2026-10-12 | YALO | BUG | Permisos mÃ³dulo calendario: navegaciÃ³n bloqueada por falta de `RolesXPermissionsModules` row para roleId + permissionModuleId=1115; verificaciÃ³n SQL con innerJoin en `RolesXPermissionsModules`; necesita INSERT en BD para activar acceso al mÃ³dulo. Query validaciÃ³n: `SELECT rxpm.* FROM "RolesXPermissionsModules" rxpm JOIN "PermissionsModules" pm ON pm."permissionModuleId" = rxpm."permissionModuleId" WHERE pm."permissionModuleId" = 1115;`

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (continuaciÃ³n - Sales features + Calendar CRM)

2026-10-12 | YALO | FEATURE | Sales Pipeline bÃºsqueda y ordenamiento: search bar por organizaciÃ³n (signal searchQuery), sort alfabÃ©tico por etapa con botÃ³n ArrowUpAZ (alphaStages signal) resaltado azul/violeta/verde por zona â€” icono registrado en lucide-icons.ts
2026-10-12 | YALO | FEATURE | Ficha deal: barra acciones fija (flex, no absolute) con chip "Posible duplicado" izquierda + trash/cerrar derecha; botÃ³n trash solo si canEdit, modal textarea motivo obligatorio â†’ archiva + actividad + log auditorÃ­a
2026-10-12 | YALO | BUG | Deal deletion quotationNumber: agregado en body PATCH /crm-deals/:id al reasignar asesor; closed_lost excluido del filtro de candidatos merge para evitar chip "Posible duplicado"
2026-10-12 | YALO | FEATURE | Calendario CRM (Salesâ†’Calendar): componente Angular calendar-component compilando correctamente en rama feat/naidelyn/ventas â€” estructura grid views (dÃ­a/semana/mes), drag-drop activities, recordatorios in-app; ruta `/sales/calendar` activa tras permisos mÃ³dulo
2026-10-12 | YALO | CONFIG | Slack onboarding threading refactor: mÃ©todo `pushOnboardingActivity()` en CrmDealSlackService integra ventas-yalotech (n8n con hilo del deal) y sac-yalo C07B6MT3JCC (directo con slackSacThreadTs BD) en paralelo â€” integraciÃ³n en crm-activities.service.ts cuando scopeType='onboarding'
2026-10-12 | YALO | CONFIG | Permisos mÃ³dulo calendario: localStorage cache 'permissions_modules' requiere logout/login para refrescar; mÃ³dulo solo visible si RolesXPermissionsModules tiene row para roleId + permissionModuleId=1115

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (final - Styling calendario)

2026-10-13 | YALO | CONFIG | Calendario: agrega fondos al grid de dÃ­a/semana/mes â€” `bg-white dark:bg-neutral-950` en contenedores principales, `border-neutral-200` en light mode para bordes mÃ¡s visibles (vs `dark:border-neutral-800/60`), commit cd093d2 pusheado a feat/naidelyn/ventas

2026-10-13 | YALO | DECISION | YALO-Agendo-FE navegaciÃ³n por rubro: anÃ¡lisis de arquitectura â€” rubro de organizaciÃ³n viene de API o se almacena en JWT/localStorage/settings del tenant; determina si shell debe solicitarlo cada vez o leerlo de datos ya cargados; session 948e2820 explorando contexto (repo Angular standalone + signals, navegaciÃ³n hardcodeada en layout.ts sin concepto de rubro)

2026-10-13 | general | GENERAL | Claude Docs: no tiene flujo de "solicitar acceso" como Google Drive; doc estÃ¡ en cuenta del usuario que lo creÃ³, solo Ã©l puede compartirlo manualmente (botÃ³n Share en el doc)
2026-10-13 | YALO | DECISION | Arquitectura shell Yalo Agendo: navegaciÃ³n dinÃ¡mica por rubro (codtiponegocio_agendo) desde API â€” tres tickets GENERAL propuestos (1) MigraciÃ³n BD multi-rubro en dbyaloauth/dbyalocobro, (2) Endpoint GET /configuracion expone rubro + enabled_modules, (3) ShellService con signals reactivos en FE para sidebar data-driven

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

2026-10-14 | YALO | BUG | requestId idempotencia: Bug crÃ­tico â€” si reintento con requestId falla silenciosamente (edge case: primer intento quedÃ³ a medias), el siguiente intento no ejecutarÃ¡ correctamente. Requiere validaciÃ³n robusta de idempotencia en Edge Function + rollback en transacciones incompletas
2026-10-14 | YALO | BUG | DuplicaciÃ³n notificaciones QA: Riesgo identificado â€” triggers BD (notify_on_qa_return en migraciones) y Edge Function (slack-send handleQaReturn) ambos insertan en tabla notifications, pueden generar duplicados. Requiere validar que solo UNO de los dos hace la inserciÃ³n
2026-10-14 | YALO | BUG | hardcoding slackDevChannel: Field slackDevChannel en Qa.tsx estÃ¡ hardcodeado a `DEFAULT_DEV_SLACK_TARGET = ''` en lugar de cargar desde CFG0 en BD. Notificaciones QA retorno a Dev envÃ­an a canal incorrecto si config no estÃ¡ sincronizada
2026-10-14 | YALO | DECISION | QA Return to Dev flujo completo: 18 commits de Amy (~18K lÃ­neas). FE: Qa.tsx confirmReturnToDev() con fallback local Zustand. Backend: slack-send refactored kind='qa-return'â†’handleQaReturn() valida permisos+guarda BD+crea notificaciones. BD: triggers AFTER UPDATE qa_tasks validando permiso editar_tarea+notificando assignee. Integridad: RLS+server-side robusto, concurrency control en attempts array, fallback sin fallo silencioso
2026-10-13 | YALO | GENERAL | Breakdown tickets Yalo Agendo: 8 tickets completos (2 migraciones BD, 2 APIs, 4 FE) ordenados por dependencias â€” catÃ¡logo de rubros y ShellService en paralelo con APIs, layout refactor y moduleGuard al final
2026-10-13 | YALO | GENERAL | Shell dinÃ¡mico Yalo Agendo: propuesta condensada a 3 tickets GENERAL focalizados en arquitectura core (BD + API + FE reactivo)
2026-10-13 | YALO | DECISION | KPIs MRR/ARR enterprise-trial: query findEnterpriseTrialOrganizations extrae orgs status 'trialing' + enterprise=true, inserta con mrr=0 en currentMrr; drilldown UNION active_mrr + enterprise_trials para consistencia entre KPI card y detail

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (final - KPIs Enterprise Trial)

## Session b244a219-4c94-4142-8337-320fd12a1d08

2026-10-15 | YALO | DECISION | Arquitectura Module Federation (remotes MFE): 5 repos nuevos bajo Yalo-Technologies/ (yalo-mfe-contracts TypeScript puro, yalo-mfe-clientes/catalogo/colaboradores Angular 21 Web Components, yalo-mfe-design-system opcional) + 3 repos existentes con cambios mÃ­nimos (YaloPOSBackoffice/YALO-Agendo-FE agregan loader de remotes, YALO-Agendo-API replica endpoints clientes/catÃ¡logo/colaboradores del BO API) â€” cada remote produce main.js bundleado dinÃ¡micamente por shell, no index.html; distribuciÃ³n en GitHub Packages para yalo-mfe-contracts, documentaciÃ³n de arquitectura presentada por secciones
2026-10-15 | YALO | DECISION | Infra y ambientes Module Federation: remotes hosteados en Azure Blob Storage ($web/ con carpetas por MFE y ambiente dev/qa/prod), Azure CDN encima para cache HTTPS, manifest.json por ambiente cargado al iniciar shell (no hardcode de URLs), permite rollback sin redeploy cambiando URL en manifest, remotes NO tienen env vars runtime (inyectadas por shell via propiedades del elemento Web Component), shells sÃ­ tienen environment.ts por ambiente; pipeline independiente por remote con promociÃ³n manual devâ†’qaâ†’prod + cache purge

2026-10-13 | YALO | DECISION | KPIs enterprise-trial organizations: nuevo query `findEnterpriseTrialOrganizations` extrae codorganizacion distintos con status Stripe 'trialing' + enterprise=true (respeta filtro paÃ­s, excluye esprueba). Service `buildKpis` inserta trial IDs con mrr=0 en currentMrr (suma activeCustomers sin distorsionar mrrTotalUsd/arpu). Query drilldown `findKpiOrganizations` UNION active_mrr + enterprise_trials (duplicados excluidos) para consistencia entre card-click y nÃºmero KPI
2026-10-13 | YALO | DECISION | ConfiguraciÃ³n dinÃ¡mica por rubro (codtiponegocio_agendo): tabla yc_configuracionesrubros en dbyaloauth con ~15 filas/org â€” vocabulario (vocab_cliente, vocab_cita, vocab_recurso, vocab_catalogo), tiempo/intervalo (unidad_tiempo, intervalo_minutos), vistas (vista_principal), mÃ³dulos (enabled_modules, canales), tipos de recursos (tipo_recursos), reglas (reglas_reserva), campos personalizados (campos_cliente, campos_reserva), y meta (codplantilla origen: salon/hotel/restaurante). Persistencia en BD permite ajuste granular desde UI sin cÃ³digo, vs constantes hardcodeadas
2026-10-13 | YALO | commit | feat(crm-cockpit): incluye orgs enterprise+trialing como clientes activos con MRR real (commit 75e6566 en fix/naidelyn/caracteres-especiales-slack)
2026-10-13 | YALO | BUG | KPIs enterprise-trial: buildKpis consumÃ­a `enterpriseTrialOrgIds` como array de nÃºmeros pero findEnterpriseTrialOrganizations retorna objetos â€” corregido loop en crm-cockpit.service.ts lÃ­nea 862 accediendo `trial.organizationId` en vez de `orgId` directo. Drilldown active_customers ya tenÃ­a lÃ³gica correcta (UNION + distinct). Geography por paÃ­s agregada con enterprise trial count al `activeCustomers` de su country â€” exclude enterprise de findActiveTrialsByCountry para evitar doble conteo
2026-10-12 | YALO | FEATURE | Filtro de actividades por responsable: dropdown dinÃ¡mico con lista de responsables de deals (Alicia, Brayan, etc.), selecciones filtran todas las actividades cuyo deal estÃ© asignado a esa persona â€” usable para anÃ¡lisis granular de carga por asesor en mÃ³dulo CRM
2026-10-13 | YALO | BUG | NotificaciÃ³n onboarding bloqueada sin asesor: condiciÃ³n `if (targetStage.stageName === 'setup_completed' && deal.assignedTo)` en crm-activities.service.ts previene crear onboarding y enviar a SAC cuando asesor=null â€” afecta deals sin asignar en SETUP. Requiere separar validaciÃ³n asignaciÃ³n de trigger notificaciÃ³n para deals en transiciÃ³n de fase sin asesor definido
2026-10-13 | YALO | DECISION | Arquitectura n8n para threading onboarding SAC: fix backend n8n requiere guardar `slackSacThreadTs` cuando deal llega a SETUP (timestamp del mensaje "NUEVA CUENTA EN SETUP" que serÃ¡ hilo padre de activities); frontend ya implementado enviando `scopeType: 'onboarding'` + `onboardingId` en actividades â€” migraciÃ³n BD ALTER TABLE "Crm-onboarding" ADD COLUMN IF NOT EXISTS "slackSacThreadTs" text; permite replies en hilo correcto vs fallback "ðŸš€ *OrgName* â€” hilo de actividades de onboarding"
2026-10-13 | YALO | CONFIG | ImplementaciÃ³n n8n slackSacThreadTs: guardar timestamp del mensaje SETUP como thread parent â†’ actividades posteriores replySacActivity dentro del hilo (vs crear nuevo hilo fallback sin n8n). Requiere: (1) n8n webhook dealActivity detecta stage='setup' y guarda ts en slackSacThreadTs, (2) CrmDealSlackService.pushOnboardingActivity() usa slackSacThreadTs al postMessage (parÃ¡metro thread_ts), (3) frontend Activity.vue envia onboardingId para que backend encuentre el registro correcto

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (final - Resumido)

2026-10-13 | YALO | GENERAL | SesiÃ³n iniciada con naveg aciÃ³n de proyecto via skill proyecto y login; acceso a yalo console (FE Node/TS) y yalo console api (Node/TS) en rama feat/naidelyn/ventas

## Session df0a0271-26b0-4642-89a8-6664e2e5b97b (Engram - Stop Hook Log)

2026-10-13 | YALO | FEATURE | Sales Pipeline completo: bÃºsqueda/ordenamiento, ficha deal editable con eliminar, merger duplicados, onboarding activity notifications multi-canal Slack (ventas+SAC)
2026-10-13 | YALO | FEATURE | Calendario CRM (dÃ­a/semana/mes): componente Angular calendar-component compilando, grid views con drag-drop activities, recordatorios in-app, ruta /sales/calendar â€” rama feat/naidelyn/ventas activa
2026-10-13 | YALO | DECISION | Onboarding activity notifications refactor: mÃ©todo pushOnboardingActivity() integra ventas-yalotech (n8n con hilo deal) + sac-yalo (C07B6MT3JCC directo con slackSacThreadTs BD) â€” migration ADD COLUMN slackSacThreadTs text
2026-10-13 | YALO | DECISION | KPIs MRR/ARR enterprise-trial: query findEnterpriseTrialOrganizations extrae orgs status=trialing+enterprise=true, inserta trial IDs con mrr=0 en currentMrr â€” consistencia KPI card vs drilldown
2026-10-13 | YALO | DECISION | Shell dinÃ¡mico Yalo Agendo: configuraciÃ³n dinÃ¡mica por rubro (codtiponegocio_agendo) via tabla yc_configuracionesrubros â€” vocabulario, mÃ³dulos, campos personalizados, tipos recursos sin hardcode
2026-10-13 | YALO | CONFIG | crm_deals columna slackThreadTs: vincula deal a hilo Slack del onboarding correspondiente para threading multi-canal consistente (ventas via n8n + SAC directo)
2026-10-13 | YALO | BUG | deal.slackThreadTs duplicaba SAC thread ts: n8n webhook intenta reply en thread incorrecto (SAC en lugar de ventas-yalotech) causando error silencioso â€” fix: UPDATE crm_deals SET "slackThreadTs" = NULL WHERE "dealId" = 74 para recrear hilo correcto en prÃ³xima actividad

## Session aa132ec4-399e-4eca-8a37-acf7b3d75256

2026-10-14 | YALO | DECISION | Compartir mÃ³dulos entre proyectos: nuevo proyecto (Angular FE + .NET API) comparte mÃ³dulos con YALO BO existente; requerimiento eliminar duplicaciÃ³n de cÃ³digo y mantenimiento â€” API separada pero BD compartida; arquitectura SharedServices + Shared Components layers propuesto en sesiÃ³n de brainstorming
2026-10-14 | YALO | DECISION | Arquitectura compartida: 3 opciones evaluadas â€” (A) Agendo API llama BO API (HTTP) con riesgos de acoplamiento/latencia; (B) Shared Class Library .NET + Angular libs local [RECOMENDADA] con Shared.Core project reference y monorepo Nx FE; (C) Monorepo unificado (mÃ¡xima reutilizaciÃ³n pero migraciÃ³n grande). Propuesta: OpciÃ³n B con YaloShared .sln para Backend (.NET project references) + libs folder Nx Angular para Frontend; un solo lugar para cambios de modelos DTOs/contratos, cada API con lÃ³gica propia pero compartiendo contrato
2026-10-14 | YALO | DECISION | Dos opciones arquitectura microservicios â€” OpciÃ³n 1: Micro todo (cada mÃ³dulo clientes/productos es FE propio + API propia, embebidos en BO/Agendo como micro-frontends, cada uno se despliega solo). OpciÃ³n 2: Contrato compartido (cada mÃ³dulo tiene FE como Angular library, componentes+interfaces reutilizables, apunta a BO API o Agendo API segÃºn contexto, ambas APIs implementan mismo contrato). EvaluaciÃ³n de trade-offs entre independencia operacional vs complejidad de integraciÃ³n

## Session 033d9b27-1375-484b-b830-fd66a4db54b1

2026-10-14 | YALO | DECISION | Micro-repos compartidos: dos repos nuevos (yalo-shared-fe + YaloShared.Core) como deps npm/NuGet para BO API/FE y Agendo API/FE â€” elimina duplicaciÃ³n de cÃ³digo, modelos DTOs compartidos, SharedServices layer (reutilizado en mÃºltiples proyectos)
2026-10-14 | YALO | BUG | qualificationScore: Entity intâ†’float, Service cÃ¡lculo alineado FE (manager=0.5, 30_days=0.5, 90_days=0)
2026-10-14 | YALO | GENERAL | InvestigaciÃ³n: fusionar cuentas en yalo console api y fe â€” validaciÃ³n de funcionalidad pendiente (background task registrado pero no completado)
2026-10-14 | YALO | GENERAL | VerificaciÃ³n funcionalidad: revisiÃ³n de componente fusionar deals en FE iniciada (subagent running)
2026-10-14 | YALO | BUG | URLs dobles /api/api: corregidos bugs en mergeCandidates() y searchMergeCandidates() â€” ambas funciones tenÃ­an ruta duplicada con doble prefijo `/api`, causando 404 en flujo de fusiÃ³n de deals
2026-10-14 | YALO | BUG | qualificationScore decimales: migraciÃ³n BD Crm-dealBant intâ†’float con recÃ¡lculo de scores (CASE WHEN need/authority/budget/timing) para permitir puntajes decimales (manager=0.5, 30_days=0.5) â€” script completo ALTER TABLE + UPDATE + SELECT en dbyaloconsole

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

2026-10-14 | YALO | DECISION | QA feedback amplificaciÃ³n: documento `docs/feedback-amy-noti.md` (yalo-trackeo) registra 18 commits + features complejos: QA return to dev (Edge Function slack-send + triggers BD validaciÃ³n permisos), notificaciones duplicadas (triggers vs EF), hardcoding canal dev Slack, requestId idempotencia â€” validaciÃ³n de integridad crÃ­tica en flujo QA+Slack multi-canal. Mismo directorio que spec cliente Tauri (rama feat-mcp-servidor)

## Session 033d9b27-1375-484b-b830-fd66a4db54b1 (Engram Verification)

2026-10-14 | YALO | DECISION | Arquitectura compartida: yalo-shared-fe + YaloShared.Core para BO/Agendo â€” elimina duplicaciÃ³n DTOs, SharedServices reutilizable, npm/NuGet deps
2026-10-14 | YALO | BUG | FusiÃ³n deals: URLs /api/api en mergeCandidates + qualificationScore intâ†’float migrado en BD Crm-dealBant; testing pendiente
2026-10-14 | YALO | CONFIG | Real-time updates header CRM: grade y score del deal-header se actualizan en tiempo real mientras editas draft, solo persisten a BD al clickear Listo
2026-10-14 | YALO | CONFIG | Caracteres especiales en mensajes Slack: investigaciÃ³n de pirateo/corrupciÃ³n de caracteres (Ã±, Ã©, Ã¼, etc.) en envÃ­os masivos â€” revisar encoding UTF-8 en Edge Functions wa-send-bulk y email builders

## Session 20e46849-50f1-4ec2-ac6b-011f93d56228

2026-10-14 | YALO | DECISION | MÃ³dulo de pausas yalo-trackeo-desktop: anÃ¡lisis UX para identificar comportamiento "pausas trackeable" â€” pregunta abierta sobre semÃ¡ntica: si pausa marcada trackeable suma tiempo al total trabajado en reportes, o solo es etiqueta visual de identificaciÃ³n. Requerimientos por confirmar antes de diseÃ±o de nuevos tipos de pausa
2026-10-14 | YALO | DECISION | Pausas trackeables yalo-trackeo-desktop spec completo: modelo datos (PauseReason.trackeable boolean, TimePause.trackeable snapshot + description), UI (modal start-pausa con timeInput + descripciÃ³n opcional, countdown live expiresAt, resume automÃ¡tico al vencer), flujo (crear tarea, pausar automÃ¡tico con duraciÃ³n sugerida, expireâ†’resume, cancel preserve tiempo), casos borde (sesiÃ³n expirada, recarga durante pausa), almacenaje expiresAt en store para persistencia. Archivo spec: docs/superpowers/specs/2026-10-14-pausas-trackeables-design.md
2026-10-14 | YALO | DECISION | Tracking de tickets validado: flujo web startTimer(null, ticketId) + desktop ipc.iniciarTimer(null, ticketId) funcionando; mÃ¡quina de estados Rust con tick 1Hz acumula tracked_s en bloques 10 min, TimerChip web recalcula elapsed en vivo con setInterval; sincronizaciÃ³n write-through Zupabase+SQLite async; contador avanza correctamente ambas plataformas; persistencia 30s desktop, reconciliaciÃ³n remota activa
2026-10-14 | YALO | CONFIG | Release tag v0.1.11 yalo-trackeo-desktop: workflow GitHub Actions release.yml se dispara automÃ¡ticamente con push del tag `v*`, compila Windows (NSIS installer + zip firmado), macOS universal (DMG + app.tar.gz firmado), sube instaladores + updater.json a Supabase Storage, banner de actualizaciÃ³n automÃ¡tico en usuarios con versiones anteriores
2026-10-14 | yalo-trackeo-desktop | CONFIG | CI/CD workflow refactor: separa build-windows y build-macos en jobs independientes, macOS con continue-on-error (no bloquea publish sin secrets Apple), publish solo depende de build-windows â€” soluciÃ³n para entornos donde certificados Apple no estÃ¡n configurados
2026-10-14 | yalo-trackeo-desktop | CONFIG | publish-release.mjs refactor: macOS compilaciÃ³n opcional, flujo reordenado â€” `build-windows` requerido+bloquea publish, `build-macos` con continue-on-error (fallos silenciosos), `publish` sube solo artefactos compilados (si macOS falla, sube solo Windows installer + updater.json solo con windows-x86_64)

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

2026-10-14 | YALO | CONFIG | 9 migraciones aplicadas exitosamente en yalo-trackeo: close_orphan_time_entries, tracking_alerts_permissions, tracking_integrity_email, device_sync_integrity, notif_skip_self_complete, qa_board_id (no-op), equipo_avatar_url, qa_return_notification, qa_return_server_integrity â€” pendiente: deploy Edge Function `notif-dm` para completar flujo Amy

2026-10-14 | YALO | DECISION | AnÃ¡lisis multi-Ã¡ngulo rama Fix/Amy/noti (yalo-trackeo): 3 finders paralelos evaluando correctness (diff scan, removed behavior), reutilizaciÃ³n (cross-file tracer, helpers duplicados), y eficiencia (simplificaciÃ³n, redundancia, altitude). Archivos revisados: supabase/functions/slack-send/index.ts, app/src/routes/Qa.tsx, app/src/store/index.ts, app/src/store/hydrate.ts, app/src/store/realtime.ts, app/src/data/types.ts, supabase/migrations/20261014175046_qa_return_server_integrity.sql â€” subagents a88d15b1366d8bf03 (Finder A+B), ab2ac0848f290b908 (Finder C+Reuse), a8666893cacd1935e (Finder Simplification+Efficiency+Altitude) corriendo en paralelo para detectar bugs, code-smells y oportunidades de mejora arquitectÃ³nica antes de merge a main

## Session 0b465d39-b776-4e81-a1a8-6aefaa6c0645

2026-10-14 | YALO | GENERAL | Rama fix/amy/noti â€” Amy Valeria 18 commits (98 archivos +18,223 -964 lÃ­neas): Sistema de Notificaciones (migraciones SQL + Edge Functions DM Slack + notif in-app), API Tickets (ticket-api, admin, webhook-dispatch + docs 804 lÃ­neas), MÃ³dulo QA refactorizado, Exportaciones (Excel/PDF timesheet), MensajerÃ­a masiva (WhatsApp + Email), Store/Types/JWT updates, integridad sincronizaciÃ³n
2026-10-14 | YALO | DECISION | Sistema QA â†’ Dev notifications: `confirmReturnToDev()` frontend â†’ Edge Function `slack-send` con `kind: 'qa-return'`; `ensureTaskInQa()` + `applyQaTaskReturn()` store; Edge Function valida permisos, persiste intentos en array con control concurrencia, notifica assignee+sender en BD, postea a Slack DM, registra en `slack_envios`; fallback local localStorage si Supabase offline; 2 migraciones SQL (v1 simplificado, v2 completo 244 lÃ­neas con triggers RLS+notificaciones); deduplicaciÃ³n por ID en hidrataciÃ³n
2026-10-14 | YALO | BUG | QA notification system riesgos: (1) `slackDevChannel` hardcodeado DEFAULT_DEV_SLACK_TARGET='', deberÃ­a cargar desde CFG0 BD; (2) duplicaciÃ³n notificaciones posible (trigger BD + Edge Function ambos insertan), verificar que solo uno actÃºa; (3) si migraciÃ³n v1 ejecutada en prod requiere cleanup antes de v2
2026-10-14 | YALO | BUG | requestId cleanup en catch block: Qa.tsx lÃ­nea 583, error de red en reintento reutiliza UUID fallido causando inconsistencia en historial. Fix: agregar `setReturnRequestId(null)` en catch antes de mostrar toast.
2026-10-14 | YALO | BUG | NotificaciÃ³n invisible si sent_by=null: slack-send lÃ­nea 295-298, notificationForCaller no se asigna si ambos assignee+sent_by=null, queda huÃ©rfano con ID secundario n_qa_return_actor_*. Fix: agregar fallback `|| caller.userId != null` en condiciÃ³n de asignaciÃ³n.
2026-10-14 | YALO | SECURITY | Realtime handler sin verificaciÃ³n user_id: realtime.ts lÃ­nea 173-191 solo filtra workspace_id, si RLS desactivado usuario A ve notificaciones de usuario B en tiempo real. Fix: agregar guard `if (notification.user_id && notification.user_id !== s.authUserId) return` + confirmar RLS Realtime habilitado en Supabase dashboard.
2026-10-14 | YALO | DECISION | Fallback local notificaciones sin persistencia: Qa.tsx lÃ­nea 550-570, devoluciÃ³n con error de red crea attempt en memoria con by='qa' literal sin guardar en Supabase â€” tester ve toast Ã©xito pero Dev nunca recibe notificaciÃ³n. Requiere warning real (no toast) indicando fallo de sincronizaciÃ³n y reintento manual.
2026-10-14 | YALO | BUG | Memory leak blob URLs evidencias: Qa.tsx lÃ­nea 498, URL.createObjectURL(file) nunca revocado â€” cada evidencia subida deja blob URL viva durante toda sesiÃ³n. Fix: agregar useEffect cleanup `return () => Object.values(previewMap).forEach(URL.revokeObjectURL)`.
2026-10-14 | YALO | DECISION | Performance: getWorkspaceMemberUserId en serie: slack-send lÃ­nea 295-296 hace dos llamadas secuenciales (~80ms) pudiendo correr en paralelo (~40ms) con Promise.all â€” optimizaciÃ³n de 50% latencia.
2026-10-14 | YALO | DECISION | Technical debt resolve_qa_target_uid duplicado: migrations lÃ­neas ~90 y ~168 repiten bloque 15 lÃ­neas (JOIN assigneeâ†’equipoâ†’workspace_members + fallback sent_by). Fix: extraer funciÃ³n SQL compartida `resolve_qa_target_uid(task_id, workspace_id, sent_by)` â€” evita divergencia entre triggers notify_on_qa_return y notify_on_qa_case_return.
2026-10-14 | YALO | DECISION | Code duplication mapQaTask: existe inline en hydrate.ts ~819 (releasedIn undefined) y realtime.ts ~66 (preserva releasedIn) â€” ya divergieron. Fix: extraer mapQaTask(r) compartido como existe `mapTarea`/`mapTicket` â€” Ãºnico lugar para cambios del esquema QATask.
2026-10-14 | YALO | FEATURE | QA return notifications system: Edge Function slack-send maneja `kind: 'qa-return'` con permisos validados, persiste intentos JSONB con idempotencia requestId UUID, notifica assignee+sender en BD, postea Slack DM, fallback localStorage si offline â€” rama Fix/Amy/noti Amy Valeria Fajardo Sabillon

2026-10-14 | YALO | BUG | Code review multi-Ã¡ngulo Fix/Amy/noti: 6 candidatos accionables identificados via 3 subagents paralelos (A2 notif invisible si sent_by=null, A6 attempt sin id, A3 UUID v4 regex estricta, B3 requestId fallido no limpiado catch, B2 race condition dedup, A4 slackWarning undefined) â€” mayor riesgo es notificaciÃ³n silenciosa al Dev y race condition en offline fallback, menor riesgo en borde cases regex/undefined. Finders tambiÃ©n reportan oportunidades: dedup cÃ³digo SQL resolve_qa_target_uid, consolidar mapQaTask cross-file, paralelizar getWorkspaceMemberUserId 50% perf gain, gestionar blob URL cleanup memory leak

2026-10-14 | yalo-trackeo-desktop | BUG | UpdateBanner delay 3s â€” evento `update` del updater emitÃ­a antes de montar listener en frontend causando pÃ©rdida de evento; fix agrega delay de 3 segundos para sincronizar con ciclo de mount de componente UpdateBanner, CI deploy v0.1.13 en progreso

## Session 20e46849-50f1-4ec2-ac6b-011f93d56228 (continuaciÃ³n - Pausas Trackeables)

2026-10-15 | YALO | FEATURE | feat(time-ingest): crea tarea y time_entry al reanudar pausa trackeable â€” supabase/functions/time-ingest/index.ts agrega trackeable/suggestedMinutes al Body y insert de time_pauses; expande acciÃ³n resume para crear tarea nueva (ID prefix-N) y time_entry con duraciÃ³n pausa cuando trackeable=true
2026-10-15 | YALO | FEATURE | feat(pausa-trackeable): agrega countdown y auto-reanudaciÃ³n en Desktop â€” src-tauri/src/api.rs campos trackeable/suggested_minutes en PausaRemota; comandos.rs popula desde PauseReason; ipc.ts type actualizado; Timer.tsx countdown regresivo en .timer-value + auto-resume con ref guard; index.css animaciÃ³n timerPulse para overflow
2026-10-15 | yalo-trackeo-desktop | fix | detecta Modern Standby (S0) con GUID_MONITOR_POWER_ON â€” Windows 11 timer se corta al cerrar tapa; RegisterPowerSettingNotification captura PBT_POWERSETTINGCHANGE; struct MonitorPowerSetting con data (0=apagado); cobertura completa S0+S3+wakeup; v0.1.14 en CI building
2026-10-15 | yalo-trackeo-desktop | fix | cierre de tapa + timer corriendo: fix en v0.1.14 corta timer inmediatamente al detectar Modern Standby + PBT_APMRESUMESUSPEND/PBT_APMRESUMEAUTOMATIC; timer + actualizaciÃ³n: detiene antes del restart con aviso en UI si activo; timer + crash/apagado: `recuperar_huerfana` lo cierra en Ãºltimo heartbeat

2026-10-15 | YALO | CONFIG | MÃ³dulo "Ver tiempo del equipo": permiso granular agregado en yalo-trackeo â€” usuario Contabilidad vinculado a rol con checkbox marcado; cÃ³digo pusheado hace < 1 min, Vercel deploy en progreso (1-3 min); verificaciÃ³n post-deploy pendiente â€” recarga app con usuario Contabilidad para validar visibilidad de datos del equipo

## Session b244a219-4c94-4142-8337-320fd12a1d08

2026-10-15 | YALO | DECISION | Arquitectura Module Federation Yalo Agendo: brainstorming skill explorÃ³ diseÃ±o de pizarra Excalidraw (remotes Clientes|Catalogo|Colaboradores, BO shell Angular 15 + Agendo FE Angular 21 incompatibles). Tres opciones evaluadas: (A) Monorepo Nx con remotes compartidos @yalo/mfe-contracts + CI/CD unificado [RECOMENDADA], (B) Polyrepo independiente (repos yalo-mfe-clientes, yalo-mfe-catalogo, yalo-mfe-colaboradores + separado @yalo/mfe-contracts), (C) MÃ³dulos dentro BO (menos repos pero acoplamiento directo). SelecciÃ³n: OpciÃ³n A â€” versionado junto de contratos, versiÃ³n en .json manifest por ambiente, rollback sin recompilar (subagent skill:brainstorming en progreso)
2026-10-15 | YALO | DECISION | ReplicaciÃ³n BO API â†’ Agendo: anÃ¡lisis arquitectura compartida â€” BO API (.NET 15) debe exponer endpoints replicables en Agendo API (nuevos), considerar SharedServices + Shared.Core library o copiar servicios con modificaciones mÃ­nimas; endpoint `/api/configuracion` propuesto para leer rubro + modulos habilitados; pregunta abierta sobre reutilizaciÃ³n cÃ³digo BO API vs nuevo desarrollo limpio en Agendo
2026-10-15 | YALO | DECISION | Micro-repos MFE Yalo Agendo: 5 repos nuevos (yalo-mfe-contracts TypeScript puro + yalo-mfe-clientes/catalogo/colaboradores Angular 21 Web Components + yalo-mfe-design-system opcional) hosteados Azure Blob/CDN, manifest.json por ambiente permite rollback sin redeploy, shells YaloPOSBackoffice/YALO-Agendo-FE cargan remotes dinÃ¡micamente con Web Components, no index.html; env vars inyectadas por shell via propiedades elemento, versioning en manifest para promociÃ³n devâ†’qaâ†’prod
2026-10-15 | YALO | DECISION | Seguridad Module Federation: token scoped corta duraciÃ³n para remote (no JWT usuario), SRI hashes en manifest validados antes ejecuciÃ³n, CSP restrictivo (script-src self + cdn.yalo.com), S3 privado via OAC CloudFront, CORS whitelist dominios shells, manifest TTL 30-60s (rollback rÃ¡pido) vs main.js 30 dÃ­as hashnamed
2026-10-15 | YALO | DECISION | Arquitectura MFE (Micro Frontend) â€” Polyrepo + Custom Elements Angular 21 como remotes (yalo-mfe-clientes, yalo-mfe-catalogo, yalo-mfe-colaboradores) con contrato @yalo/mfe-contracts compartido. Shell (BO Angular 15 + Agendo) carga remotes vÃ­a manifest JSON por ambiente (S3 bucket yalo-mfe-static). DecisiÃ³n: rechazar Module Federation por incompatibilidad versiones Angular (15 vs 21). Frontera fÃ­sica entre repos, ownership claro por equipo en paralelo, rolling upgrades independientes por remote.
- 2026-10-15 | yalo-mfe-contracts | commit | docs(arquitectura-mfe): documenta integraciÃ³n completa de YALO

## Session 23b91669-7769-4b08-8a6e-d6e392f380a3

2026-10-16 | YALO | CONFIG | Agendo Onboarding UI: usuario solicita importaciÃ³n de diseÃ±o desde claude.ai design MCP (proyecto 653e2cac-4c17-4a9a-840b-783ee1b3b740) e implementaciÃ³n â€” sesiÃ³n bloqueada por requerimiento de autenticaciÃ³n (design-login y /login no completados en prompt CLI)
- 2026-10-16 | yalo-trackeo | commit | fix(qa): permite restaurar evidencias faltantes (Fix/Amy/noti)

## Session 8c7d5a28-62ff-4eb5-b0d0-1f6c4f90197a

2026-10-17 | YALO | DECISION | Flujo verificaciÃ³n pagos YaloBO: (1) Guard ActiveSuscriptionGuard hace GET /Subscripcion/Verificar en cada navegaciÃ³n (fuente Ãºnica de verdad desde Stripe); (2) HistorialPagosComponent carga /Stripe/Payments/List + /Stripe/Payments/Subs/Next (facturas de Stripe, sin datos Console); (3) Problema raÃ­z: pagos por transferencia manual registrados en Console no actualizan Stripe automÃ¡ticamente â€” Console los muestra activos pero BO/POS los bloquean porque Guard valida contra Stripe. Casos: Santa LucÃ­a (11 sep registrado en Console, bloqueado BO 21 sep) y Rentable (octubre como anticipo). InvestigaciÃ³n pendiente: Â¿Console activa suscripciÃ³n en Stripe al registrar transferencia o solo en BD local?
2026-10-17 | YALO | BUG | Divergencia cÃ¡lculo monto a pagar: cliente ve sum(items.UnitAmount)=$88.50 en BO, pero Console calcula $92.85 con prorrateo de add-ons incluido (ubicaciÃ³n: `ValidarInformacionPagoTransferenciaController.cs` lÃ­nea 139 `TotalAPagarLps = totalAPagar * tasacambio`). 6 cuentas con faltante $4.35 tienen add-ons agregados/removidos a mitad del ciclo â€” cliente paga monto base, pero Stripe cobra prorrateo real. Fix: `PagosController.cs` no hace preview de factura (solo suma UnitAmount sin prorrateo), divergencia con Console que usa `InvoiceCreatePreview.AmountDue`.
2026-10-17 | YALO | BUG | Faltante en suscripciones: recopilaciÃ³n de problemas reportados en #yalo-console â€” dÃ­as gratis mal dados, montos incorrectos pagados por cliente, ciclos de facturaciÃ³n mal configurados, problemas en activaciÃ³n de suscripciones
2026-10-17 | YALO | DECISION | ReuniÃ³n tareas mÃºltiples: session iniciada con foco en integraciÃ³n Stripe, verificaciÃ³n de pagos y anÃ¡lisis de discrepancias entre Console y BO

## Session 4251dca8-8196-41b5-a2d2-7d2792c9025e

2026-10-17 | YALO | DECISION | Code Review PRs #11658/#11659 (indicador prÃ³rroga pago) â€” 2 WARNs seguridad: (1) `GET :id/gracePeriods` sin guard explÃ­cito (verificar LastActivityGuard en clase controller), (2) historial GracePeriodCardComponent no refresca al agregar prÃ³rroga (escuchar changes['gracePeriod'] o exponer reload()); 2 WARNs datos: (3) `since` retorna `""` inconsistente con null (cambiar grace-period.helpers.ts), (4) console.error lÃ­nea 621 FE en prod (remover); 4 NOTEs lÃ³gica/UX: (5) estado "finalizada" poco claro si activo=true, (6) stripeResponse vacÃ­o silencia cambios contrato, (7) previewUntil aproximado (UX ok con "estimado"), (8) mezcla @if/@*ngIf (migrar cuando toquen modal); 0 BLOCKERs, tabla resumen comunicada
2026-10-17 | YALO | DECISION | IntegraciÃ³n AWS Textract en YaloConsole API (NestJS): propuesta nuevo endpoint `POST /organizations/ocr-receipt` que extrae campos estructurados (monto, referencia, fecha, banco, textoRaw) desde recibos de pago usando AWS Textract `StartExpenseAnalysis` + polling async â†’ S3 upload previo. Reutilizable para prellenar formularios de pago sin modificar `uploadImagePay` existente (sube imagen+retorna imageUrl separado). Dependencias nuevas: @aws-sdk/client-textract + @aws-sdk/client-s3. Requiere investigaciÃ³n: (1) Â¿usar bucket S3 propio o reenviar image directo a Textract desde memoria? (2) Â¿validar contra tÃ©rminos clave por banco como hace .NET BO API? (3) Â¿pre-llenar SOLO monto+referencia o tambiÃ©n otros campos?
2026-10-17 | YALO | DECISION | Multi-comprobantes por pago: anÃ¡lisis de flujo para mÃºltiples recibos relacionados a un pago. Dos opciones evaluadas: (A) Array de llamadas al mismo endpoint (cliente acumula N imÃ¡genes, backend no sabe relaciÃ³n hasta confirmPay); (B) Endpoint batch `POST /ocr-receipts/batch` procesa N imÃ¡genes en paralelo retornando array OcrReceiptResponseDto con batchId. Pregunta clave: Â¿validaciÃ³n requiere suma de montos = monto total pago, o cada recibo se valida independiente? Si independienteâ†’OpciÃ³n A suficiente (Banco A por X, Banco B por Y); si suma requeridaâ†’OpciÃ³n B o endpoint confirmar-batch para verificaciÃ³n multi-comprobante. Casos uso: pago dividido entre 2 bancos vs mÃºltiples transferencias parciales al mismo banco

## Session 4251dca8-8196-41b5-a2d2-7d2792c9025e (Resumen Final)

2026-10-17 | YALO | BUG | AWS Textract GetExpenseAnalysisCommandOutput â€” `Blocks` no existe a nivel raÃ­z, estÃ¡n dentro de `ExpenseDocument.Blocks` â€” fix en AwsTextractService: extrae bloques con `flatMap((d) => d.Blocks ?? [])` desde expenseDocs en analyzeExpense()
2026-10-17 | YALO | DECISION | Endpoint OCR recibos: POST /organizations/ocr-receipt (YaloConsole API NestJS) â€” extrae monto/referencia/fecha/banco desde recibos pago usando AWS Textract (StartExpenseAnalysis + polling S3), pre-rellena formularios sin modificar uploadImagePay; implementado y committeado, falta: DB config (script SQL systemrootconfig terminosClaveValidarRecibo), env vars AWS (ACCESS_KEY, SECRET_KEY, REGION, S3_BUCKET, S3_RECEIPTS_PREFIX)
2026-10-17 | YALO | CONFIG | Code review PRs indicador prÃ³rroga pago (#11658/#11659): 2 WARN seguridad (LastActivityGuard GET :id/gracePeriods, reload() en componente), 2 WARN datos (since="" vs null, console.error prod), 4 NOTES UX/lÃ³gica â€” 0 BLOCKERs, aprobado con revisiones
2026-10-17 | YALO | DECISION | Multi-comprobantes OCR: opciones batch vs individual â€” si validaciÃ³n independiente (recibo/banco distinto) suficiente OpciÃ³n A (llamadas por separado); si suma requeridaâ†’OpciÃ³n B (endpoint batch con batchId para verificaciÃ³n multi-comprobante)

## Session e24fa3b3-6d2e-4833-9913-69ab74c4c6f9

- 2026-10-19 | NAI | DECISION | InvestigaciÃ³n repos Engram + gentle-ai: anÃ¡lisis de arquitectura del agente de memory Naidelyn (subagent background ab0ccfa91aee33c45 para anÃ¡lisis comparativo de ambos repos)
2026-10-19 | NAI | CONFIG | Auto-mode bloqueÃ³ ediciÃ³n settings.json: intento de reemplazar MCP `memory` por `engram` + actualizar allowlist de permisos fue bloqueado por sistema auto-mode (razÃ³n: protecciÃ³n de settings.json contra cambios de permisos sin autorizaciÃ³n explÃ­cita del usuario). Requiere confirmaciÃ³n manual para proceder.
- 2026-10-20 | yalo console api | commit | estilo(reports): reduce altura totales y firma al 50% izquierdo
- 2026-10-20 | yalo console api | commit | fix(reports): formatea números con separador de miles en PDF cotizaciones
- 2026-10-20 | yalo console | commit | fix(quotations): formatea total con separador de miles en tabla de cotizaciones
- 2026-10-21 | yalo console api | commit | feat(office-equipment): agrega módulo de inventario de equipos de oficina
- 2026-10-21 | yalo trackeo | commit | feat(storage): migra subida de imágenes de Supabase a S3 vía Lambda
- 2026-10-21 | yalo trackeo | commit | fix(forms): corrige validacion de chips con multiple seleccion
- 2026-10-23 | naide | commit | feat(catalogo-inventario): completa pantallas y flujos del MFE (feat/pantallas-catalogo-inventario)
- 2026-10-23 | naide | commit | feat(shell): integra cat├ílogo e inventario mediante federaci├│n (feat/naidelyn/estructura)
- 2026-10-23 | naide | commit | feat(clientes): implementa gesti├│n de clientes como microfrontend (main)
- 2026-10-23 | naide | commit | feat(shell): integra autenticaci├│n y navegaci├│n de microfrontends (feat/naidelyn/estructura)
- 2026-10-23 | naide | commit | feat(catalogo): conecta productos e inventario con la API (feat/pantallas-catalogo-inventario)
- 2026-10-23 | naide | commit | feat(core): agrega autenticaci├│n y endpoints de clientes y productos (feat/naidelyn/reestructura)
- 2026-10-24 | naide | commit | feat(apoyo): agrega pantalla de soporte al shell (feat/naidelyn/estructura)
- 2026-10-24 | naide | commit | feat(inventario): conecta listados con endpoints reales (feat/pantallas-catalogo-inventario)
- 2026-10-24 | naide | commit | feat(inventario): conecta ajustes y movimientos con la API (feat/pantallas-catalogo-inventario)
- 2026-10-24 | naide | commit | feat(inventario): conecta proveedores y bodegas con la API (feat/pantallas-catalogo-inventario)
- 2026-10-24 | naide | commit | fix(api): apunta el MFE al backend de Yalo BO (feat/pantallas-catalogo-inventario)
- 2026-10-24 | naide | commit | feat(inventario): expone endpoints desde Yalo Agendo (feat/naidelyn/reestructura)
- 2026-10-24 | naide | commit | fix(api): consume inventario desde Yalo Agendo (feat/pantallas-catalogo-inventario)
- 2026-10-24 | naide | commit | feat(inventario): implementa endpoints en Core (feat/naidelyn/reestructura)
- 2026-10-24 | naide | commit | feat(documentos): agrega endpoints de inventario en Core (feat/naidelyn/reestructura)
- 2026-10-24 | naide | commit | fix(documentos): elimina el 401 en listados de inventario (feat/naidelyn/reestructura)
- 2026-10-25 | naide | commit | feat(agenda): completa calendario y flujos de reservas (feat/naidelyn/estructura)
- 2026-10-26 | naide | commit | feat(personas): agrega colaboradores, roles y certificados (feat/naidelyn/clientes-core)
- 2026-10-26 | naide | commit | tarea(federacion): limpia artefactos locales del MFE (feat/pantallas-catalogo-inventario)
- 2026-10-26 | naide | commit | feat(contratos-mfe): restaura contrato compartido y documentación (main)
- 2026-10-26 | yalo agendo api | commit | feat(recursos): agrega columnas de duración y precio variable a pro_productos
- 2026-10-26 | yalo agendo api | commit | feat(productos): mapea tipoduracion, duracionmaxima y preciovariable en la capa de datos
- 2026-10-27 | naide | commit | feat(health): unifica ruta y verifica las tres bases de datos (feat/naidelyn/reestructura)

- 2026-10-27 | yalo console fe | commit | feat(contingencias): agrega submodulo YaloCobro con contingencias y bitacoras
- 2026-10-27 | yalo console api | commit | feat(permisos): agrega script de permisos para modulo YaloCobro
- 2026-10-28 | naide | commit | feat(sync): ejecuta cat├ílogos cada 15 minutos sin alertas (feat/integracion-facturacion-monitor)
- 2026-10-28 | yalo spc delasa | commit | feat(sync): ejecuta catálogos cada 15 minutos sin alertas
- 2026-10-29 | naide | commit | feat(facturacion): corrige correlativos y agrega ├│rdenes por factura (development)
- 2026-10-29 | naide | commit | feat(console): actualiza facturas, notas de cr├⌐dito y permisos (development)
- 2026-10-29 | naide | commit | feat(roles): mejora la visualizaci├│n de permisos en el panel (development)
- 2026-10-29 | naide | commit | feat(roles): organiza m├│dulos y contadores de permisos (development)
- 2026-10-29 | yalo console | commit | feat(roles): organiza módulos y contadores de permisos
- 2026-10-29 | YALO_API_Administrator | commit | feat(permisos): registra acciones por contingencia YaloCobro (development)
- 2026-10-29 | YaloConsole | commit | feat(contingencias): controla acceso por acci├│n en YaloCobro (development)
- 2026-10-30 | YALO-Agendo-FE | commit | fix(federaci├│n): corrige compilaci├│n con entorno de CI (feat/naidelyn/estructura)
- 2026-10-30 | yalo agendo | commit | fix(federación): corrige compilación con entorno de CI
- 2026-10-30 | yalo-trackeo | commit | fix(tareas): permite cambiar estados sin tiempo y evita avisos duplicados (feat-mcp-servidor)
- 2026-10-30 | agent-ai-config | commit | feat: documenta POS y agrega MCP de lectura de producci├│n (feat/yalo-pos-readonly-mcp)
- 2026-10-30 | YALO-SKILLS | commit | docs: integra plugin de lectura POS en skill de base de datos (docs/yalo-pos-readonly-mcp)
- 2026-10-30 | YALO-PLUGINS | commit | feat: agrega plugin MCP de lectura de producci├│n POS (feat/yalo-pos-readonly-mcp)
- 2026-10-30 | agent-ai-config | commit | fix: instalar plugin YALO desde setup (feat/yalo-pos-readonly-mcp)
- 2026-10-30 | agent-ai-config | commit | feat(nai): prepara APK Android y corrige transporte seguro en Windows (master)
- 2026-10-30 | agent-ai-config | commit | feat(nai-bridge): genera QR temporal para emparejar Android (master)
- 2026-10-30 | agent-ai-config | commit | feat(nai-mobile): cifra bases nuevas y bloquea datos legacy sin migrar (master)
- 2026-10-30 | agent-ai-config | commit | docs(nai): registra APK verificado y pasos de prueba f├¡sica (master)
- 2026-10-30 | agent-ai-config | commit | fix(nai-mobile): registra fase segura de apertura de base (master)
- 2026-10-30 | agent-ai-config | commit | fix(nai-mobile): evita PRAGMA incompatible al abrir SQLCipher (master)
- 2026-10-31 | agent-ai-config | commit | Ampl├¡a plazo de vinculaci├│n segura a diez minutos (master)
- 2026-10-31 | agent-ai-config | commit | Corrige cierre del ACK y diagnostica fallo TLS m├│vil (master)
