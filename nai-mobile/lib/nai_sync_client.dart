import 'dart:convert';
import 'package:cryptography/cryptography.dart';
import 'memory.dart';
import 'memory_store.dart';
import 'nai_tls_client.dart';

class NaiSyncClient {
  final NaiTlsClient transport;
  final MemoryStore store;
  const NaiSyncClient(this.transport,this.store);

  Future<Map<String,int>> pullProject(String project) async {
    if(project.trim().isEmpty || project.length>160) {
      throw const FormatException('Proyecto invalido.');
    }
    final manifest=await transport.request({'op':'manifest','project':project});
    final count=manifest['count'], etag=manifest['etag'];
    if(manifest['project']!=project || count is! int || count<0 ||
       count>50000 || etag is! String || !RegExp(r'^[a-f0-9]{64}$').hasMatch(etag)) {
      throw const FormatException('Manifiesto invalido.');
    }
    final records=<Map<String,dynamic>>[];
    var offset=0;
    while(offset<count) {
      final page=await transport.request({
        'op':'page','project':project,'etag':etag,'offset':offset});
      final batch=page['memories'];
      if(page['project']!=project || page['etag']!=etag ||
         page['total']!=count || page['offset']!=offset ||
         batch is! List || batch.isEmpty || batch.length>24) {
        throw const FormatException('Pagina invalida.');
      }
      for(final entry in batch) {
        if(entry is! Map<String,dynamic>) throw const FormatException('Memoria invalida.');
        records.add(entry);
      }
      offset+=batch.length;
      if(page['nextOffset']!=(offset==count?null:offset)) {
        throw const FormatException('Cursor de sincronizacion invalido.');
      }
    }
    // Node snapshotDigest uses JSON.stringify on sorted memory objects. Dart's
    // jsonEncode preserves insertion order but not guaranteed byte compatibility.
    // Until canonical JSON is standardized across both platforms, this client
    // must not write downloaded data into SQLite. Fail closed.
    throw const UnsupportedError(
      'Importacion TLS bloqueada hasta implementar SHA-256 canonico interoperable.');
  }
}
