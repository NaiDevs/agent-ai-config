# Nai Mobile — primera implementación

[Plan maestro en Notion](https://app.notion.com/p/40ad0ff5f9d081fab0a1d9b1c1894ae5)

Estado: Fase 0 y Fase 1 parcial. NO hay sincronización real con Engram ni app Android todavía.

## Componentes nuevos

- `packages/nai-sync-protocol/`: planificador de revisiones, conflictos y deduplicación. Es un **modelo neutral**, no el esquema interno de Engram.
- `nai-bridge/`: servicio HTTP **solo loopback** con `/v1/health` y `/v1/capabilities`, que informa que sincronización, pairing y agentes aún están deshabilitados.
- Comando `node nai-bridge/src/cli.mjs doctor`: detecta si Engram está instalado, sin leer ni modificar su base.

## Validación

```bash
cd packages/nai-sync-protocol
npm test
npm run check
cd ../../nai-bridge
npm test
node src/cli.mjs doctor
```

Validación local en Node 22: **13 pruebas pasan** (10 del protocolo, 3 del servicio) y `tsc --noEmit` sin errores. Se probó un borrador funcional en un entorno aislado; verificar de nuevo tras el checkout del PR.

## Pendiente

1. Confirmar comandos reales y versión de Engram en Windows.
2. Hacer backup consistente y probar su restauración.
3. Implementar adaptador de solo lectura conforme a las interfaces reales de Engram.
4. Añadir TLS, emparejamiento QR, autenticación mutua y autorización por proyecto antes de exponer el servicio en Wi-Fi.
5. Implementar Flutter Android local-first y sincronización incremental con checkpoints transaccionales.
6. Integrar Nai CLI únicamente después de garantizar aislamiento y aprobaciones.

## Seguridad

No agregar memorias privadas, bases Engram, tokens o credenciales al repo público. `sync.ps1` es sincronización Git de Markdown y no debe transportarse automáticamente como memoria P2P. Los endpoints actuales no permiten ejecutar comandos ni descargar memorias.


## Iteración 3 — snapshots locales incrementales

Se agregó `nai-bridge/src/snapshot.mjs` y el comando:

```powershell
cd nai-bridge
node src/cli.mjs snapshot --project "NOMBRE_REAL_DEL_PROYECTO"
```

Este comando realiza una exportación local temporal por proyecto y mantiene un
snapshot privado en `~/.nai/engram-snapshots/` (fuera de Git). Guarda solo
el último estado conocido de cada memoria y un vínculo con la revisión anterior
observada, **no** el historial causal completo de Engram. No escribe en Engram.

Reporta cantidades de memorias nuevas, actualizadas, eliminadas explícitamente,
sin cambios y ausentes. Una ausencia nunca implica eliminación automática.
No muestra texto de memorias en la consola. Los archivos se escriben mediante
temporal + rename, tienen límite de tamaño, bloqueo contra escrituras concurrentes
y validaciones de aislamiento por proyecto.

Se agregaron 12 pruebas adicionales, validadas localmente en Node 22.
La verificación contra la instalación real de Engram en Windows sigue pendiente.
**Advertencia:** la caché contiene textos de memorias sin cifrado propio;
mantenerla solamente en el dispositivo de confianza y no sincronizarla a Git.
El bridge sigue escuchando únicamente en localhost.


## Iteración 4 — identidades y emparejamiento firmado (offline)

Se añadió `nai-bridge/src/pairing.mjs`, `devices.mjs`,
`pair-session.mjs` y `device-commands.mjs`.

Los pares usan claves Ed25519 persistentes, invitaciones firmadas que caducan
en tres minutos, respuestas ligadas a cada invitación, comprobación humana de
un código de ocho dígitos, confirmación firmada, consumo del estado pendiente
y revocación. El registro empieza con `permissions: []`: vincular un dispositivo
NO le concede acceso a memorias ni ejecución de agentes.

Comandos locales de ejemplo:
```powershell
cd nai-bridge
node src/cli.mjs device init "Mi PC"
node src/cli.mjs device info
node src/cli.mjs pair invite
# En otro equipo con Nai Bridge:
node src/cli.mjs device init "Laptop"
node src/cli.mjs pair respond "TOKEN_DE_INVITACION"
# Comparar codigo visible en ambos equipos antes de confirmar
node src/cli.mjs pair confirm "TOKEN_RESPUESTA" "CODIGO"
node src/cli.mjs pair finalize "TOKEN_CONFIRMACION" "CODIGO"
node src/cli.mjs device peers
node src/cli.mjs device revoke "device:ID"
```

La aplicación Android, intercambio QR visual, autenticación mutua de transporte,
canal TLS/Wi-Fi y autorización por proyecto siguen pendientes. Este protocolo
de identidad por sí solo **no cifra el contenido transportado ni habilita la LAN**.

Las claves privadas quedan en `~/.nai/devices/identity.json`; proteger la cuenta
local, el disco y respaldos. En Windows comprobar ACL del perfil, en POSIX se
establecen modos privados. No subir esa carpeta a GitHub. El CLI emite únicamente
identificadores públicos, tokens de vínculo y códigos temporales.

Pruebas locales en Node 22: 18 tests de emparejamiento superados; integrada con
el bridge existente, la suite completa pasó con 43 tests en el entorno aislado.
