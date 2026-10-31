import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'mobile_client_certificate.dart';
import 'pairing_crypto.dart';

class NaiTlsClient {
  final MobileIdentity identity;
  final String pinnedServerSpki;
  final String host;
  final int port;
  const NaiTlsClient({required this.identity,required this.pinnedServerSpki,
    required this.host,this.port=4392});

  Future<String> get peerId async {
    final bytes = base64Url.decode(base64Url.normalize(pinnedServerSpki));
    final hash = await Sha256().hash(bytes);
    return 'device:' + hash.bytes.map((n) => n.toRadixString(16).padLeft(2, '0')).join();
  }
  Future<Map<String,dynamic>> request(Map<String,Object?> payload) async {
    if (host.isEmpty || host.contains(RegExp(r'[\s/]')) || port<1 || port>65535) {
      throw const FormatException('Direccion del bridge invalida.');
    }
    final expected='device:' + (await Sha256().hash(
      base64Url.decode(base64Url.normalize(pinnedServerSpki)))).bytes
        .map((n)=>n.toRadixString(16).padLeft(2,'0')).join();
    final cert=await MobileClientCertificate.fromIdentity(identity);
    var verified=false;
    final socket=await SecureSocket.connect(host,port,context:cert.makeContext(),
      timeout:const Duration(seconds:8),
      onBadCertificate:(server) {
        try {
          // Pin the server public key after both devices verified pairing ACK.
          final got=certificateSpki(server);
          verified=(got==pinnedServerSpki && expected.startsWith('device:'));
          return verified;
        }catch(_){return false;}
      });
    try {
      // Even if a trust root is present, never send a request without the pin.
      if(!verified) throw const HandshakeException('No se verifico el certificado de Nai Bridge.');
      final nonce=List<int>.generate(16,(_)=>Random.secure().nextInt(256))
          .map((v)=>v.toRadixString(16).padLeft(2,'0')).join();
      final wire=jsonEncode({'version':1,...payload,'nonce':nonce});
      if(utf8.encode(wire).length>4095) throw const FormatException('Peticion demasiado grande.');
      socket.write('$wire\n');
      final raw=await socket
        .transform(utf8.decoder)
        .transform(const LineSplitter())
        .first.timeout(const Duration(seconds:8));
      if(utf8.encode(raw).length>196608) throw const FormatException('Respuesta demasiado grande.');
      final data=jsonDecode(raw);
      if(data is! Map<String,dynamic> || data['version']!=1 ||
         data['ok']!=true || data['nonce']!=nonce ||
         data['deviceId']!=expected) {
        throw const FormatException('Respuesta TLS no autenticada.');
      }
      return data;
    }finally{socket.destroy();}
  }
}
