# Handoff a Codex - Nai Mobile / Nai Bridge

## Avance en Android real (2026-10-31)

- Samsung SM-S921U1 (Android 16) conectado por ADB. El APK corregido abre la pantalla principal, crea una base SQLCipher con cabecera cifrada y vuelve a abrir tras reiniciar el proceso. No se importaron memorias privadas.
- El APK debug de CI se firmó localmente con la misma clave de depuración antes de `adb install -r`; conservar esa firma para próximas actualizaciones sin borrar datos. No publicar la clave.
- El teléfono verificó la invitación Ed25519 de la PC y generó respuesta QR y código de ocho dígitos. Dos intentos de confirmación en Bridge vencieron durante el intercambio; ninguno quedó finalizado en el teléfono. El par anterior se revocó y no tiene permisos de lectura.
- El plazo de invitación se amplió de tres a diez minutos en Bridge y Flutter; CI `41216500019` pasó y se instaló el nuevo APK con firma local estable. La app abrió la base cifrada existente sin error.
- Emparejamiento real completado: Android verificó invitación Ed25519, Bridge verificó respuesta y código `05515667`, y Android guardó el ACK firmado. Tras reiniciar, la pantalla de conexión muestra la PC vinculada. El peer PC no tiene permisos de lectura.
- Al cerrar el diálogo de ACK apareció una aserción Flutter (`framework.dart`, `_children.contains(child)`), aunque el host quedó persistido. Se cambió el ciclo de vida del controlador y se evitó cerrar la página durante la transición del diálogo; falta verificar el arreglo en el siguiente APK.
- `adb reverse tcp:4392 tcp:4392` y `transport serve --port 4392` (loopback, solo ping, sin memoria) funcionaron, pero el primer ping Android mostró un error genérico de autenticación. Se agregó diagnóstico sin contenidos privados para identificar si falla el socket, el handshake o la verificación local. Falta repetir TLS con el APK actualizado.
- El diagnóstico del servidor identificó `ERR_SSL_NO_SUITABLE_SIGNATURE_ALGORITHM`: Android no negocia el certificado TLS Ed25519. Se añadió transporte móvil v2 en puerto 4393 con certificado TLS 1.3 ECDSA P-256 efímero y autenticación de cada conexión mediante las identidades Ed25519 emparejadas. Contrato y análisis de replay en `docs/nai-mobile-transport-v2.md`. La ruta Node anterior en 4392 sigue disponible. Pruebas Node de ping real, cliente desconocido y manifest sin `--memory` pasan; falta prueba Android real del nuevo APK.
- Para la siguiente prueba: `adb reverse tcp:4393 tcp:4393`, `node nai-bridge/src/cli.mjs transport serve --mobile --port 4393` en loopback, abrir Conectar con PC en Android y usar `127.0.0.1:4393`. La PC y teléfono ya están emparejados; no repetir el QR salvo que se revoque o pierda identidad.
- CI `41218915534` pasó. APK firmado localmente e instalado sin borrar datos. En Samsung Android 16, ping v2 mostró conexión TLS auténtica. Manifiesto de proyecto sintético `nai-mobile-demo` devolvió 1 memoria con permiso temporal; al retirar el permiso la consulta falló y el ping siguió funcionando. El peer quedó activo con `permissions: []`; el servidor sintético se detuvo.
- La pantalla de conexión permite descarga manual con confirmación explícita hacia la base SQLCipher verificada. Reutiliza `NaiSyncClient.pullProject()` (paginación y digest v2) y la transacción aislada por peer de `MemoryStore`; la base antigua sin cifrar sigue bloqueada.
- CI `41220075374` pasó y el APK se instaló manteniendo la firma y datos. En Samsung, una memoria sintética con ID `engram:demo-1` del proyecto `nai-mobile-pull-demo` se descargó por TLS v2, validó digest y entró en SQLCipher (`1 nueva`). Tras `am force-stop` y nueva apertura permaneció visible; una segunda descarga informó `0 nuevas, 0 actualizadas, 1 sin cambios`. La cabecera de la base cifrada tras importar comenzó `32 11 7b 95`, no `SQLite format 3`. Se retiró el permiso temporal y `device peers` confirmó `permissions: []`; el servidor sintético se detuvo.
- Queda por probar LAN directa, revocación de peer durante transferencia, interrupción a mitad de páginas, migración segura de la base antigua sin cifrar y sincronización de un proyecto Engram real autorizado. No habilitar sincronización automática ni escritura remota sin diseñar esos casos.
- Prueba Android de identidad falsa completada: un servidor TLS P-256 efímero en `127.0.0.1:4393` con otra identidad Ed25519 fue rechazado por la app en la verificación local, aun con certificado TLS válido. El servidor falso se detuvo. Pruebas Node adicionales de peer revocado y operación alterada tras firmar pasan; suite Bridge 72/72.
- LAN directa sigue pendiente: Windows usa Wi-Fi `192.168.1.42` con perfil público y el teléfono estaba solo en datos móviles (`rmnet_data0`, sin Wi-Fi). Se pidió conectar Android a la misma Wi-Fi; no abrir `--lan` hasta poder comprobar la ruta con ping sin memorias.
- Se inyectó un escritor en `NaiSyncClient` para probar el límite de persistencia sin base real. Pruebas Flutter nuevas confirman que digest incorrecto y página incompleta rechazan la descarga antes de llamar a la escritura; suite Flutter 25/25 y análisis sin errores.
- Mantener deshabilitada la descarga de memorias privadas; la migración de bases antiguas en texto claro sigue pendiente de diseño y prueba.

