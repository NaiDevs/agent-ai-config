import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:sqflite_sqlcipher/sqflite.dart';

import 'database_key_storage.dart';
import 'memory_store.dart';

const _legacyName = 'nai-mobile.db';
const _encryptedName = 'nai-mobile-encrypted.db';
const _fields = ['source', 'id', 'project', 'revision', 'content', 'deleted'];

Future<int> migrateLegacyDatabase() async {
  final directory = await getDatabasesPath();
  final oldPath = p.join(directory, _legacyName);
  final encryptedPath = p.join(directory, _encryptedName);
  final artifacts = await _legacyArtifacts(directory);
  if (!artifacts.contains(_legacyName) &&
      artifacts.isNotEmpty &&
      artifacts.every(
        (name) => {
          '$_legacyName-wal',
          '$_legacyName-shm',
          '$_legacyName-journal',
        }.contains(name),
      )) {
    return _finishVerifiedCleanup(directory, encryptedPath, artifacts);
  }
  if (!artifacts.contains(_legacyName) ||
      artifacts.any(
        (name) => !{
          _legacyName,
          '$_legacyName-wal',
          '$_legacyName-shm',
          '$_legacyName-journal',
        }.contains(name),
      )) {
    throw StateError(
      'La base anterior está incompleta o tiene archivos desconocidos.',
    );
  }
  if (!await _isPlainSqlite(oldPath)) {
    throw StateError('La base anterior no tiene una cabecera SQLite válida.');
  }

  Database? old;
  Database? encrypted;
  var verified = false;
  var copied = 0;
  try {
    old = await openReadOnlyDatabase(oldPath);
    final version = Sqflite.firstIntValue(
      await old.rawQuery('PRAGMA user_version'),
    );
    if (version != 1 && version != 2) {
      throw StateError('Versión de base anterior no compatible.');
    }
    final legacyVersion = version!;
    final columns = await old.rawQuery('PRAGMA table_info(memory)');
    if (!_matchesLegacySchema(columns, legacyVersion)) {
      throw StateError('Esquema de base anterior no compatible.');
    }
    await _requireIntegrity(old);

    final exists = await File(encryptedPath).exists();
    final key = await DatabaseKeyStorage.onDevice().getOrCreate(
      databaseExists: exists,
    );
    var previousStatus = 'started';
    if (exists) {
      final existing = await openReadOnlyDatabase(encryptedPath, password: key);
      try {
        previousStatus = await _requireMigrationMarker(existing);
      } finally {
        await existing.close();
      }
    }
    encrypted = await openDatabase(
      encryptedPath,
      password: key,
      version: 2,
      onCreate: (db, _) async {
        await db.execute(
          'CREATE TABLE memory (source TEXT NOT NULL, id TEXT NOT NULL, project TEXT NOT NULL, revision TEXT NOT NULL, content TEXT NOT NULL, deleted INTEGER NOT NULL, PRIMARY KEY(source,id))',
        );
        await db.execute(
          'CREATE INDEX idx_memory_project_source ON memory(project,source,deleted)',
        );
        await db.execute(
          'CREATE TABLE legacy_migration_state (id INTEGER PRIMARY KEY, status TEXT NOT NULL)',
        );
        await db.insert('legacy_migration_state', {
          'id': 1,
          'status': 'started',
        });
      },
    );
    final cipher = await encrypted.rawQuery('PRAGMA cipher_version');
    if (cipher.isEmpty || cipher.first.values.first is! String) {
      throw StateError('SQLCipher no está disponible.');
    }
    await _requireMigrationMarker(encrypted);

    if (previousStatus == 'verified') {
      copied = Sqflite.firstIntValue(
        await old.rawQuery('SELECT COUNT(*) FROM memory'),
      )!;
    } else {
      await encrypted.transaction((tx) async {
        await tx.delete('memory');
        for (var offset = 0; ; offset += 200) {
          final rows = await _readRows(old!, legacyVersion, offset);
          if (rows.isEmpty) break;
          for (final row in rows) {
            _validateRow(row);
            await tx.insert('memory', row);
            copied++;
          }
        }
        await tx.update('legacy_migration_state', {
          'status': 'started',
        }, where: 'id = 1');
      });
    }

    final count = Sqflite.firstIntValue(
      await encrypted.rawQuery('SELECT COUNT(*) FROM memory'),
    );
    if (count != copied) throw StateError('El total cifrado no coincide.');
    for (var offset = 0; offset < copied; offset += 200) {
      final sourceRows = await _readRows(old, legacyVersion, offset);
      final targetRows = await encrypted.rawQuery(
        'SELECT source,id,project,revision,content,deleted FROM memory '
        'ORDER BY source,id LIMIT 200 OFFSET ?',
        [offset],
      );
      if (sourceRows.length != targetRows.length) {
        throw StateError('La verificación de la copia cifrada falló.');
      }
      for (var index = 0; index < sourceRows.length; index++) {
        for (final field in _fields) {
          if (sourceRows[index][field] != targetRows[index][field]) {
            throw StateError('La verificación de la copia cifrada falló.');
          }
        }
      }
    }
    await _requireIntegrity(encrypted);
    if (previousStatus != 'verified') {
      await encrypted.update('legacy_migration_state', {
        'status': 'verified',
      }, where: 'id = 1');
    }
    verified = true;
  } finally {
    await encrypted?.close();
    await old?.close();
  }

  if (!verified || await _isPlainSqlite(encryptedPath)) {
    throw StateError('No se confirmó el cifrado de la base nueva.');
  }
  for (final suffix in ['', '-wal', '-shm', '-journal']) {
    final file = File('$oldPath$suffix');
    if (await file.exists()) await file.delete();
  }
  if (await hasLegacyDatabaseArtifacts(directory)) {
    throw StateError(
      'Quedaron archivos antiguos; la apertura sigue bloqueada.',
    );
  }
  return copied;
}

