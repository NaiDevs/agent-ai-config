# Nai Mobile

Cliente Flutter Android para consultar memorias offline y descargarlas manualmente desde Nai Bridge. La base nueva usa SQLCipher con clave aleatoria de 256 bits guardada mediante Android Keystore. Si existe la base anterior sin cifrar o falta la clave de una base cifrada, la app conserva los archivos y bloquea la apertura; la migración segura de esa base sigue pendiente.

## Flujo actual

1. En la PC, crear la identidad una sola vez: `node nai-bridge/src/cli.mjs device init "Mi PC"`.
2. Emitir `node nai-bridge/src/cli.mjs pair invite --qr`, escanear el SVG desde Nai Mobile y verificar la firma. Comparar el código de ocho dígitos, confirmar la respuesta en Bridge y pegar el ACK firmado en Android.
3. Iniciar `node nai-bridge/src/cli.mjs transport serve --mobile --port 4393` para `ping` autenticado. El servidor escucha solo en `127.0.0.1` por defecto; `--lan` abre la LAN explícitamente.
4. Para un proyecto concreto, crear su snapshot en Bridge, conceder `device grant-read ID_ANDROID PROYECTO` y reiniciar el servidor con `--mobile --memory`. En Android, indicar host, puerto y proyecto; consultar el manifiesto y confirmar **Descargar proyecto a base cifrada**. Retirar el permiso con `device deny-read ID_ANDROID PROYECTO` al terminar.

Para probar por USB sin abrir firewall, ejecutar `adb reverse tcp:4393 tcp:4393` y usar `127.0.0.1:4393` en Android. El protocolo móvil TLS 1.3 usa certificado P-256 efímero y prueba firmada Ed25519 ligada al certificado y a los nonces de la conexión; el contrato está en [nai-mobile-transport-v2.md](../docs/nai-mobile-transport-v2.md). El transporte Node anterior usa el puerto 4392.

La descarga valida permiso, identidad de la PC, manifiesto, páginas y digest SHA-256 v2 antes de importar en una transacción. Las memorias se aíslan por `(source,id)` y los borrados requieren tombstones explícitos. No hay sincronización automática, escritura a Engram nativo ni sincronización bidireccional.

## Verificación

- `cd nai-bridge; npm test`: 72 pruebas, incluidas TLS real, permiso, peer revocado y rechazo de operación alterada.
- `cd nai-mobile; flutter analyze --no-fatal-infos; flutter test`: análisis sin errores y 22 pruebas.
- GitHub Actions `nai-mobile.yml` ejecución `41220075374`: análisis, pruebas, APK debug y artefacto en verde.
- Samsung SM-S921U1, Android 16: emparejamiento y ACK firmados; ping TLS móvil real por USB; manifiesto de una memoria sintética; revocación del permiso comprobada; descarga manual de esa memoria a SQLCipher, persistencia tras reiniciar e idempotencia (`0` nuevas, `1` sin cambios). La cabecera de la base tras importar no es `SQLite format 3`.
- El teléfono rechazó un servidor TLS con certificado P-256 válido pero identidad Ed25519 distinta de la PC emparejada.

Los APK debug de CI reciben una firma distinta por ejecución. Para actualizar una instalación con datos, firmar cada artefacto localmente con la **misma** clave de depuración antes de `adb install -r`. No publicar esa clave ni bases, snapshots o tokens privados. El acceso LAN directo y la migración de la base antigua aún requieren pruebas; usar un proyecto sintético para nuevas pruebas de transporte.
