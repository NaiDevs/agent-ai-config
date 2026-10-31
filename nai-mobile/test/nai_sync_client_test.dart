import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/memory.dart';
import 'package:nai_mobile/nai_sync_client.dart';
import 'package:nai_mobile/nai_tls_client.dart';
import 'package:nai_mobile/pairing_crypto.dart';
import 'package:nai_mobile/snapshot_digest.dart';

class FakeTransport extends NaiTlsClient {
  final Map<String, dynamic> manifest;
  final Map<String, dynamic> page;
  FakeTransport(MobileIdentity identity, this.manifest, this.page)
    : super(identity: identity, pinnedServerSpki: identity.publicKey, host: '127.0.0.1');

  @override Future<String> get peerId async => 'device:${'b' * 64}';
  @override Future<Map<String, dynamic>> request(Map<String, Object?> payload) async =>
    payload['op'] == 'manifest' ? manifest : page;
}

void main() {
  final record = <String, dynamic>{
    'id': 'engram:demo-1', 'proyectoId': 'demo', 'revisionId': 'v1',
    'revisionPadreId': null, 'origen': 'engram',
    'contenido': 'Dato sintético.', 'eliminada': false,
  };

  Future<(MobileIdentity, String)> fixture() async {
    final identity = await PairingCrypto().identityFromSeed('Test', List<int>.filled(32, 0x22));
    final etag = await snapshotDigestV2([record]);
    return (identity, etag);
  }

  test('importa solo snapshot completo y atribuye origen al peer', () async {
    final (identity, etag) = await fixture();
    final transport = FakeTransport(identity,
      {'project': 'demo', 'count': 1, 'digestVersion': 2, 'etag': etag},
      {'project': 'demo', 'etag': etag, 'total': 1, 'digestVersion': 2,
        'offset': 0, 'memories': [record], 'nextOffset': null});
    var calls = 0;
    Future<Map<String, int>> writer(Snapshot snapshot, {String source = 'local'}) async {
      calls++;
      expect(source, 'device:${'b' * 64}');
      expect(snapshot.items.single.content, 'Dato sintético.');
      return {'added': 1, 'updated': 0, 'unchanged': 0};
    }
    final result = await NaiSyncClient(transport, writer).pullProject('demo');
    expect(result['added'], 1);
    expect(calls, 1);
  });

  test('digest incorrecto nunca llama a la escritura local', () async {
    final (identity, _) = await fixture();
    final bad = '0' * 64;
    final transport = FakeTransport(identity,
      {'project': 'demo', 'count': 1, 'digestVersion': 2, 'etag': bad},
      {'project': 'demo', 'etag': bad, 'total': 1, 'digestVersion': 2,
        'offset': 0, 'memories': [record], 'nextOffset': null});
    var calls = 0;
    Future<Map<String, int>> writer(Snapshot snapshot, {String source = 'local'}) async {
      calls++;
      return {'added': 0, 'updated': 0, 'unchanged': 0};
    }
    await expectLater(NaiSyncClient(transport, writer).pullProject('demo'), throwsFormatException);
    expect(calls, 0);
  });

  test('página vacía antes de completar nunca escribe', () async {
    final (identity, etag) = await fixture();
    final transport = FakeTransport(identity,
      {'project': 'demo', 'count': 1, 'digestVersion': 2, 'etag': etag},
      {'project': 'demo', 'etag': etag, 'total': 1, 'digestVersion': 2,
        'offset': 0, 'memories': <Object>[], 'nextOffset': null});
    var calls = 0;
    Future<Map<String, int>> writer(Snapshot snapshot, {String source = 'local'}) async {
      calls++;
      return {'added': 0, 'updated': 0, 'unchanged': 0};
    }
    await expectLater(NaiSyncClient(transport, writer).pullProject('demo'), throwsFormatException);
    expect(calls, 0);
  });
}
