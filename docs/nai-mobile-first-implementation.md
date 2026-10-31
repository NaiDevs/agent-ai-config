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
