import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/pairing_crypto.dart';
import 'package:nai_mobile/pairing_invitation.dart';

void main() {
  final crypto=PairingCrypto();
  final invite={
    'version':1,'kind':'invite',
    'deviceId':'device:503d8ee46d581c649966569ae095e27041de83322e8e0480e5539e00d2d5d874',
    'publicKey':'MCowBQYDK2VwAyEA0EqyMnQrtKs6E2i9RhXk5tAiSrcaAWuvhSCjMsl3hzc',
    'name':'PC Demo','nonce':'AwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwM',
    'expiresAt':1800000000000,
    'signature':'UmodvwkfSHpIoeakHE4wUOgVzxDhRkG4zdkc8t4gCGiRyz0OLN7ViexLqZ0pSUOWXAbTF7wcscn7S9mrRDNHCw',
  };
  PairingInvitation invitation()=>PairingInvitation.decode(
    'nai-pair-v1:${base64UrlEncode(utf8.encode(jsonEncode(invite))).replaceAll('=','')}',
    now:DateTime.fromMillisecondsSinceEpoch(1800000000000-60000));
  test('firma invitación Node Ed25519 válida',() async {
    await crypto.verifyInvitation(invitation());
  });
  test('detecta invitación adulterada',() async {
    final modified={...invite,'name':'PC Falsa'};
    final token='nai-pair-v1:${base64UrlEncode(utf8.encode(jsonEncode(modified))).replaceAll('=','')}';
    final parsed=PairingInvitation.decode(token,now:DateTime.fromMillisecondsSinceEpoch(1800000000000-60000));
    await expectLater(crypto.verifyInvitation(parsed),throwsFormatException);
  });
  test('semilla Android genera ID igual que Node y código verificable',() async {
    final seed=List<int>.filled(32,0x22);
    final identity=await crypto.identityFromSeed('Android Demo',seed);
    expect(identity.deviceId,'device:744f36cca67eb1912cb282e08e86bd2fe0d09004a28cf6e7c6bd56cdd6bf65aa');
    final response=await crypto.respond(identity,invitation(),now:DateTime.fromMillisecondsSinceEpoch(1800000000000-60000));
    expect(response.code,'21456053');
    expect(response.digest,'a34234a70484ad5af29d186a0551617fe5b0c95f333b5f17c2d9d6386bb1ae0c');
  });
  test('firma de transporte liga nonces y certificado TLS', () async {
    final identity = await crypto.identityFromSeed('Android Demo', List<int>.filled(32, 0x22));
    final fields = <Object?>[identity.deviceId, identity.deviceId, 'a' * 32,
      'b' * 32, 'c' * 64, 'ping', null, null, null];
    final signature = await crypto.signTransportRequest(identity, fields);
    await crypto.verifyTransportSignature(identity.publicKey, signature, 'request', fields);
    final modified = [...fields];
    modified[4] = 'd' * 64;
    await expectLater(crypto.verifyTransportSignature(identity.publicKey, signature,
      'request', modified), throwsFormatException);
  });
}
