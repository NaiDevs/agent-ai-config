import 'dart:convert';

/// Transporte QR: valida forma y límites; NO autentica firmas Ed25519.
class PairingInvitation {
  final String deviceId, publicKey, name, nonce, signature;
  final int expiresAt;
  const PairingInvitation(this.deviceId, this.publicKey, this.name, this.nonce, this.signature, this.expiresAt);

  static PairingInvitation decode(String token, {DateTime? now}) {
    const prefix='nai-pair-v1:';
    if (!token.startsWith(prefix) || token.length > 8000) {
      throw const FormatException('Formato de invitación QR inválido.');
    }
    dynamic data;
    try {
      final payload=token.substring(prefix.length);
      data=jsonDecode(utf8.decode(base64Url.decode(base64Url.normalize(payload))));
    } catch (_) {
      throw const FormatException('El QR no contiene JSON válido.');
    }
    if (data is! Map<String,dynamic> || data['version']!=1 || data['kind']!='invite') {
      throw const FormatException('Versión de protocolo incompatible.');
    }
    final id=data['deviceId'], key=data['publicKey'], name=data['name'],
        nonce=data['nonce'], sig=data['signature'], exp=data['expiresAt'];
    if (id is! String || !RegExp(r'^device:[a-f0-9]{64}$').hasMatch(id) ||
        key is! String || key.length>220 || key.isEmpty ||
        name is! String || name.trim().isEmpty || name.length>60 ||
        nonce is! String || !RegExp(r'^[A-Za-z0-9_-]{43}$').hasMatch(nonce) ||
        sig is! String || !RegExp(r'^[A-Za-z0-9_-]{86}$').hasMatch(sig) ||
        exp is! int) {
      throw const FormatException('Campos de invitación inválidos.');
    }
    final current=(now??DateTime.now()).millisecondsSinceEpoch;
    if (exp<current || exp-current>180000) {
      throw const FormatException('La invitación está vencida o fuera de plazo.');
    }
    return PairingInvitation(id,key,name,nonce,sig,exp);
  }

  DateTime get expiry=>DateTime.fromMillisecondsSinceEpoch(expiresAt);
}
