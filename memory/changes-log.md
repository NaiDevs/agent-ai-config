# ENGRAM Memory - Changes Log

## Session d30762e8-962c-4159-8f8f-e8c98fbb2684

2026-09-26 | YALO | CONFIG | SES integration: debug destinatarios, lotes y MessageId en AWS SES para yalo-trackeo
2026-09-26 | YALO | BUG | SES deliverability: emails bloqueados por servidor corporativo (cit.hn) debido a baja reputación de sandbox IPs — requiere salir de sandbox + configurar DKIM en dominio yalotechnologies.com

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
