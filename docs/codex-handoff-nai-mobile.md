# Handoff a Codex - Nai Mobile / Nai Bridge

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
