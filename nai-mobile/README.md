# Nai Mobile

## APK de distribución

La versión `0.2.0+2` tiene un APK release instalable en `nai-mobile/build/release/nai-mobile-0.2.0+2.apk` en esta PC. El archivo se genera localmente y está ignorado por Git. Para futuras versiones en Windows, ejecutar `powershell -NoProfile -ExecutionPolicy Bypass -File nai-mobile/scripts/build-release.ps1` desde la raíz del repositorio. El build release falla si falta la clave local; nunca usa la clave debug como sustituto.

La clave release, contraseña y linaje de firma están en `%LOCALAPPDATA%\NaiMobileSigning`, con acceso limitado al usuario y SYSTEM. **Guardar una copia de esa carpeta en un medio seguro fuera del repositorio**: perder la clave impide firmar actualizaciones compatibles. No subir la carpeta ni el APK de transición a GitHub. La firma release tiene SHA-256 `74566ddbc41427c632a397f0af3802928dcfdfbffae1bc30b8c51129e39817b9`.

El Samsung que tenía una instalación debug se actualizó una vez con un APK de transición firmado con linaje Android v3.1. Después aceptó el APK release normal con `adb install -r` y conservó las memorias cifradas. Para instalaciones nuevas, usar solo el APK release normal. El APK de transición se genera únicamente con `-IncludeDebugUpgrade` cuando sea necesario actualizar otra instalación con la firma debug original.

Cliente Flutter Android para consultar memorias offline y descargarlas manualmente desde Nai Bridge. La base nueva usa SQLCipher con clave aleatoria de 256 bits guardada mediante Android Keystore. Si existe la base anterior sin cifrar o falta la clave de una base cifrada, la app conserva los archivos y bloquea la apertura; la migración segura de esa base sigue pendiente.

## Flujo actual

1. En la PC, crear la identidad una sola vez: `node nai-bridge/src/cli.mjs device init "Mi PC"`.
2. Emitir `node nai-bridge/src/cli.mjs pair invite --qr`, escanear el SVG desde Nai Mobile y verificar la firma. Comparar el código de ocho dígitos, confirmar la respuesta en Bridge y pegar el ACK firmado en Android.
3. Iniciar `node nai-bridge/src/cli.mjs transport serve --mobile --port 4393` para `ping` autenticado. El servidor escucha solo en `127.0.0.1` por defecto; `--lan` abre la LAN explícitamente.
4. Para un proyecto concreto, crear su snapshot en Bridge, conceder `device grant-read ID_ANDROID PROYECTO` y reiniciar el servidor con `--mobile --memory`. En Android, indicar host, puerto y proyecto; consultar el manifiesto y confirmar **Descargar proyecto a base cifrada**. Retirar el permiso con `device deny-read ID_ANDROID PROYECTO` al terminar.

Para leer Engram sin crear una segunda copia persistente en la PC, usar `transport live PROYECTO` en lugar de crear un snapshot. Este modo solo sirve ese proyecto y elimina el archivo temporal de exportación tras cada solicitud.

Para probar por USB sin abrir firewall, ejecutar `adb reverse tcp:4393 tcp:4393` y usar `127.0.0.1:4393` en Android. El protocolo móvil TLS 1.3 usa certificado P-256 efímero y prueba firmada Ed25519 ligada al certificado y a los nonces de la conexión; el contrato está en [nai-mobile-transport-v2.md](../docs/nai-mobile-transport-v2.md). El transporte Node anterior usa el puerto 4392.

La descarga valida permiso, identidad de la PC, manifiesto, páginas y digest SHA-256 v2 antes de importar en una transacción. Las memorias se aíslan por `(source,id)` y los borrados requieren tombstones explícitos. No hay sincronización automática, escritura a Engram nativo ni sincronización bidireccional.

## Verificación

- `cd nai-bridge; npm test`: 75 pruebas, incluidas TLS real, permiso, peer revocado y rechazo de operación alterada.
- `cd nai-mobile; flutter analyze --no-fatal-infos; flutter test`: análisis sin errores y 27 pruebas, incluidas interrupción entre páginas y detección de restos de la base antigua.
- GitHub Actions `nai-mobile.yml` ejecución `41224806675`: análisis, pruebas, APK debug y artefacto en verde. El APK release `0.2.0+2` se compiló y verificó localmente.
- Samsung SM-S921U1, Android 16: emparejamiento y ACK firmados; TLS 1.3 real por USB y Wi-Fi directo; importación de 14 memorias Engram a SQLCipher, corte sin escritura parcial, reintento de 25 memorias sintéticas e idempotencia. La base permaneció cifrada y los datos sobrevivieron a la transición de firma y a la instalación del APK release normal.
- El teléfono rechazó un servidor TLS con certificado P-256 válido pero identidad Ed25519 distinta de la PC emparejada.

Los APK debug de CI son solo para pruebas. La migración de una base antigua sin cifrar sigue pendiente; en el Samsung actual solo existe la base SQLCipher. No publicar claves, bases, snapshots ni tokens privados.
