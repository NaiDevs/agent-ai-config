# ENGRAM Memory - Changes Log

## Session d30762e8-962c-4159-8f8f-e8c98fbb2684

2026-09-26 | YALO | CONFIG | SES integration: debug destinatarios, lotes y MessageId en AWS SES para yalo-trackeo
2026-09-26 | YALO | BUG | SES deliverability: emails bloqueados por servidor corporativo (cit.hn) debido a baja reputación de sandbox IPs — requiere salir de sandbox + configurar DKIM en dominio yalotechnologies.com

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | yalo bo api | commit | fix(liquidaciones): corrige saldo que excede total del pedido y pagos con monto cero
2026-10-01 | yalo bo | commit | fix(liquidaciones): oculta ordenes con monto a liquidar en cero
2026-10-04 | agendivo | commit | fix(onboarding): permite crear negocio sin sesión autenticada
2026-10-04 | agendivo | commit | feat(billing): registra suscripcion past_due al crear negocio y separa pantallas de acceso

## Session 05c3b771-276d-4e19-b3e1-5069376fddfe

2026-09-29 | YALO | CONFIG | Firma de aplicación Tauri (yalo-trackeo-desktop): roadmap para certificado OV Windows (DigiCert/Sectigo/SSL.com ~$100-500), Apple Developer ($99 + notarización), GitHub Secrets (WINDOWS_CERTIFICATE, APPLE_CERTIFICATE, TAURI_SIGNING_PRIVATE_KEY), y updater obligatorio bloqueante
2026-09-29 | YALO | CONFIG | Certificados de firma: instrucciones para obtener .pfx de Windows (empresarial OV), Apple Developer ID Application (.p12), Team ID y App-Specific Password — canales seguros (1Password, Bitwarden) vs inseguro (Slack/email)

## Session 464a9139-485a-45a0-80fb-01ca2f3a0abb

2026-09-29 | YALO | DECISION | Desarrollo en rama feat-mcp-servidor: cambios en rutas (Changelog, SettingsComms), store, funciones Supabase (mcp, novedad-email) con nueva clase compartida yalo-email
2026-09-29 | YALO | BUG | Aplicadas propiedades backgroundColor y background:#ffffff a canvas builder e HTML email para evitar fondo negro en imágenes PNG transparentes
2026-09-29 | yalo console api | commit | feat(organizations): agrega endpoint GET /api/trackeo/accounts para Yalo Trackeo
2026-09-29 | yalo trackeo | commit | feat(novedades): constructor visual de correo y campo cuenta API propia
2026-09-29 | YALO | DECISION | Edge Functions para bulk operations: procesa 1000 registros en ~30s server-side (vs 8min UI bloqueada) — 100 lotes de 10 en paralelo con 300ms entre lotes
2026-09-29 | yalo trackeo | commit | feat(novedades): envio masivo WhatsApp via Edge Function wa-send-bulk
2026-09-29 | yalo trackeo | commit | fix(wa): corrige token y saltos de línea en envíos WhatsApp
2026-09-29 | YALO | DECISION | Deploy wa-send-bulk exitoso (status ACTIVE): procesa cartera completa en lotes paralelos (10 registros server-side simultáneos) sin bloqueo cliente; commit 486b960
2026-09-29 | YALO | CONFIG | WhatsApp Meta Cloud API: sandbox mode requiere agregar phone numbers como test recipients en Meta Business Manager — code correcto, issue es restricción Meta en modo Development
2026-09-29 | YALO | BUG | WhatsApp Meta: número +50495349633 (Naidelyn) marcado como spam en Business Account — API retorna messageId pero Meta no entrega; solución requiere desbloquear en Phone Numbers Manager o revisar restricción de calidad de cuenta
2026-09-29 | YALO | CONFIG | WhatsApp: saltos de línea en parámetros de plantilla NO son soportados por Meta Cloud API — redeploy v6/v20 usa formato en línea plana (sin \n) como workaround validado
2026-09-29 | yalo trackeo | commit | feat(novedades): agrega envío masivo por correo a toda la cartera
2026-09-29 | yalo trackeo | commit | feat(proyectos): usa RichTextEditor en descripción del modal de proyecto
2026-09-29 | yalo trackeo | commit | feat(tiempo): timesheet estilo Hubstaff con reportes y billable
2026-09-29 | YALO | DECISION | Modal de proyecto: campo Descripción migrado de textarea a RichTextEditor (toolbar con bold, italic, listas, links igual que en tareas) para mejor edición de contexto y objetivos
2026-09-29 | YALO | DECISION | Timesheet módulo completo (YATR-142): filtros sidebar, Group By (persona/proyecto/tarea/fuente), EditTimeEntryModal, columnas Facturable/No facturable, exportación Excel (ExcelJS con logo y colores) y PDF (pdf-lib A4 landscape), campos billable en TimeEntry y Tarea con acciones store + persistencia
2026-09-29 | yalo trackeo | commit | feat(tiempo): exportación Excel en formato plano estilo Hubstaff
2026-09-29 | YALO | GENERAL | Columna Actividad: mostrar porcentaje calculado desde activity_blocks de cada entrada (mismo cálculo que actividadPct() en componente); vacío si entrada es manual o sin bloques

