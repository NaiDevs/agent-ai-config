import 'dart:convert';
import 'package:cryptography/cryptography.dart';

String _field(String? value) => value == null ? '~' :
    base64UrlEncode(utf8.encode(value)).replaceAll('=', '');

/// Match Node snapshot-wire.mjs digestVersion 2.
String canonicalSnapshotV2(List<Map<String, dynamic>> records) {
  final sorted = [...records]..sort((a, b) =>
    (a['id'] as String).compareTo(b['id'] as String));
  final rows = <String>[];
  for (final r in sorted) {
    if (r['id'] is! String || r['proyectoId'] is! String ||
        r['revisionId'] is! String ||
        !(r['revisionPadreId'] == null || r['revisionPadreId'] is String) ||
        r['origen'] != 'engram' || r['contenido'] is! String ||
        r['eliminada'] is! bool) {
      throw const FormatException('Registro canonico invalido.');
    }
    rows.add([
      _field(r['id'] as String), _field(r['proyectoId'] as String),
      _field(r['revisionId'] as String), _field(r['revisionPadreId'] as String?),
      _field(r['origen'] as String), _field(r['contenido'] as String),
      r['eliminada'] == true ? '1' : '0',
    ].join('.'));
  }
  return 'NAI-SNAPSHOT-V2\n' + rows.join('\n') + '\n';
}
Future<String> snapshotDigestV2(List<Map<String, dynamic>> records) async {
  final hash = await Sha256().hash(utf8.encode(canonicalSnapshotV2(records)));
  return hash.bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
}