## Avance Windows (2026-10-30)

- Node 22.21.1 y Engram 3.4.0 disponibles. OpenSSL 3.5.4 está instalado con Git en `C:\Program Files\Git\usr\bin`, pero no está en `PATH`; Nai Bridge ahora lo detecta en esa ruta estándar.
- `nai-bridge`: 65/65 pruebas locales pasan, incluidas TLS 1.3, permisos por proyecto, revocación y la ruta de comandos `transport pull` / `transport serve --lan --memory`. Se corrigió el fixture TLS que omitía la versión de identidad.
- `transport pull` ahora valida manifiesto, páginas y digest sin persistir datos por defecto. La persistencia de memorias remotas queda reservada a pruebas sintéticas con un destino temporal explícito, hasta implementar cifrado local.
- `flutter doctor -v`: Flutter 3.47.6 y Android SDK 36 presentes. Faltan Android cmdline-tools y el estado de licencias es desconocido. ADB no detectó teléfono Android.
- El workflow Flutter ahora sube el APK debug como artefacto de la ejecución durante siete días.
- CI del commit `78f9bbc`: el build y `Upload debug APK` finalizaron correctamente en https://github.com/NaiDevs/agent-ai-config/actions/runs/41157788999 . Artefacto `nai-mobile-debug-apk` confirmado por API de GitHub (90.7 MB, vigente).
- `node nai-bridge/src/cli.mjs pair invite --qr` genera un SVG temporal de la invitación firmada para escanear desde Android; el archivo solo contiene el token público y caduca con la invitación.
- La base nueva usa `sqflite_sqlcipher` 3.4.1 y una clave aleatoria de 256 bits guardada por `flutter_secure_storage`. Si existe la base SQLite anterior en texto claro o falta la clave de una base cifrada, la app falla cerrada y conserva los archivos. La migración segura de la base anterior sigue pendiente de prueba en Android real.
- El manifiesto Android bloquea Auto Backup, transferencia de datos entre dispositivos y tráfico claro. La descarga real permanece deshabilitada hasta verificar SQLCipher y TLS en un teléfono.
- CI del commit `7a4e45c`: https://github.com/NaiDevs/agent-ai-config/actions/runs/41158801068 terminó en verde; publicó el APK con SQLCipher. Descargado en `nai-mobile/build/ci-apk-current/app-debug.apk` (194,251,649 bytes). `apksigner verify` confirmó firma v2; `aapt` confirmó paquete `tech.naidevs.nai_mobile`, cámara, Internet y los atributos de backup/tráfico claro desactivados.
- Identidad Windows `Mi PC` creada una sola vez en `~/.nai/devices`; `device info` funciona. ACL de directorio y clave privada restringida al usuario `naide`. No se han concedido permisos de lectura a ningún par.
- `adb devices -l` no detectó Android; no se ha instalado el APK ni validado SQLCipher/mTLS en hardware. El build Gradle local no terminó y se canceló tras disponer del APK verificado por CI.
- Próximo paso físico: conectar Android por USB con depuración autorizada; instalar el APK descargado, abrirlo, escanear `pair invite --qr`, comparar el código de ocho dígitos y completar ACK. Después probar `transport serve --lan` + `ping` con datos sintéticos, y `--memory` solo tras autorizar un proyecto sintético. Mantener deshabilitada la descarga privada hasta validar cifrado y migración en el dispositivo.
- Prueba Android real (Samsung SM-S921U1, Android 16): el primer APK se instaló, pero la apertura quedó bloqueada en la fase `secure-delete`; el archivo de base tenía cabecera cifrada y `PRAGMA cipher_version` sí pasó. Se retiró esa llamada incompatible del driver; queda por confirmar con el siguiente APK que la pantalla principal abre y la base se reutiliza tras reinicio. Los APK debug de CI tienen firmas efímeras por ejecución: para mantener actualizaciones con datos preservados, firmar localmente cada artefacto con `~/.android/debug.keystore` antes de `adb install -r`. La instalación inicial de prueba no contenía memorias y se reemplazó una sola vez.