## Session 464a9139-485a-45a0-80fb-01ca2f3a0abb (continuación)

2026-09-30 | YALO | BUG | activityBlocks solo se cargaba con vista='actividad'; exports mostraban 0% actividad. Solución: ambos exports (Excel/PDF) ahora cargan directamente de activity_blocks al exportar, independiente del tab activo, usando snake_case fields (tracked_s, keyboard_s, mouse_s, pantalla_s, time_entry_id)
2026-09-30 | yalo trackeo | BUG | Indicador visual (puntito) en campo de fecha "MAR 29" desalineaba fila — removido, solo aplica cambio de color (brand azul) al marcar como destacado

## Session 403530a7-7dff-4b6a-ba43-7eea3875745f

2026-09-30 | YALO | DECISION | YA-143 (Bitácora pedidos cliente): nuevo endpoint GET /api/contingencias/clientes/pedidos + componente BitacoraPedidosClienteComponent con búsqueda por cliente (nombre/teléfono/código) y muestra facturas
2026-09-30 | YALO | DECISION | YA-144 (Actualizar info cliente): nuevo endpoint PATCH /api/contingencias/clientes/:codCliente + modal de edición en yalo-vendo-entrego categoría Clientes (referencia campos yalo bo)
2026-09-30 | YALO | DECISION | Arquitectura YaloConsole bitácoras: componentes standalone (bitacora-pedidos, bitacora-clientes), service pattern con endpoints GET /bitacoras/**/buscar, signal-based state management, timeline diff tracking

## Session b9ac393f-93e0-47b9-9b2d-5a7d7a0aa985

## Session 22a83bab-58b6-4972-a052-5758d237bc8d

- 2026-10-02 | yalo console api | commit | feat(secrets): agrega modulo de secretos de un solo uso con cifrado E2E
- 2026-10-02 | yalo console | commit | feat(organizations): agrega secretos de un solo uso con cifrado E2E
2026-10-02 | YALO | FEATURE | Secretos de un solo uso: tab "Secretos" en Organizations (YaloConsole), cifrado E2E AES-GCM con clave en fragmento URL, POST auth + GET público delete-on-read en YALO_API_Administrator, ruta pública /secret/:id sin auth

2026-10-02 | YALO | DECISION | Onboarding UI: permitir asignar/reasignar leads en onboarding con interfaz drag-drop y modal de asignación, integración con sacAgentId en API
2026-10-02 | YALO | DECISION | Sales Pipeline: agregar motivo configurable (lista desplegable) al reasignar lead a otro asesor; motivo seleccionable por defecto (no texto libre) integrado con endpoint PATCH /crm-deals
2026-10-02 | YALO | FEATURE | Organizations: agrega valor suscripción USD/LPS (calcula USD desde productos activos, LPS con tasa del último pago/fallback 24.7), oculta productos con cantidad=0, corrige dark mode en tab Productos

2026-09-30 | YALO | DECISION | Análisis de arquitectura YALO-API-Soporte: clone de repo y análisis completo via subagent (stack, estructura, módulos, integraciones, patterns, BD, Swagger)
2026-09-30 | YALO | DECISION | YALO-API-Soporte patterns: ServiceResult + ApiResponse wrappers, ApiKey auth (AWS Secrets), Read Replica interceptor (GET→reader, POST/PUT/PATCH/DELETE→writer), 3 PostgreSQL contexts + DynamoDB, BugReports↔Jira bidireccional, 56 endpoints (GET 27, POST 15, PUT 11, PATCH 2, DELETE 1)

