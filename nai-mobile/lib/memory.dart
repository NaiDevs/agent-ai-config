import 'dart:convert';

class MemoryItem {
  final String id, project, revision, content;
  final bool deleted;
  const MemoryItem(this.id, this.project, this.revision, this.content, this.deleted);

  Map<String, Object?> toSql() => {
    'id': id, 'project': project, 'revision': revision,
    'content': content, 'deleted': deleted ? 1 : 0,
  };
  factory MemoryItem.fromSql(Map<String, Object?> row) => MemoryItem(
    row['id'] as String, row['project'] as String, row['revision'] as String,
    row['content'] as String, (row['deleted'] as int) != 0);
}

class Snapshot {
  final String project;
  final List<MemoryItem> items;
  const Snapshot(this.project, this.items);

  static Snapshot parse(List<int> input) {
    if (input.isEmpty || input.length > 32 * 1024 * 1024) {
      throw const FormatException('Tamano de archivo invalido.');
    }
    final dynamic data = jsonDecode(utf8.decode(input, allowMalformed: false));
    if (data is! Map<String, dynamic> || data['version'] != 1 ||
        data['proyecto'] is! String || data['memorias'] is! List) {
      throw const FormatException('No es un snapshot Nai Bridge v1.');
    }
    final project = data['proyecto'] as String;
    if (project.trim().isEmpty || project.length > 160 ||
        project.contains('\n') || project.contains('\u0000')) {
      throw const FormatException('Proyecto invalido.');
    }
    final raw = data['memorias'] as List;
    if (raw.length > 50000) throw const FormatException('Demasiadas memorias.');
    final seen = <String>{};
    final memories = <MemoryItem>[];
    for (final value in raw) {
      if (value is! Map<String, dynamic>) throw const FormatException('Memoria invalida.');
      final id = value['id'], rev = value['revisionId'];
      final body = value['contenido'], deleted = value['eliminada'];
      if (id is! String || !id.startsWith('engram:') || id.length > 250 ||
          !seen.add(id) || rev is! String || rev.isEmpty || rev.length > 160 ||
          body is! String || body.length > 1048576 || deleted is! bool ||
          value['origen'] != 'engram' || value['proyectoId'] != project ||
          (!deleted && body.trim().isEmpty)) {
        throw const FormatException('Memoria incompatible, duplicada o de otro proyecto.');
      }
      memories.add(MemoryItem(id, project, rev, body, deleted));
    }
    return Snapshot(project, List.unmodifiable(memories));
  }
}
