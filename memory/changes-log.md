# ENGRAM Memory - Changes Log

## Session d30762e8-962c-4159-8f8f-e8c98fbb2684

2026-09-26 | YALO | CONFIG | SES integration: debug destinatarios, lotes y MessageId en AWS SES para yalo-trackeo
2026-09-26 | YALO | BUG | SES deliverability: emails bloqueados por servidor corporativo (cit.hn) debido a baja reputación de sandbox IPs — requiere salir de sandbox + configurar DKIM en dominio yalotechnologies.com

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | yalo bo api | commit | fix(liquidaciones): corrige saldo que excede total del pedido y pagos con monto cero
2026-10-01 | yalo bo | commit | fix(liquidaciones): oculta ordenes con monto a liquidar en cero

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

2026-09-30 | YALO | DECISION | Análisis de arquitectura YALO-API-Soporte: clone de repo y análisis completo via subagent (stack, estructura, módulos, integraciones, patterns, BD, Swagger)
2026-09-30 | YALO | DECISION | YALO-API-Soporte patterns: ServiceResult + ApiResponse wrappers, ApiKey auth (AWS Secrets), Read Replica interceptor (GET→reader, POST/PUT/PATCH/DELETE→writer), 3 PostgreSQL contexts + DynamoDB, BugReports↔Jira bidireccional, 56 endpoints (GET 27, POST 15, PUT 11, PATCH 2, DELETE 1)

## Session 6d163bc8-0381-4c0e-bc87-77b50f74de2c

2026-10-01 | YALO | GENERAL | Módulo QA v2 — porting completo desde v3 NM: constants (5339-4419), state fields, helpers (5366-5700), screen principal (1091-3026), drawers/modales (3026-3826), resumen en detalle tarea (786-840) con orden de ejecución verificado

## Session 56d0bcc2-ada8-4c9b-9ba5-23aa04478125

2026-10-01 | YALO | DECISION | Sistema de colores dinámicos en módulo QA: cada tipo de retorno (Bug/Sugerencia/Requerimiento) tiene activeColor y activeBg propios (rojo/dodoria, morado, azul brand) — mapeo en RETURN_TYPES.map con const active para refactorización limpia en Qa.tsx línea 221
2026-10-01 | YALO | BUG | QA preview persistencia: cambio estructura attachments de `string[]` (solo nombre, URL se perdía) a `{ name, url }[]` con data URL persistido en Zustand/Supabase — preview ahora abre tras recarga de sesión
2026-10-01 | YALO | BUG | Case row interactividad: agrega `cursor-pointer` explícito, `transition-colors` o `transition-opacity` (150ms) a elementos clickeables, y `transition-all` al checkbox para cambios de color/borde — mejora feedback visual en módulo QA
2026-10-01 | YALO | GENERAL | Report cards UX: agrega `cursor-pointer` + `transition-colors duration-150` a todos elementos interactivos, y display de evidencias del reporte como chips clickeables con lightbox para visualización

## Session ef38935f-cc72-40e0-89bb-37f29a110f70

2026-10-01 | YALO | BUG | Validación de liquidaciones: error en cálculo o UI que valida "valores deben ser mayor a 0" o "valores a liquidar son mayores al total" — validaciones localizadas en LiquidacionesController.cs líneas 427-429 (PostLiquidacion, montoLiquidar <= 0) y 475-477 (total pedido excedido); también en LiquidacionesService.cs líneas 82-89 (organizationId y employeeId <= 0)
2026-10-01 | YALO | BUG | Redondeo decimales en liquidaciones: Backend `ObtenerPagosPendientesAsync` topa saldoDisponible vs totalPedido para evitar "excede el total" con decimales; Frontend `loadOrdenesPendientes` filtra `.filter((orden) => orden.totalLiquidar > 0)` para no mostrar órdenes de Crédito con monto 0 en la lista
