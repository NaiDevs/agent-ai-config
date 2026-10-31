import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/pairing_invitation.dart';

const now=1700000000000;
String token({int expiry=now+60000,String kind='invite',String name='PC'}) {
 final value={'version':1,'kind':kind,'deviceId':'device:${'a'*64}',
 'publicKey':'AQID','name':name,'nonce':List.filled(43,'A').join(),'signature':List.filled(86,'A').join(),'expiresAt':expiry};
 return 'nai-pair-v1:${base64UrlEncode(utf8.encode(jsonEncode(value))).replaceAll('=','')}';
}
void main(){
 test('admite invitación no vencida de formato válido',(){
  final invitation=PairingInvitation.decode(token(),now:DateTime.fromMillisecondsSinceEpoch(now));
  expect(invitation.name,'PC');
 });
 test('rechaza invitación vencida',()=>expect(
  ()=>PairingInvitation.decode(token(expiry:now-1),now:DateTime.fromMillisecondsSinceEpoch(now)),throwsFormatException));
 test('rechaza invitación demasiado lejana',()=>expect(
  ()=>PairingInvitation.decode(token(expiry:now+180001),now:DateTime.fromMillisecondsSinceEpoch(now)),throwsFormatException));
 test('rechaza otro tipo de paquete',()=>expect(
  ()=>PairingInvitation.decode(token(kind:'response'),now:DateTime.fromMillisecondsSinceEpoch(now)),throwsFormatException));
 test('rechaza QR no reconocido',()=>expect(
  ()=>PairingInvitation.decode('https://example.test/'),throwsFormatException));
}
