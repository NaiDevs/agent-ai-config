# Nai Mobile

Cliente Flutter Android offline-first de Nai Bridge.

MVP inicial: proyectos, búsqueda de memorias, almacenamiento SQLite e importación manual de snapshots JSON de prueba. La autenticación mTLS, QR y sincronización automática son trabajo pendiente.

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
