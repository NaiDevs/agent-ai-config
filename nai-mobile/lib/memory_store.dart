import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:path/path.dart' as p;
import 'package:sqflite_sqlcipher/sqflite.dart';
import 'database_key_storage.dart';
import 'memory.dart';

class MemoryStore {
  final Database db;
  MemoryStore(this.db);
  static Future<MemoryStore> open() async {
    var phase = 'path';
    try {
    final directory = await getDatabasesPath();
    final legacyPath = p.join(directory, 'nai-mobile.db');
    phase = 'legacy-check';
    if (await File(legacyPath).exists()) {
      throw StateError('Base anterior en texto claro detectada. Datos conservados; requiere migración segura.');
    }
    final path = p.join(directory, 'nai-mobile-encrypted.db');
    phase = 'key';
    final key = await DatabaseKeyStorage.onDevice()
      .getOrCreate(databaseExists: await File(path).exists());
    phase = 'open';
    final database = await openDatabase(path, password: key, version: 2, onUpgrade: (db, oldVersion, newVersion) async {
      if (oldVersion < 2) {
        await db.execute("ALTER TABLE memory RENAME TO memory_legacy");
        await db.execute("CREATE TABLE memory (source TEXT NOT NULL, id TEXT NOT NULL, project TEXT NOT NULL, revision TEXT NOT NULL, content TEXT NOT NULL, deleted INTEGER NOT NULL, PRIMARY KEY(source,id))");
        await db.execute("INSERT INTO memory(source,id,project,revision,content,deleted) SELECT 'local',id,project,revision,content,deleted FROM memory_legacy");
        await db.execute("DROP TABLE memory_legacy");
        await db.execute("CREATE INDEX idx_memory_project_source ON memory(project,source,deleted)");
      }
    }, onCreate: (db, _) async {
      await db.execute('CREATE TABLE memory (source TEXT NOT NULL, id TEXT NOT NULL, project TEXT NOT NULL, revision TEXT NOT NULL, content TEXT NOT NULL, deleted INTEGER NOT NULL, PRIMARY KEY(source,id))');
      await db.execute('CREATE INDEX idx_memory_project_source ON memory(project,source,deleted)');
    });
    phase = 'cipher-check';
    final cipher = await database.rawQuery('PRAGMA cipher_version');
    if (cipher.isEmpty || cipher.first.values.first is! String) {
      await database.close();
      throw StateError('SQLCipher no está disponible. La base no se usará.');
    }
    return MemoryStore(database);
    } catch (_) {
      debugPrint('Nai Mobile: apertura de base bloqueada en $phase');
      rethrow;
    }
  }
  Future<Map<String,int>> importSnapshot(Snapshot snapshot, {String source='local'}) => db.transaction((tx) async {
    if (source != 'local' && !(source.startsWith('device:') && source.length == 71)) {
      throw const FormatException('Origen invalido.');
    }
    var added=0, updated=0, unchanged=0;
    for (final item in snapshot.items) {
      final old=await tx.query('memory',where:'source=? AND id=?',whereArgs:[source,item.id],limit:1);
      if(old.isEmpty){
        await tx.insert('memory',{'source':source,...item.toSql()}); added++;
      } else {
        final row=old.single;
        if(row['project']!=item.project) throw const FormatException('Conflicto de proyecto.');
        if(row['revision']==item.revision){
          if(row['content']!=item.content || row['deleted']!=(item.deleted?1:0)) throw const FormatException('Conflicto de revision.');
          unchanged++;
        } else {
          await tx.update('memory',item.toSql(),where:'source=? AND id=?',whereArgs:[source,item.id]); updated++;
        }
      }
    }
    // Eliminar por ausencia está prohibido: solo tombstones explícitos.
    return {'added':added,'updated':updated,'unchanged':unchanged};
  });
  Future<List<String>> projects() async {
    final rows=await db.rawQuery('SELECT DISTINCT project FROM memory WHERE deleted=0 ORDER BY project');
    return rows.map((e)=>e['project'] as String).toList();
  }
  Future<List<MemoryItem>> search({String? project,String query=''}) async {
    final filters=<String>['deleted=0'];
    final args=<Object?>[];
    if(project!=null){filters.add('project=?');args.add(project);}
    if(query.isNotEmpty){
      final escaped=query.replaceAll('\\','\\\\').replaceAll('%','\\%').replaceAll('_','\\_');
      filters.add("content LIKE ? ESCAPE '\\'");
      args.add('%$escaped%');
    }
    final rows=await db.query('memory',where:filters.join(' AND '),whereArgs:args,orderBy:'project,id',limit:200);
    return rows.map(MemoryItem.fromSql).toList();
  }
}