## Session 6d163bc8-0381-4c0e-bc87-77b50f74de2c

2026-10-01 | YALO | GENERAL | Módulo QA v2 — porting completo desde v3 NM: constants (5339-4419), state fields, helpers (5366-5700), screen principal (1091-3026), drawers/modales (3026-3826), resumen en detalle tarea (786-840) con orden de ejecución verificado

## Session 56d0bcc2-ada8-4c9b-9ba5-23aa04478125

2026-10-01 | YALO | DECISION | Sistema de colores dinámicos en módulo QA: cada tipo de retorno (Bug/Sugerencia/Requerimiento) tiene activeColor y activeBg propios (rojo/dodoria, morado, azul brand) — mapeo en RETURN_TYPES.map con const active para refactorización limpia en Qa.tsx línea 221
2026-10-01 | YALO | BUG | QA preview persistencia: cambio estructura attachments de `string[]` (solo nombre, URL se perdía) a `{ name, url }[]` con data URL persistido en Zustand/Supabase — preview ahora abre tras recarga de sesión
2026-10-01 | YALO | BUG | Case row interactividad: agrega `cursor-pointer` explícito, `transition-colors` o `transition-opacity` (150ms) a elementos clickeables, y `transition-all` al checkbox para cambios de color/borde — mejora feedback visual en módulo QA
2026-10-01 | YALO | GENERAL | Report cards UX: agrega `cursor-pointer` + `transition-colors duration-150` a todos elementos interactivos, y display de evidencias del reporte como chips clickeables con lightbox para visualización
2026-10-02 | YALO | BUG | Badge Release tab QA: contaba tareas "listo" sin filtrar por `enabledBoards`, mostraba "1" con tableros vacíos — corregido en Qa.tsx lines 1485-1498 filtrando qaTasks/qaTickets por enabledBoards en useMemo

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | YALO | BUG | Validación de liquidaciones: error en cálculo o UI que valida "valores deben ser mayor a 0" o "valores a liquidar son mayores al total" — validaciones localizadas en LiquidacionesController.cs líneas 427-429 (PostLiquidacion, montoLiquidar <= 0) y 475-477 (total pedido excedido); también en LiquidacionesService.cs líneas 82-89 (organizationId y employeeId <= 0)
2026-10-01 | YALO | BUG | Redondeo decimales en liquidaciones: Backend `ObtenerPagosPendientesAsync` topa saldoDisponible vs totalPedido para evitar "excede el total" con decimales; Frontend `loadOrdenesPendientes` filtra `.filter((orden) => orden.totalLiquidar > 0)` para no mostrar órdenes de Crédito con monto 0 en la lista
2026-10-01 | YALO | BUG | QA config dropdown: mismatch de claves al guardar — ahora usa estados reales del workflow (backlog, todo, progreso, review, done, canceled) con labels de ISTATUS; auto-envío agregado en setTaskStatus/setTaskState — verifica qaCfg?.autoSendStatus y envía automáticamente si no hay entrada QA previa
2026-10-01 | YALO | DECISION | Grid campos módulo QA: reorganiza 7 campos en 2 filas (BUILD, AMBIENTE, TESTER, ENVIADA A QA | PUBLICACIÓN, TIEMPO DE PRUEBA, EN COLA) con semántica: ENVIADA A QA (fecha sin hora), PUBLICACIÓN (release date o "—"), TIEMPO DE PRUEBA (sum time entries o "—"), EN COLA (días/horas); removido campo ENVIADA POR

## Session 22a83bab-58b6-4972-a052-5758d237bc8d

2026-10-02 | yalo console api | feat | reassignmentReason en UpdateCrmDealDto + motivo en descripción de actividad al reasignar asesor (rama fix/naidelyn/caracteres-especiales-slack)
2026-10-02 | yalo console | feat | Modal de motivo al reasignar asesor en deal drawer (5 motivos hardcodeados); botones Asignar/Reasignar con dropdown en kanban card de onboarding (solo manager/admin); campo SAC editable en drawer de onboarding via modal popup; "Tomar cuenta" eliminado del drawer de onboarding (rama feat/naidelyn/ventas)
2026-10-02 | yalo console | feat | Valor suscripcion USD/LPS en Historial de Pagos (calculado desde productos activos con tasa del ultimo pago); oculta productos con cantidad 0; dark mode tab Productos via section bg-neutral-white + :host-context(.dark)

