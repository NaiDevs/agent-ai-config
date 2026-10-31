import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'pairing_crypto.dart';

const _frameLimit = 192 * 1024;
const _timeout = Duration(seconds: 8);

String _hex(List<int> bytes) => bytes.map((n) => n.toRadixString(16).padLeft(2, '0')).join();

class _FrameReader {
  final StreamIterator<List<int>> _chunks;
  List<int> _pending = [];
  _FrameReader(SecureSocket socket) : _chunks = StreamIterator<List<int>>(socket);

  Future<String> next() async {
    while (true) {
      final end = _pending.indexOf(10);
      if (end >= 0) {
        if (end > _frameLimit) throw const FormatException('Respuesta demasiado grande.');
        final frame = utf8.decode(_pending.sublist(0, end));
        _pending = _pending.sublist(end + 1);
        return frame;
      }
      if (_pending.length > _frameLimit) throw const FormatException('Respuesta demasiado grande.');
      if (!await _chunks.moveNext().timeout(_timeout)) {
        throw const SocketException('Conexion TLS cerrada.');
      }
      _pending.addAll(_chunks.current);
    }
  }

  Future<void> close() => _chunks.cancel();
}

class NaiTlsClient {
  final MobileIdentity identity;
  final String pinnedServerSpki;
  final String host;
  final int port;
  const NaiTlsClient({required this.identity, required this.pinnedServerSpki,
    required this.host, this.port = 4393});

  Future<String> get peerId async {
    final bytes = base64Url.decode(base64Url.normalize(pinnedServerSpki));
    final hash = await Sha256().hash(bytes);
    return 'device:${_hex(hash.bytes)}';
  }

  Future<Map<String, dynamic>> request(Map<String, Object?> payload) async {
    if (host.isEmpty || host.contains(RegExp(r'[\s/]')) || port < 1 || port > 65535) {
      throw const FormatException('Direccion del bridge invalida.');
    }
    final operation = payload['op'];
    if (operation is! String || !['ping', 'manifest', 'page'].contains(operation)) {
      throw const FormatException('Operacion TLS invalida.');
    }
    final expected = await peerId;
    final context = SecurityContext(withTrustedRoots: false)
      ..minimumTlsProtocolVersion = TlsProtocolVersion.tls1_3;
    final socket = await SecureSocket.connect(host, port, context: context,
      timeout: _timeout, onBadCertificate: (_) => true);
    final frames = _FrameReader(socket);
    try {
      final certificate = socket.peerCertificate;
      if (certificate == null) throw const HandshakeException('Certificado TLS ausente.');
      final certHash = _hex((await Sha256().hash(certificate.der)).bytes);
      final clientNonce = _hex(List<int>.generate(16, (_) => Random.secure().nextInt(256)));
      socket.write('${jsonEncode({'version': 2, 'kind': 'hello', 'clientNonce': clientNonce})}\n');
      await socket.flush();
      final proof = jsonDecode(await frames.next());
      if (proof is! Map<String, dynamic> || proof['version'] != 2 ||
          proof['kind'] != 'server-proof' || proof['serverId'] != expected ||
          proof['clientNonce'] != clientNonce || proof['certHash'] != certHash ||
          proof['serverNonce'] is! String ||
          !RegExp(r'^[a-f0-9]{32}$').hasMatch(proof['serverNonce'] as String) ||
          proof['signature'] is! String) {
        throw const FormatException('Prueba de servidor TLS invalida.');
      }
      final serverNonce = proof['serverNonce'] as String;
      await PairingCrypto().verifyTransportSignature(pinnedServerSpki,
        proof['signature'] as String, 'server-proof',
        [expected, clientNonce, serverNonce, certHash]);
      final fields = <Object?>[identity.deviceId, expected, clientNonce,
        serverNonce, certHash, operation, payload['project'], payload['etag'], payload['offset']];
      final request = <String, Object?>{
        'version': 2, 'kind': 'request', 'clientId': identity.deviceId,
        'clientNonce': clientNonce, 'serverNonce': serverNonce,
        'certHash': certHash, ...payload,
        'signature': await PairingCrypto().signTransportRequest(identity, fields),
      };
      final wire = jsonEncode(request);
      if (utf8.encode(wire).length > 4095) throw const FormatException('Peticion demasiado grande.');
      socket.write('$wire\n');
      await socket.flush();
      final data = jsonDecode(await frames.next());
      if (data is! Map<String, dynamic> || data['version'] != 2 || data['ok'] != true ||
          data['nonce'] != clientNonce || data['deviceId'] != expected) {
        throw const FormatException('Respuesta TLS no autenticada.');
      }
      return data;
    } finally {
      socket.destroy();
      await frames.close();
    }
  }
}
