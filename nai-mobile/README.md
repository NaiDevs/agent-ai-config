# Nai Mobile

Cliente Flutter Android offline-first de Nai Bridge.

La app permite explorar memorias locales, importar snapshots JSON de prueba, completar el emparejamiento firmado por QR y diagnosticar TLS con `ping` y manifiesto. La base nueva usa SQLCipher con una clave de 256 bits protegida por Android Keystore. Si existe la base anterior en texto claro, la app conserva los datos y bloquea la apertura hasta implementar una migración verificada. La descarga automática todavía no está conectada a la pantalla: usar únicamente datos sintéticos hasta probar el cifrado y el enlace con un Android real.

Para inicializar Android, dentro del directorio `nai-mobile`:

```powershell
flutter create --platforms=android --project-name=nai_mobile --org=tech.naidevs .
flutter pub get
flutter analyze
flutter test
flutter run
```

No importar memorias reales sensibles sin cifrado local y verificación criptográfica del origen.

## Iteración Android — Escáner de invitación QR

La pantalla Android ya permite abrir la cámara, detectar un QR de tipo
`nai-pair-v1:...`, inspeccionar formato, nombre, expiración e identificador
público, y rechazar códigos ajenos. Incluye cinco casos de prueba del parser.

**NO se verifica todavía la firma Ed25519 en Android, no se generan
respuestas firmadas ni se establece una conexión TLS con Nai Bridge.**
Tampoco existe todavía un código QR generado visualmente desde el CLI
de Windows: su invitación puede verse como texto mediante `pair invite`,
pero la prueba integral con cámara necesita incorporar una pantalla QR en PC.
No autorizar memorias ni confiar en la invitación hasta verificar firmas.

Dependencies Flutter añadidas para el trabajo posterior (cryptography y
flutter_secure_storage); esta iteración del escáner no guarda todavía claves
privadas ni ejecuta operaciones criptográficas. Flutter SDK no está instalado
en el entorno de construcción actual: `flutter pub get`, `flutter analyze`,
`flutter test` y `flutter run` siguen pendientes en un equipo con Flutter.


## Iteración — Firma real de emparejamiento en Android

Se añadieron `lib/pairing_crypto.dart`, `lib/mobile_identity_storage.dart`
y `lib/pairing_reply_page.dart`.

- Identidad persistente Ed25519 basada en una semilla de 32 bytes guardada
  con `flutter_secure_storage`; nunca se imprime ni se incluye en los QR.
- Validación criptográfica de la invitación de Nai Bridge con Ed25519,
  certificado SPKI (DER) y correspondencia del ID de dispositivo.
- Generación de una respuesta firmada `nai-pair-v1` y código humano de
  ocho dígitos compatible con el protocolo Node.
- QR de respuesta para mostrar a la PC y verificación de un ACK firmado
  antes de guardar la identidad del servidor.
- Test con vectores deterministas derivados de la implementación Node.

**No se han ejecutado pruebas Flutter, Dart ni APK en este entorno.** Ejecutar
`flutter pub get`, `flutter analyze` y `flutter test` en Windows y revisar
la interoperabilidad del vector de firma antes de validar la fase.
Se requiere escaneo de la respuesta desde PC o copiar el token al CLI, y
copiar la confirmación de vuelta a Android.

**Límites vigentes:** el sistema todavía no realiza TLS mutuo desde Android,
ni descarga memorias por red. Guardar la identidad del servidor tras verificar
ACK no equivale a autorizar sincronización. El almacenamiento seguro Android
depende de las protecciones reales del equipo; no garantiza una clave no
exportable por hardware.


## Iteración TLS Android — implementación experimental

Se añadieron `mobile_client_certificate.dart` (certificado X509 Ed25519 local asociado a la clave de emparejamiento y lectura de SPKI), `nai_tls_client.dart` (cliente TLS 1.3 con pinning estricto del certificado del servidor, nonce de solicitud y validación de respuesta) y `nai_sync_client.dart` (estructura de descarga `manifest`/`page`).

**Bloqueo explícito:** `NaiSyncClient.pullProject()` no escribe memorias en SQLite y falla cerrado hasta implementar y comprobar un hash canónico de snapshots idéntico entre Dart y Node. El cliente TLS tampoco está conectado todavía a un botón de la UI. La generación X509 y el handshake deben verificarse en Flutter y en Android real antes de confiar en ellos; no hay Flutter/Dart SDK en el entorno actual. No afirmar que Android–PC sincroniza todavía.

**Siguiente:** instalar Flutter, ejecutar análisis y pruebas; comprobar certificado Ed25519 con OpenSSL y Node; definir representación canónica y digest SHA-256 interoperables, añadir casos de prueba contra cambios de orden y campos; completar descarga atómica en SQLite por peer/proyecto, permisos y UI.


## Integridad compartida v2 y caché multi-origen

El backend Nai Bridge publica manifiestos y páginas con `digestVersion: 2`.
El hash SHA-256 usa texto ASCII `NAI-SNAPSHOT-V2\n`, orden ordinal
por `id`, seis campos en Base64url sin padding (NULL como `~`) y
un indicador de borrado. `snapshot_digest.dart` genera la misma
representación. Se incluyen vectores de prueba idénticos en Node y Dart.

`NaiSyncClient.pullProject()` ahora valida la versión del manifiesto y
cada página, comprueba el digest completo antes de convertir registros
a snapshot y envía la importación a SQLite mediante una transacción.
La base migra de la versión 1 a la versión 2 y utiliza una clave
compuesta `(source,id)`: dos PCs que tengan la misma ID de Engram no
se sobrescriben. El origen local anterior se preserva como `local`.

La descarga aún **no está conectada a la UI**, y el handshake TLS Android
no se ha validado físicamente. SQLite no está cifrado por la aplicación:
NO usar memorias privadas hasta contar con almacenamiento cifrado y
pruebas Android–Windows. No existe importación a Engram nativo.

Validación: vector SHA-256 calculado con Node 22, tests Node y Dart
publicados pero suite completa sin ejecutar aquí; Flutter SDK ausente.


## Diagnóstico TLS desde la app y CI

La pantalla `lib/sync_connection_page.dart`, accesible desde el ícono de dispositivos en la barra superior, recupera únicamente el host cuyo ACK fue validado en el emparejamiento. Permite indicar IP local, puerto TLS y nombre de proyecto, hacer `ping` autenticado o consultar el manifiesto (cantidad de memorias). NO ejecuta `pullProject` ni escribe memorias, porque SQLite todavía no tiene cifrado de aplicación propio y la conexión Android-Windows aún no pasó pruebas de hardware.

GitHub Actions `.github/workflows/nai-mobile.yml` intenta generar los archivos nativos con `flutter create`, resolver dependencias, ejecutar `flutter analyze`, `flutter test` y compilar APK debug. La creación del workflow no implica que haya pasado el CI. Consultar los resultados antes de instalar o habilitar funciones sensibles. Para probar contra PC: emparejar y verificar ACK en ambos dispositivos, autorizar proyecto desde Nai Bridge y activar `transport serve --lan --memory`; con datos sintéticos, consultar primero `ping` y luego manifiesto.
