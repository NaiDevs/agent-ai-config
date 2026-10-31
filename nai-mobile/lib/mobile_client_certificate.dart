import 'dart:convert';
import 'dart:io';
import 'dart:math';
import 'package:cryptography/cryptography.dart';
import 'pairing_crypto.dart';

const _algorithm = <int>[0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70];
const _spkiPrefix = <int>[0x30, 0x2a, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x03, 0x21, 0x00];
const _privatePrefix = <int>[0x30, 0x2e, 0x02, 0x01, 0x00, 0x30, 0x05, 0x06, 0x03, 0x2b, 0x65, 0x70, 0x04, 0x22, 0x04, 0x20];

List<int> _length(int size) {
  if (size < 128) return [size];
  final bytes = <int>[];
  var value = size;
  while (value > 0) { bytes.insert(0, value & 255); value >>= 8; }
  return [0x80 | bytes.length, ...bytes];
}
List<int> _tlv(int tag, List<int> data) => [tag, ..._length(data.length), ...data];
List<int> _seq(List<int> bytes) => _tlv(0x30, bytes);
String _two(int v) => v.toString().padLeft(2, '0');
List<int> _time(DateTime d) {
  final x = d.toUtc();
  if (x.year < 2000 || x.year >= 2050) throw StateError('Fecha X509 invalida.');
  return _tlv(0x17, ascii.encode(_two(x.year % 100) + _two(x.month) + _two(x.day) +
      _two(x.hour) + _two(x.minute) + _two(x.second) + 'Z'));
}
List<int> _cn(String value) => _seq(_tlv(0x31,
    _seq([0x06, 0x03, 0x55, 0x04, 0x03, ..._tlv(0x0c, utf8.encode(value))])));
String _pem(String label, List<int> bytes) {
  final b64 = base64.encode(bytes);
  final lines = <String>[];
  for (var i = 0; i < b64.length; i += 64) {
    lines.add(b64.substring(i, i + 64 > b64.length ? b64.length : i + 64));
  }
  return '-----BEGIN ' + label + '-----\n' + lines.join('\n') +
      '\n-----END ' + label + '-----\n';
}

/// Ephemeral self-signed X509 Ed25519 certificate from the paired identity.
/// Identity is authenticated by *pinned SPKI*, not the self-signed CA.
class MobileClientCertificate {
  final List<int> der;
  final String certificatePem, privateKeyPem;
  const MobileClientCertificate(this.der, this.certificatePem, this.privateKeyPem);

  static Future<MobileClientCertificate> fromIdentity(MobileIdentity identity,
      {DateTime? now}) async {
    final date = (now ?? DateTime.now()).toUtc();
    final rand = Random.secure();
    final serial = List<int>.generate(16, (_) => rand.nextInt(256));
    serial[0] &= 0x7f;
    if (serial.every((byte) => byte == 0)) serial[15] = 1;
    final pub = (await identity.keyPair.extractPublicKey()).bytes;
    if (pub.length != 32) throw StateError('Se requiere clave Ed25519.');
    final name = _cn('Nai Mobile');
    final tbs = _seq([
      0xa0, 0x03, 0x02, 0x01, 0x02, ..._tlv(0x02, serial), ..._algorithm,
      ...name, ..._seq([ ..._time(date.subtract(const Duration(hours: 1))),
                        ..._time(date.add(const Duration(days: 7))) ]),
      ...name, ..._spkiPrefix, ...pub,
      ..._tlv(0xa3, _seq([
        ..._seq([0x06, 0x03, 0x55, 0x1d, 0x13, 0x01, 0x01, 0xff, 0x04, 0x02, 0x30, 0x00]),
        ..._seq([0x06, 0x03, 0x55, 0x1d, 0x0f, 0x01, 0x01, 0xff, 0x04, 0x04, 0x03, 0x02, 0x07, 0x80]),
      ])),
    ]);
    final signature = await Ed25519().sign(tbs, keyPair: identity.keyPair);
    final der = _seq([...tbs, ..._algorithm, ..._tlv(0x03, [0, ...signature.bytes])]);
    final seed = await identity.keyPair.extractPrivateKeyBytes();
    if (seed.length != 32) throw StateError('Semilla Ed25519 invalida.');
    return MobileClientCertificate(der, _pem('CERTIFICATE', der),
        _pem('PRIVATE KEY', [..._privatePrefix, ...seed]));
  }

  SecurityContext makeContext() {
    final context = SecurityContext(withTrustedRoots: false);
    context.minimumTlsProtocolVersion = TlsProtocolVersion.tls1_3;
    context.useCertificateChainBytes(utf8.encode(certificatePem));
    context.usePrivateKeyBytes(utf8.encode(privateKeyPem));
    return context;
  }
}

class _DerElement {
  final int tag, start, body, end;
  const _DerElement(this.tag, this.start, this.body, this.end);
}
_DerElement _read(List<int> bytes, int start) {
  if (start + 2 > bytes.length) throw const FormatException('DER incompleto.');
  final tag = bytes[start];
  var pos = start + 1;
  final first = bytes[pos++];
  var size = 0;
  if (first < 128) {
    size = first;
  } else {
    final n = first & 0x7f;
    if (n == 0 || n > 4 || pos + n > bytes.length) throw const FormatException('DER invalido.');
    for (var i = 0; i < n; i++) { size = (size << 8) | bytes[pos++]; }
  }
  if (pos + size > bytes.length) throw const FormatException('DER fuera de rango.');
  return _DerElement(tag, start, pos, pos + size);
}
List<_DerElement> _children(List<int> bytes, _DerElement parent) {
  var pos = parent.body;
  final children = <_DerElement>[];
  while (pos < parent.end) {
    final item = _read(bytes, pos);
    if (item.end > parent.end) throw const FormatException('DER fuera de secuencia.');
    children.add(item); pos = item.end;
  }
  return children;
}

/// Extracts SPKI from TBSCertificate's defined field, not via an unsafe byte scan.
String certificateSpki(X509Certificate cert) {
  final bytes = cert.der;
  final root = _read(bytes, 0);
  if (root.tag != 0x30 || root.end != bytes.length) throw const FormatException('X509 invalido.');
  final certFields = _children(bytes, root);
  if (certFields.length != 3 || certFields.first.tag != 0x30) {
    throw const FormatException('X509 incompleto.');
  }
  final tbs = _children(bytes, certFields.first);
  final index = tbs.isNotEmpty && tbs.first.tag == 0xa0 ? 6 : 5;
  if (tbs.length <= index || tbs[index].tag != 0x30) throw const FormatException('X509 sin SPKI.');
  return base64UrlEncode(bytes.sublist(tbs[index].start, tbs[index].end)).replaceAll('=', '');
}
