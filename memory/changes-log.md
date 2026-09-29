# ENGRAM Memory - Changes Log

## Session d30762e8-962c-4159-8f8f-e8c98fbb2684

2026-09-26 | YALO | CONFIG | SES integration: debug destinatarios, lotes y MessageId en AWS SES para yalo-trackeo
2026-09-26 | YALO | BUG | SES deliverability: emails bloqueados por servidor corporativo (cit.hn) debido a baja reputación de sandbox IPs — requiere salir de sandbox + configurar DKIM en dominio yalotechnologies.com

## Session 05c3b771-276d-4e19-b3e1-5069376fddfe

2026-09-29 | YALO | CONFIG | Firma de aplicación Tauri (yalo-trackeo-desktop): roadmap para certificado OV Windows (DigiCert/Sectigo/SSL.com ~$100-500), Apple Developer ($99 + notarización), GitHub Secrets (WINDOWS_CERTIFICATE, APPLE_CERTIFICATE, TAURI_SIGNING_PRIVATE_KEY), y updater obligatorio bloqueante

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