## Meta del proyecto
Crear un cliente Android Flutter offline-first para consumir, y mas adelante sincronizar de forma segura, memorias de Engram entre una PC Windows, una laptop y un telefono Android, sin depender de Engram Cloud. El usuario utiliza Claude Code y Codex, y el repositorio `NaiDevs/agent-ai-config` ya contiene configuraciones y otros componentes de Nai. Las memorias son datos privados: **no subir bases Engram, snapshots, tokens, claves privadas ni secretos a GitHub**.

## Punto de partida verificado (2026-10-30, Honduras)
- Rama de trabajo: `master`; el usuario prefiere commits directos a master, sin pull requests, a menos que pida lo contrario.
- CI Flutter: ejecucion GitHub Actions #4 **SUCCESS**, https://github.com/NaiDevs/agent-ai-config/actions/runs/41155332195 ; commit `8ca00af1302016a898d5e790cddb431512ad0e95`. Pasa generacion Android, `flutter pub get`, `flutter analyze --no-fatal-infos`, `flutter test` y compilacion APK debug.
- Correcciones recientes: `file_picker ^13.3.0` para compatibilidad con `flutter_secure_storage ^11.2.0`, nueva API `FilePicker.pickFile`, reparacion del stream TLS y un test Flutter real.
- La ejecucion exitosa NO publico artefacto APK descargable (la pantalla muestra Artifacts: -), ni demuestra conexion real Windows/Android.
- El usuario YA ESTA en su PC Windows y quiere continuar implementacion/prueba real, con su telefono Android disponible. No asumir que SDK, OpenSSL, ADB o Engram CLI estan correctamente instalados; verificarlos.

## Donde esta el codigo
- `nai-mobile/`: app Flutter Android. `lib/main.dart` (lista, filtro e importacion JSON local), `lib/memory_store.dart` (SQLite v2 con clave por origen), `lib/pairing_scanner.dart`, `lib/pairing_reply_page.dart`, `lib/mobile_identity_storage.dart`, `lib/nai_tls_client.dart`, `lib/nai_sync_client.dart`, `lib/sync_connection_page.dart`, `lib/snapshot_digest.dart`.
- `nai-bridge/`: servicio CLI Node 22+ que inspecciona/exporta Engram local por proyecto, mantiene snapshots fuera del repositorio, crea pares Ed25519 y expone transporte TLS 1.3 limitado a host local o LAN autorizada. `src/cli.mjs`, `src/engram.mjs`, `src/snapshot.mjs`, `src/device-commands.mjs`, `src/pair-session.mjs`, `src/transport-commands.mjs`, `src/secure-transport.mjs`, `src/snapshot-wire.mjs`.
- `packages/nai-sync-protocol/`: modelo de revisiones/conflictos.
- `.github/workflows/nai-mobile.yml`: CI Flutter.
- `nai-mobile/README.md` y `docs/nai-mobile-first-implementation.md`: antecedentes (ALERT: algunos parrafos historicos dicen que el CI o TLS no existen; contrastar con el codigo actual).

## Funcionamiento actual y limitaciones
1. Android permite explorar memorias SQLite e importar un JSON manualmente. El almacenamiento SQLite contiene texto en claro: NO se deben importar memorias privadas reales sin resolver cifrado local.
2. El emparejamiento usa invitaciones y respuestas firmadas Ed25519, ACK y comparacion humana de codigo de ocho digitos. Hoy en la PC `pair invite` produce un token textual y no hay una pantalla nativa que muestre el QR. Android muestra QR de respuesta y boton para copiar token.
3. La pantalla `sync_connection_page.dart` tiene diagnostico TLS (ping / manifest). **No llama a `NaiSyncClient.pullProject()`**; aun no hay boton seguro para descarga real.
4. `NaiSyncClient.pullProject()` YA implementa paginacion, digest v2, y envio a importacion por transaccion en `MemoryStore` con aislamiento `(source,id)`; no reinventar esas piezas sin revisar pruebas de regresion.
5. El transporte Node ya exige par aprobado, permisos por proyecto (`memory.read`), TLS 1.3 y `--memory` explicito para publicar manifiestos/paginas.
6. No existe sincronizacion bidireccional completa, descubrimiento por Bluetooth/Wi-Fi ni importacion a base Engram nativa. No habilitar automaticamente agentes remotos ni ejecucion de comandos.

## Incidencia concreta detectada para inspeccionar
En `nai-bridge/src/transport-commands.mjs` el caso `action === 'pull'` aparece anidado dentro del bloque de errores de `action === 'serve'`, por lo que aparentemente es inalcanzable. Inspeccionar, corregir el dispatch y agregar pruebas CLI que ejerzan `transport pull`, `transport serve --lan --memory`, argumentos incorrectos y permisos. No confiar solo en tests del helper `pullSecure`.

