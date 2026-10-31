import 'dart:convert';
import 'memory.dart';
import 'snapshot_digest.dart';
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
    if(manifest['project']!=project || manifest['digestVersion']!=2 || count is! int || count<0 ||
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
         page['total']!=count || page['digestVersion']!=2 || page['offset']!=offset ||
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
    final hash = await snapshotDigestV2(records);
    if (hash != etag) throw const FormatException('Hash de snapshot no coincide.');
    final snapshotJson = jsonEncode({
      'version': 1, 'proyecto': project, 'memorias': records,
    });
    final snapshot = Snapshot.parse(utf8.encode(snapshotJson));
    return store.importSnapshot(snapshot, source: transport.peerId);
  }
}
