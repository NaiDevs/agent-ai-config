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
