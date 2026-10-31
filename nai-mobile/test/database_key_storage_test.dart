import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/database_key_storage.dart';

void main() {
  test('crea clave de 256 bits y la reutiliza', () async {
    String? saved;
    final keys = DatabaseKeyStorage(
      read: () async => saved,
      write: (value) async { saved = value; },
    );
    final first = await keys.getOrCreate(databaseExists: false);
    expect(base64Url.decode(base64Url.normalize(first)), hasLength(32));
    expect(await keys.getOrCreate(databaseExists: true), first);
  });

  test('no reemplaza clave perdida de una base existente', () async {
    final keys = DatabaseKeyStorage(
      read: () async => null,
      write: (_) async { fail('No debe generar otra clave'); },
    );
    await expectLater(keys.getOrCreate(databaseExists: true), throwsStateError);
  });

  test('rechaza clave corrupta y fallo de persistencia', () async {
    final corrupt = DatabaseKeyStorage(
      read: () async => 'no-es-clave',
      write: (_) async { fail('No debe sobrescribir'); },
    );
    await expectLater(corrupt.getOrCreate(databaseExists: false), throwsStateError);
    final failedWrite = DatabaseKeyStorage(
      read: () async => null,
      write: (_) async {},
    );
    await expectLater(failedWrite.getOrCreate(databaseExists: false), throwsStateError);
  });
}
