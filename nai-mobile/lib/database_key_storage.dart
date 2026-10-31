import 'dart:convert';
import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

typedef ReadDatabaseKey = Future<String?> Function();
typedef WriteDatabaseKey = Future<void> Function(String value);

class DatabaseKeyStorage {
  final ReadDatabaseKey read;
  final WriteDatabaseKey write;

  const DatabaseKeyStorage({required this.read, required this.write});

  factory DatabaseKeyStorage.onDevice() {
    const storage = FlutterSecureStorage();
    const name = 'nai-mobile-database-key-v1';
    return DatabaseKeyStorage(
      read: () => storage.read(key: name),
      write: (value) => storage.write(key: name, value: value),
    );
  }

  Future<String> getOrCreate({required bool databaseExists}) async {
    final existing = await read();
    if (existing != null) {
      if (!_valid(existing)) throw StateError('Clave local de base de datos inválida.');
      return existing;
    }
    if (databaseExists) {
      throw StateError('Falta la clave local. La base cifrada se conserva sin abrir.');
    }
    final random = Random.secure();
    final generated = base64UrlEncode(List<int>.generate(32, (_) => random.nextInt(256)));
    await write(generated);
    if (await read() != generated) {
      throw StateError('No se pudo confirmar la clave local.');
    }
    return generated;
  }

  bool _valid(String value) {
    try {
      final bytes = base64Url.decode(base64Url.normalize(value));
      return bytes.length == 32 && base64UrlEncode(bytes) == value;
    } catch (_) {
      return false;
    }
  }
}
