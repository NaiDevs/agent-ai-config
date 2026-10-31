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