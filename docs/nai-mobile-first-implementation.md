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


## Iteración 2 — lector Engram en modo lectura

El código oficial de Engram admite `engram export FILE --project NAME`.
`nai-bridge/src/engram.mjs` interpreta `observations[]` con IDs `sync_id`,
fechas, títulos, contenido y borrados; ignora sesiones y prompts para la salida.
**No accede ni modifica la BD directamente y no expone memorias en HTTP**.
Usa una carpeta temporal privada y la elimina incluso si falla la exportación.

En Windows:
```powershell
cd nai-bridge
node src/cli.mjs doctor
node src/cli.mjs inspect --project "NOMBRE_REAL_EN_ENGRAM"
npm test
```

`inspect` solamente muestra conteos; no imprime el contenido.
Hay diez pruebas nuevas de parsing, filtrado y seguridad, superadas con fixtures
sintéticos (más las 13 anteriores: **23/23 pruebas locales**). La ejecución
real contra Engram en Windows sigue pendiente; respaldar datos antes de probar.

**Limitación causal:** las revisiones hash derivadas de snapshots no incorporan
ancestros reales de Engram. Hasta implementar un journal/checkpoint seguro,
no deben enviarse directamente al planificador bidireccional existente.