Future<int> _finishVerifiedCleanup(
  String directory,
  String encryptedPath,
  Set<String> artifacts,
) async {
  if (!await File(encryptedPath).exists() ||
      await _isPlainSqlite(encryptedPath)) {
    throw StateError(
      'No hay copia cifrada verificada para recuperar la migración.',
    );
  }
  final key = await DatabaseKeyStorage.onDevice().getOrCreate(
    databaseExists: true,
  );
  final db = await openReadOnlyDatabase(encryptedPath, password: key);
  int count;
  try {
    final cipher = await db.rawQuery('PRAGMA cipher_version');
    if (cipher.isEmpty || cipher.first.values.first is! String) {
      throw StateError('SQLCipher no está disponible.');
    }
    await _requireIntegrity(db);
    final marker = await db.query(
      'legacy_migration_state',
      where: 'id = 1',
      limit: 1,
    );
    if (marker.length != 1 || marker.single['status'] != 'verified') {
      throw StateError('La migración no había sido verificada.');
    }
    count = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM memory'),
    )!;
  } finally {
    await db.close();
  }
  for (final name in artifacts) {
    await File(p.join(directory, name)).delete();
  }
  if (await hasLegacyDatabaseArtifacts(directory)) {
    throw StateError('Quedaron archivos antiguos.');
  }
  return count;
}

bool _matchesLegacySchema(List<Map<String, Object?>> columns, int version) {
  final expected = version == 1
      ? ['id', 'project', 'revision', 'content', 'deleted']
      : _fields;
  if (columns.length != expected.length) return false;
  for (var index = 0; index < expected.length; index++) {
    final column = columns[index];
    final name = expected[index];
    if (column['name'] != name ||
        column['type'] != (name == 'deleted' ? 'INTEGER' : 'TEXT') ||
        column['pk'] !=
            (version == 1 && name == 'id'
                ? 1
                : version == 2 && name == 'source'
                ? 1
                : version == 2 && name == 'id'
                ? 2
                : 0)) {
      return false;
    }
  }
  return true;
}

Future<String> _requireMigrationMarker(Database db) async {
  final marker = await db.query(
    'legacy_migration_state',
    where: 'id = 1',
    limit: 1,
  );
  if (marker.length != 1 ||
      !{'started', 'verified'}.contains(marker.single['status'])) {
    throw StateError(
      'La base cifrada existente no pertenece a esta migración.',
    );
  }
  return marker.single['status'] as String;
}

Future<Set<String>> _legacyArtifacts(String directory) async {
  final names = <String>{};
  await for (final entry in Directory(directory).list(followLinks: false)) {
    final name = p.basename(entry.path);
    if (name == _legacyName || name.startsWith('$_legacyName-')) {
      names.add(name);
    }
  }
  return names;
}

Future<bool> _isPlainSqlite(String path) async {
  final file = await File(path).open();
  try {
    final bytes = await file.read(16);
    return String.fromCharCodes(bytes) == 'SQLite format 3\u0000';
  } finally {
    await file.close();
  }
}

Future<void> _requireIntegrity(Database db) async {
  final result = await db.rawQuery('PRAGMA integrity_check');
  if (result.length != 1 || result.single.values.single != 'ok') {
    throw StateError('La comprobación de integridad SQLite falló.');
  }
}

Future<List<Map<String, Object?>>> _readRows(
  Database db,
  int version,
  int offset,
) async {
  final source = version == 1 ? "'local' AS source" : 'source';
  final order = version == 1 ? 'id' : 'source,id';
  return db.rawQuery(
    'SELECT $source,id,project,revision,content,deleted FROM memory '
    'ORDER BY $order LIMIT 200 OFFSET ?',
    [offset],
  );
}

void _validateRow(Map<String, Object?> row) {
  if (row['source'] is! String ||
      row['id'] is! String ||
      row['project'] is! String ||
      row['revision'] is! String ||
      row['content'] is! String ||
      row['deleted'] is! int ||
      !{0, 1}.contains(row['deleted'])) {
    throw StateError('Una memoria antigua tiene datos incompatibles.');
  }
}