## Session 1e9a05e0-795d-4bee-b9cd-c6a9f6e69ab7

2026-10-02 | YALO | BUG | Validación liquidaciones: falso positivo "montos exceden total pedido" — saldoEfectivo redonda a 2 decimales, pero comparación usaba NormalizarMonto (4 decimales), causando diferencias hasta 0.003 en pedidos con centavos en 3er decimal; fix: redondea totalPedido y totalSolicitado a 2 decimales antes de validar
2026-10-02 | yalo bo api | commit | fix(liquidaciones): corrige falso positivo al validar monto contra total del pedido
2026-10-02 | YALO | BUG | Rutas con parámetros opcionales: soluciona error al listar órdenes donde querystring faltaba parametrización en URL base — corregido en endpoint con cast seguro de queryParameters en hotfix/naidelyn/rutas
2026-10-02 | yalo console api | BUG | Integración Stripe en notas de crédito (credit-notes.service.ts): `applyStripeBalance` llamaba a endpoint sin `/api/` prefix, causando 404 en YALO_API_Stripe; `reverseStripeBalance` ya tenía `/api/` — fix: añade `/api/` al endpoint CustomerBalance para consistencia
2026-10-02 | YALO | CONFIG | Variables de entorno yalo console api: investigación de dónde están configuradas (AWS Secrets, .env de servidor, pipeline) para diferenciar prod/staging — revertido cambio previo para replantear configuración correcta
- 2026-10-02 | naide | commit | feat(customer-balance): agrega cr├⌐ditos y reversiones (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | feat(cr├⌐dito): integra notas con Stripe y PDF fiscal (fix/naidelyn/caracteres-especiales-slack)
- 2026-10-02 | naide | commit | feat(console): integra notas de cr├⌐dito y mejoras operativas (feat/naidelyn/ventas)
- 2026-10-02 | naide | commit | fix(customer-balance): refuerza seguridad e idempotencia (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(cr├⌐dito): env├¡a moneda al saldo de Stripe (fix/naidelyn/caracteres-especiales-slack)
- 2026-10-02 | naide | commit | fix(customer-balance): asegura idempotencia y auditor├¡a (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): corrige configuraci├│n y compatibilidad (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): maneja fallos parciales de auditor├¡a (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): garantiza unicidad y libera recursos (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): valida configuraci├│n y entradas Stripe (feat/naidelyn/stripe)
- 2026-10-02 | naide | commit | fix(customer-balance): explicita estado de procesamiento (feat/naidelyn/stripe)
2026-10-02 | YALO | FEATURE | Commit 5418174 pusheado en feat/naidelyn/ventas — integración completa de asignación/reasignación de leads en onboarding y pipeline de ventas
2026-10-02 | YALO | BUG | FormaPago inconsistencia en confirmación de pago: YaloConsole POST /organizations/confirm-pay envía FormaPago=3, pero YaloPOSBackofficeAPI endpoint PagoFacturaTransferencia/ActivarSuscripcion hardcodea formapago=2 en BD ignorando parámetro — Slack se genera correctamente (leyendo FormaPago=3), pero tabla muestra transferencia. Fix necesario en BO API para respetar el FormaPago enviado

## Session e43e024d-dccc-41eb-a6b9-5b46cd8739ce

2026-10-02 | CORINSA | BUG | Inventario septiembre - correlativo AI-18-A-2025-00170 no aparece en reportes (Inventario, AI, Pronóstico, Dashboard) por vigencia extendida con adendum
2026-10-02 | CORINSA | BUG | Inventario septiembre - correlativo AI-12-C-2022-00191 cambió ramo a Salud pero reportería sigue mostrando Tradicional
2026-10-02 | CORINSA | BUG | Inciso duplicado al agregar ítem manual en Recursos>Suministros>Otros (Periodicidades: Por única vez, Anualmente, Cada dos años) — bloquea deploy a producción; Jonathan coordinará after fix
2026-10-02 | CORINSA | GENERAL | Payback CD El Progreso desajuste: 2.25 actual vs 2.42 correcto — ~38 correlativos de trabajos ing/adendums no están sumando
2026-10-02 | CORINSA | CONFIG | Repos con cambios sin commitear: cpa webapi (rama 2025-cambio-estados, 1 archivo), cpa webapp (rama feat/naidelyn/reporteRentabilidad, 5 archivos), cpa ventas (rama feat/naidelyn/ventas2021, 17 archivos)

## Session 3ce5c0e8-22f6-45b4-837a-1b9598bf68a6

2026-10-03 | YALO | DECISION | Feature jerarquía de tareas: análisis UX para identificación de contexto — breadcrumb en vista detalle (/task/:id) vs columna proyecto/epic en lista (/tasks) vs ambas; propuesta de diseño pendiente
2026-10-03 | YALO | DECISION | Ciclos scoped a tableros: `Ciclo` con `boardId?` opcional, `createCycle` filtra activación por board, ReleaseTab toma última release sin firmar, selector de tablero en /ciclos global, sección "Ciclos" en ProjectDetail con listado, badge "Activo", botón "Nuevo ciclo" pre-asignado
2026-10-03 | YALO | DECISION | Módulo QA v2 completo: routes/Qa.tsx (inline-edit build/env, retornos Editar/Quitar, borrar con confirm, tab Release con firma, dedup releasedIn), store actions (createQaRelease, signRelease reescrito con releasedIn/aiGenerated/boardIds, createCycle con boardId, ciclos por tablero), types (boardId en Ciclo, releasedIn en QATask), Changelog ordena novedades ASC por id, CycleModal exportado con boardId, dark mode CSS (--color-bg, tokens navy/cyan/cell, semáforos), supabase migrations qa_module + qa_board_id
2026-10-03 | YALO | FEATURE | Sort novedades: ordena Changelog de más reciente a más antigua por id (Changelog.tsx), visible en tab "Novedades" de módulo QA
2026-10-03 | yalo-trackeo | commit | feat(qa/ciclos/novedades): módulo QA completo, ciclos por tablero y orden de novedades
2026-10-03 | YALO | CONFIG | Servidor MCP: desarrollo en rama feat-mcp-servidor, commit 4771095 pusheado — integración MCP para yalo-trackeo

## Session fe50de79-b897-4353-9e59-4e5736f3971d

2026-10-03 | La Bodega | BUG | Monitor de pedidos no apareciendo: tres causas raíz históricas resueltas por Daniel Brizuela en BD/config — (1) pedidos viejos (filtro fecha creación), (2) monitor sobreescribiendo estados desde otra bodega (patrón con Merendón), (3) monitores duplicados o correlativo incorrecto en establecimiento — diagnóstico para #419148 (Mall Galerías) requiere validar antigüedad pedido, cantidad de monitores configurados, y si jalando estados de otra bodega
2026-10-03 | La Bodega | BUG | Orden 615931 no aparece en monitor de establecimiento 485 (Mall Galerías): codpuntoemision=1094 asignado pero establecimiento solo posee punto de emisión 547 — monitor filtra por establec→punto emisión y no encuentra registro; solución: UPDATE ordenes SET codpuntoemision=547 WHERE codorden=615931
2026-10-03 | YALO | BUG | Monitor de órdenes: filtro de 24 horas estricto en controller (línea 355) excluye órdenes con > 24h de antigüedad — diagnosticado orden con fechacreacion 2026-10-02 10:50 que a 2026-10-03 11:46 suma 25h, cae fuera de ventana; solución: cambiar fecha_creacion para caer dentro de últimas 24h o revisar lógica de rango temporal
2026-10-03 | La Bodega | BUG | Monitor de pedidos Mall Galerías: polling de 30 segundos comentado en home.page.ts (línea 327-329); monitor carga órdenes solo al inicio y vía SignalR — orden con fecha actualizada 2026-10-02→2026-10-03 no dispara evento SignalR, requiere F5 manual o descomentar polling de actualización periódica

## Session 615b1d85-6254-4ff1-8b94-a0a04ebc03ef

2026-10-04 | NAI | CONFIG | Engram auto-save: actualmente guardando automáticamente (CLAUDE.md triggers), genera inquietud sobre consumo de tokens. Propuesta: afinar triggers para guardar solo decisiones arquitectónicas relevantes, no bugs menores ni config rutinarios. Alternativa: explicit save-on-demand quitando auto-save del CLAUDE.md

## Session 73c74dd6-0562-45cd-a487-3d7282570282

2026-10-04 | NAI | CONFIG | Code signing agendivo (Windows + macOS): target principal Honduras (mayormente Windows). Windows SmartScreen advierte sin certificado; macOS Gatekeeper bloquea sin firma Apple (baja prioridad para Honduras). Opción evaluada: Azure Trusted Signing ($9.99/mes, SmartScreen-compatible, sin hardware token, integra con GitHub Actions). Apple Developer ($99/año) diferido. Decisión: implementar Azure Trusted Signing para Windows primero.
2026-10-04 | NAI | CONFIG | Normalización line endings agendivo: configurado .gitattributes con `* text=auto eol=lf` (todos los archivos en LF) y `*.bat text eol=crlf` (batch scripts permanecen CRLF para Windows) — commit 46cedbe pusheado, CI debería pasar ahora
2026-10-04 | NAI | CONFIG | Tauri 2 dmg build: commit e34a982 pusheado — bloque configuración `dmg` removido en Tauri 2 (incompatible), target `dmg` en `targets` sigue siendo válido; customización de layout DMG debe ir dentro de `macOS` build config, no como bloque separado
2026-10-04 | NAI | GENERAL | Graphify (skill de visualización de grapos/DAGs): configurado en CLAUDE.md pero nunca activado en uso real hasta hoy — sesión explora estado actual y opciones para integración
2026-10-04 | NAI | BUG | onboarding: fix en src/stores/app.store.ts — crea empleado propietario solo si hay usuario autenticado; en modo offline (Supabase no configurado) inicia employees vacío sin lanzar error — resolve "No encontramos la cuenta propietaria activa"
2026-10-04 | NAI | CONFIG | agendivo: commit 71532dc pusheado — corrección para pasar CI (verificable en conversación posterior)
2026-10-04 | NAI | CONFIG | Release v0.2.1 agendivo: tag pusheado, GitHub Actions workflow ejecutándose — buildea Windows + macOS y sube instaladores a Supabase

## Session 73c74dd6-0562-45cd-a487-3d7282570282

2026-10-05 | NAI | CONFIG | agendivo: reset de base de datos anterior (contenía migración desactualizada/incompatible), relanzado dev environment con Tauri dev — resolución de estado inconsistente de BD para nueva sesión de desarrollo
2026-10-05 | NAI | DECISION | agendivo: flujo de acceso a suscripción con Stripe — (1) registro nuevo → `ensureBusiness` crea negocio en Supabase + inserta `past_due` automáticamente; (2) pantalla "Tu acceso está pendiente" con clock icon y botón "Verificar acceso"; (3) webhook Stripe → `sync-subscription` → status `active` desbloquea app; (4) otros estados (cancelado, vencido) → pantalla genérica "Sin acceso" con estado visible

## Session b623c5ee-0c39-4259-a75b-476c49c7ef62

2026-10-05 | YALO | CONFIG | Activación de proyecto yalo-trackeo: rama feat-mcp-servidor, árbol limpio, commits recientes en moduleQA y ciclos por tablero

## Session 8f8c98d5-80b7-45d5-8f6d-5d1aff068f52

2026-10-05 | NAI | CONFIG | Autenticación Edge Functions agendivo: flujo Bearer token — ADMIN_SECRET configurado en Supabase, replicado en app como "Admin Secret", cada request envía `Authorization: Bearer <valor>` validado por función
2026-10-05 | NAI | BUG | nai-admin: AuthProvider.setPin() no seteaba _isUnlocked=true, causando redirección a PIN después de crear PIN — fix: setPin() ahora actualiza _isUnlocked y notifica listeners para permitir navegación a /projects
2026-10-05 | NAI | CONFIG | nai-admin: rebuild APK release tras creación del proyecto Flutter — compilación en progreso
2026-10-05 | NAI | CONFIG | agendivo release v0.2.1: instalación y configuración de credenciales Supabase (URL + Admin Secret) via modal de setup en app — workflow eliminación/reinicio de proyecto para reconfiguración
2026-10-05 | NAI | BUG | nai-admin: funcionalidad delete bloqueada en app móvil — investigación iniciada para identificar causas (UI no ejecuta acción, lógica en backend, o validación de permisos)
2026-10-05 | NAI | BUG | nai-admin: problemas de carga de datos desde backend — "sigue sin cargar" indica timeouts o errores en peticiones HTTP/sincronización