## Ruta propuesta: ejecutar en pasos cortos, probados
### Fase A - Preparar Windows y entregar APK
- `git pull origin master`; comprobar `node --version` (>=22), `engram --version`, `flutter doctor -v`, `openssl version`, `adb devices`. No modificar configuracion de PC sin necesidad.
- Ejecutar `cd nai-bridge; npm test; node src/cli.mjs doctor`, y luego `cd ../nai-mobile; flutter pub get; flutter analyze --no-fatal-infos; flutter test; flutter build apk --debug`.
- Instalar APK en Android fisico via `flutter run` o `adb install -r build/app/outputs/flutter-apk/app-debug.apk` cuando ADB lo reconozca. No afirmar que hay APK en GitHub: CI actual no publica artifacts.
- Mejorar CI para subir el APK debug como **artefacto de la ejecucion** (`actions/upload-artifact`, retencion corta), sin secrets dentro del APK. Verificar nuevamente CI verde y artefacto presente.

### Fase B - Emparejamiento Windows-Android y TLS de prueba
- Verificar que Engram exporta el proyecto solicitado; `node src/cli.mjs inspect --project "PROYECTO"` y `snapshot --project "PROYECTO"` solo en el PC de confianza. Empezar con un proyecto sintetico, no privado.
- Crear identidad PC una sola vez: `node src/cli.mjs device init "Mi PC"` (no re-inicializar si ya existe).
- Completar UX de QR de invitacion de PC; token firmado y respuesta Android. Confirmar codigo humano y ACK firmado en ambos extremos. Evitar mostrar claves privadas.
- Ejecutar servidor LAN **solo tras emparejamiento y revisar firewall/red privada**: `node src/cli.mjs transport serve --lan --port 4392`; validar ping autentico desde Android. Para test de manifest, habilitar temporalmente `--memory` y otorgar `device grant-read "device:ID_ANDROID" "PROYECTO"`.
- Probar handshake mTLS real en Windows + Android, pinning de SPKI, rechazo de certificado distinto, dispositivo revocado, timeout y permiso por proyecto. Revisar el caso `onBadCertificate` de `nai_tls_client.dart` y la construccion X509.

### Fase C - Descarga a Android segura
- Antes de habilitar una importacion de datos reales, implementar almacenamiento cifrado en reposo para SQLite, con clave protegida por Android Keystore, migracion segura y pruebas de restauracion. Investigar driver soportado y backup. No usar base SQLite plaintext para memorias privadas.
- Con datos sintéticos, conectar `NaiSyncClient.pullProject()` a UI con progreso, cancelacion/errores, permisos y logging sin contenidos de memoria. Conservar verificacion de digest v2 y transacciones/aislamiento por peer. Preparar pruebas de corrupcion/paginas faltantes/concurrencia/revocacion.
- Solo entonces hacer prueba controlada con Engram real por proyecto. No modificar BD nativa de Engram y no habilitar escritura remota ni conflicto bidireccional hasta disenarlo por separado.

## Comandos de referencia (desde raiz)
```powershell
git pull origin master
node --version
engram --version
flutter doctor -v
openssl version
adb devices
cd nai-bridge
npm test
node src/cli.mjs doctor
node src/cli.mjs inspect --project "NOMBRE_DEL_PROYECTO"
# node src/cli.mjs snapshot --project "NOMBRE_DEL_PROYECTO"
cd ../nai-mobile
flutter create --platforms=android --project-name=nai_mobile --org=tech.naidevs .
flutter pub get
flutter analyze --no-fatal-infos
flutter test
flutter build apk --debug
```

## Criterios de terminado para la proxima entrega
- CI verde, APK disponible para instalar, y pruebas locales en PC donde sea posible.
- Prueba de emparejamiento y diagnostico TLS Android/Windows con datos de prueba; documentar tanto resultados como limitaciones de hardware o SDK.
- Sin secretos/PII en commits, logs, artifacts ni informacion mostrada al usuario.
- No activar descarga real de memorias privadas a SQLite sin cifrado en reposo.
- Actualizar README y este handoff con decisiones, comandos probados y trabajo restante.
- Seguir trabajando de manera autonoma en la siguiente tarea verificable; al finalizar cada incremento, crear commits claros directamente en `master` (no force push), informar hashes, CI y el siguiente paso. Si la rama remota avanzo, reconciliar antes de publicar.

## Mensaje para el agente
Lee primero este archivo y el codigo; evita repetir el analisis desde cero. **Actua**: prepara entorno, reproduce pruebas, corrige problemas comprobados, publica APK de CI, valida conectividad y avanza de forma segura. Pide intervencion humana solo para acciones fisicas inevitables (USB, permisos del celular, escanear QR, confirmacion de codigo o acceso a datos reales). No afirmar que algo funciona end-to-end sin pruebas reales.
