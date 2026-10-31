import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'mobile_identity_storage.dart';
import 'pairing_crypto.dart';
import 'nai_tls_client.dart';

class SyncConnectionPage extends StatefulWidget {
  const SyncConnectionPage({super.key});
  @override State<SyncConnectionPage> createState() => _SyncConnectionPageState();
}
class _SyncConnectionPageState extends State<SyncConnectionPage> {
  final host = TextEditingController();
  final port = TextEditingController(text: '4392');
  final project = TextEditingController();
  final storage = MobileIdentityStorage(const FlutterSecureStorage(), PairingCrypto());
  VerifiedHost? peer;
  String message = 'Cargando dispositivo vinculado';
  bool busy = false;
  @override void initState() { super.initState(); load(); }
  Future<void> load() async {
    try {
      final saved = await storage.verifiedHost();
      if (mounted) setState(() {
        peer = saved;
        message = saved == null
          ? 'Primero confirma el ACK firmado desde tu PC.'
          : 'PC vinculada. Puedes probar TLS.';
      });
    } catch (_) {
      if (mounted) setState(() => message = 'Identidad de PC invalida. Acceso bloqueado.');
    }
  }
  @override void dispose() {
    host.dispose(); port.dispose(); project.dispose();
    super.dispose();
  }
  Future<void> check(bool manifest) async {
    if (busy || peer == null) return;
    final address = host.text.trim();
    final number = int.tryParse(port.text);
    final scope = project.text.trim();
    if (address.isEmpty || address.contains(RegExp(r'[\s/]')) ||
      number == null || number < 1 || number > 65535 ||
      (manifest && (scope.isEmpty || scope.length > 160))) {
      setState(() => message = 'Direccion, puerto o proyecto incorrecto.');
      return;
    }
    setState(() { busy = true; message = 'Verificando TLS'; });
    try {
      final identity = await storage.getOrCreate();
      final client = NaiTlsClient(identity: identity, host: address,
        port: number, pinnedServerSpki: peer!.publicKey);
      if (await client.peerId != peer!.deviceId) {
        throw const FormatException('La PC no coincide con el par verificado.');
      }
      final data = await client.request(manifest
        ? {'op': 'manifest', 'project': scope}
        : {'op': 'ping'});
      if (mounted) setState(() => message = manifest
        ? 'Proyecto autorizado. Memorias: ' + data['count'].toString() +
          '. Descarga bloqueada hasta cifrar SQLite.'
        : 'Conexion TLS autentica. Descarga deshabilitada.');
    } catch (_) {
      if (mounted) setState(() => message =
        'No se pudo autenticar la PC o no tienes permiso de lectura.');
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }
  @override Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Conectar con PC')),
    body: ListView(padding: const EdgeInsets.all(20), children: [
      const Icon(Icons.devices, size: 48),
      const Text('Solo diagnostico: no descarga memorias.'),
      if (peer != null) SelectableText(peer!.deviceId),
      TextField(controller: host, decoration: const InputDecoration(
        labelText: 'IP local de la PC', hintText: '192.168.1.10')),
      TextField(controller: port, keyboardType: TextInputType.number,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        decoration: const InputDecoration(labelText: 'Puerto TLS')),
      TextField(controller: project,
        decoration: const InputDecoration(labelText: 'Proyecto autorizado')),
      const SizedBox(height: 16),
      FilledButton(onPressed: busy || peer == null ? null : () => check(false),
        child: const Text('Probar TLS')),
      OutlinedButton(onPressed: busy || peer == null ? null : () => check(true),
        child: const Text('Consultar cantidad de memorias')),
      if (busy) const LinearProgressIndicator(),
      const SizedBox(height: 12),
      Text(message),
      const SizedBox(height: 20),
      const Text('La sincronizacion y el guardado estan deshabilitados hasta '
        'completar cifrado local y pruebas Android-Windows.'),
    ]),
  );
}
