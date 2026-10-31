import 'dart:convert';
import 'dart:typed_data';
import 'package:cryptography/cryptography.dart';
import 'pairing_invitation.dart';

// Node.js Ed25519 SPKI DER: 302a300506032b6570032100 + 32 bytes.
const _spkiPrefix = <int>[0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];
const _domain = 'nai-pair-v1';
const _tokenPrefix = 'nai-pair-v1:';

String _hex(List<int> bytes) => bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
String _b64(List<int> bytes) => base64UrlEncode(bytes).replaceAll('=', '');

Uint8List _decodeCanonical(String value, int size) {
  if (!RegExp(r'^[A-Za-z0-9_-]+$').hasMatch(value)) {
    throw const FormatException('Base64url invalido.');
  }
  late List<int> bytes;
  try {
    bytes = base64Url.decode(base64Url.normalize(value));
  } catch (_) {
    throw const FormatException('Base64url invalido.');
  }
  if (bytes.length != size || _b64(bytes) != value) {
    throw const FormatException('Longitud o representacion criptografica incorrecta.');
  }
  return Uint8List.fromList(bytes);
}

List<int> _rawPublicKey(String spki) {
  final der = _decodeCanonical(spki, 44);
  for (var i = 0; i < _spkiPrefix.length; i++) {
    if (der[i] != _spkiPrefix[i]) throw const FormatException('SPKI no es Ed25519.');
  }
  return der.sublist(_spkiPrefix.length);
}

class MobileIdentity {
  final String name;
  final String deviceId;
  final String publicKey;
  final SimpleKeyPair keyPair;
  const MobileIdentity({required this.name, required this.deviceId,
    required this.publicKey, required this.keyPair});
}

class PairResponse {
  final String token, code, digest, guestId;
  const PairResponse(this.token, this.code, this.digest, this.guestId);
}

class PairingCrypto {
  final Ed25519 _ed = Ed25519();
  final Sha256 _sha = Sha256();

  Future<String> _shaHex(List<Object?> elements) async {
    final hash = await _sha.hash(utf8.encode(jsonEncode([_domain, ...elements])));
    return _hex(hash.bytes);
  }

  Future<String> deviceIdFromPublic(String spki) async {
    _rawPublicKey(spki);
    final hash = await _sha.hash(_decodeCanonical(spki, 44));
    return 'device:' + _hex(hash.bytes);
  }

  Future<MobileIdentity> identityFromSeed(String name, List<int> seed) async {
    if (name.trim().isEmpty || name.length > 60 || seed.length != 32) {
      throw const FormatException('Identidad local invalida.');
    }
    final pair = await _ed.newKeyPairFromSeed(seed);
    final key = await pair.extractPublicKey();
    final spki = _b64([..._spkiPrefix, ...key.bytes]);
    return MobileIdentity(name: name.trim(), deviceId: await deviceIdFromPublic(spki),
      publicKey: spki, keyPair: pair);
  }

  Future<List<int>> newSeed() async {
    final pair = await _ed.newKeyPair();
    return pair.extractPrivateKeyBytes();
  }

  Future<void> verifyInvitation(PairingInvitation invitation) async {
    final expected = await deviceIdFromPublic(invitation.publicKey);
    if (expected != invitation.deviceId) {
      throw const FormatException('La clave publica no coincide con el ID de la PC.');
    }
    final message = utf8.encode(jsonEncode([
      _domain, 'invite', invitation.deviceId, invitation.publicKey,
      invitation.name, invitation.nonce, invitation.expiresAt,
    ]));
    final sig = Signature(_decodeCanonical(invitation.signature, 64),
      publicKey: SimplePublicKey(_rawPublicKey(invitation.publicKey),
        type: KeyPairType.ed25519));
    if (!await _ed.verify(message, signature: sig)) {
      throw const FormatException('Firma de invitacion Ed25519 invalida.');
    }
  }

  Future<String> invitationDigest(PairingInvitation invitation) => _shaHex([
    'invite', invitation.deviceId, invitation.publicKey, invitation.name,
    invitation.nonce, invitation.expiresAt, invitation.signature,
  ]);

  Future<PairResponse> respond(MobileIdentity identity, PairingInvitation invite,
      {DateTime? now}) async {
    final current = (now ?? DateTime.now()).millisecondsSinceEpoch;
    if (invite.expiresAt < current || invite.expiresAt - current > 180000) {
      throw const FormatException('Invitacion vencida.');
    }
    await verifyInvitation(invite);
    if (identity.deviceId == invite.deviceId) {
      throw const FormatException('No podes vincular el telefono consigo mismo.');
    }
    final digest = await invitationDigest(invite);
    final fields = [digest, identity.deviceId, identity.publicKey, identity.name];
    final sig = await _ed.sign(utf8.encode(jsonEncode([_domain, 'response', ...fields])),
      keyPair: identity.keyPair);
    final signature = _b64(sig.bytes);
    final response = <String, Object?>{
      'version': 1, 'kind': 'response', 'invitationDigest': digest,
      'deviceId': identity.deviceId, 'publicKey': identity.publicKey,
      'name': identity.name, 'signature': signature,
    };
    final hash = await _shaHex(['sas', digest, identity.deviceId, identity.publicKey, signature]);
    final shortValue = int.parse(hash.substring(0, 12), radix: 16) % 100000000;
    final code = shortValue.toString().padLeft(8, '0');
    return PairResponse(_tokenPrefix + _b64(utf8.encode(jsonEncode(response))),
      code, digest, identity.deviceId);
  }

  Future<void> verifyConfirmation(MobileIdentity identity, PairingInvitation invitation,
      PairResponse response, String ackToken, {DateTime? now}) async {
    final current = (now ?? DateTime.now()).millisecondsSinceEpoch;
    if (invitation.expiresAt < current) throw const FormatException('Invitacion expirada.');
    await verifyInvitation(invitation);
    if (!ackToken.startsWith(_tokenPrefix) || ackToken.length > 8000) {
      throw const FormatException('Confirmacion invalida.');
    }
    late dynamic ack;
    try {
      ack = jsonDecode(utf8.decode(base64Url.decode(
        base64Url.normalize(ackToken.substring(_tokenPrefix.length)))));
    } catch (_) {
      throw const FormatException('Confirmacion malformada.');
    }
    if (ack is! Map<String, dynamic> || ack['version'] != 1 || ack['kind'] != 'ack' ||
        ack['invitationDigest'] != response.digest ||
        ack['guestId'] != identity.deviceId || ack['guestId'] != response.guestId) {
      throw const FormatException('Confirmacion de otra invitacion o dispositivo.');
    }
    final message = utf8.encode(jsonEncode([
      _domain, 'ack', response.digest, identity.deviceId,
    ]));
    final sig = Signature(_decodeCanonical(ack['signature'] as String, 64),
      publicKey: SimplePublicKey(_rawPublicKey(invitation.publicKey),
        type: KeyPairType.ed25519));
    if (!await _ed.verify(message, signature: sig)) {
      throw const FormatException('Firma de confirmacion invalida.');
    }
  }
}
