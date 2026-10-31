import 'package:path/path.dart' as p;
import 'package:sqflite/sqflite.dart';
import 'memory.dart';

class MemoryStore {
  final Database db;
  MemoryStore(this.db);
  static Future<MemoryStore> open() async {
    final path = p.join(await getDatabasesPath(), 'nai-mobile.db');
    final database = await openDatabase(path, version: 1, onCreate: (db, _) async {
      await db.execute('CREATE TABLE memory (id TEXT PRIMARY KEY, project TEXT NOT NULL, revision TEXT NOT NULL, content TEXT NOT NULL, deleted INTEGER NOT NULL)');
      await db.execute('CREATE INDEX idx_memory_project ON memory(project,deleted)');
    });
    return MemoryStore(database);
  }
  Future<Map<String,int>> importSnapshot(Snapshot snapshot) => db.transaction((tx) async {
    var added=0, updated=0, unchanged=0;
    for (final item in snapshot.items) {
      final old=await tx.query('memory',where:'id=?',whereArgs:[item.id],limit:1);
      if(old.isEmpty){
        await tx.insert('memory',item.toSql()); added++;
      } else {
        final row=old.single;
        if(row['project']!=item.project) throw const FormatException('Conflicto de proyecto.');
        if(row['revision']==item.revision){
          if(row['content']!=item.content || row['deleted']!=(item.deleted?1:0)) throw const FormatException('Conflicto de revision.');
          unchanged++;
        } else {
          await tx.update('memory',item.toSql(),where:'id=?',whereArgs:[item.id]); updated++;
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
