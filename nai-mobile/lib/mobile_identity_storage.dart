import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'pairing_crypto.dart';

class MobileIdentityStorage {
  final FlutterSecureStorage storage;
  final PairingCrypto crypto;
  const MobileIdentityStorage(this.storage, this.crypto);
  static const key='nai.ed25519.seed.v1';
  static const nameKey='nai.device.name.v1';
  static const peerKey='nai.paired.host.v1';

  Future<MobileIdentity> getOrCreate({String name='Mi Android'}) async {
    var seed=await storage.read(key:key);
    if(seed==null){
      // No sobrescribir una identidad creada parcialmente.
      if(await storage.read(key:nameKey)!=null) {
        throw StateError('Identidad incompleta; requiere recuperacion manual.');
      }
      final bytes=await crypto.newSeed();
      seed=base64UrlEncode(bytes);
      await storage.write(key:key,value:seed);
      await storage.write(key:nameKey,value:name);
    }
    final savedName=await storage.read(key:nameKey);
    if(savedName==null) throw StateError('Identidad sin nombre; requiere recuperacion manual.');
    late List<int> bytes;
    try {bytes=base64Url.decode(base64Url.normalize(seed));}
    catch (_) {throw StateError('Identidad local corrupta.');}
    return crypto.identityFromSeed(savedName,bytes);
  }
  Future<void> saveVerifiedHost(String deviceId,String publicKey) async {
    final expected=await crypto.deviceIdFromPublic(publicKey);
    if(expected!=deviceId) throw const FormatException('Identidad remota inconsistente.');
    final existing=await storage.read(key:peerKey);
    if(existing!=null && existing!=jsonEncode({'deviceId':deviceId,'publicKey':publicKey})) {
      throw StateError('Existe otro dispositivo vinculado. Revocacion manual requerida.');
    }
    await storage.write(key:peerKey,value:jsonEncode({'deviceId':deviceId,'publicKey':publicKey}));
  }
}
