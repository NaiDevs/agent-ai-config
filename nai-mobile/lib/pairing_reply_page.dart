import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'mobile_identity_storage.dart';
import 'pairing_crypto.dart';
import 'pairing_invitation.dart';

class PairingReplyPage extends StatefulWidget {
  final PairingInvitation invitation;
  const PairingReplyPage({super.key,required this.invitation});
  @override State<PairingReplyPage> createState()=>_PairingReplyPageState();
}
class _PairingReplyPageState extends State<PairingReplyPage> {
  PairResponse? response;
  String? error;
  bool busy=true;
  final crypto=PairingCrypto();
  late final storage=MobileIdentityStorage(const FlutterSecureStorage(),crypto);
  @override void initState(){super.initState();prepare();}
  Future<void> prepare() async {
    try {
      final identity=await storage.getOrCreate();
      final result=await crypto.respond(identity,widget.invitation);
      if(mounted)setState((){response=result;busy=false;});
    }catch(e){if(mounted)setState((){error='$e';busy=false;});}
  }
  Future<void> confirm() async {
    final r=response;
    if(r==null)return;
    final controller=TextEditingController();
    final ack=await showDialog<String>(context:context,builder:(context)=>AlertDialog(
      title:const Text('Confirmación de PC'),
      content:TextField(controller:controller,decoration:const InputDecoration(
        labelText:'Token de confirmación (ACK)'),maxLines:3),
      actions:[TextButton(onPressed:()=>Navigator.pop(context),child:const Text('Cancelar')),
        FilledButton(onPressed:()=>Navigator.pop(context,controller.text.trim()),
          child:const Text('Verificar'))]));
    controller.dispose();
    if(ack==null || ack.isEmpty)return;
    try {
      final identity=await storage.getOrCreate();
      await crypto.verifyConfirmation(identity,widget.invitation,r,ack);
      await storage.saveVerifiedHost(widget.invitation.deviceId,widget.invitation.publicKey);
      if(!mounted)return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content:Text('Confirmación autenticada. Falta integrar TLS Android.')));
      Navigator.pop(context);
    }catch(e){if(mounted)setState(()=>error='$e');}
  }
  @override Widget build(BuildContext context)=>Scaffold(appBar:AppBar(title:const Text('Vinculación segura')),
    body:ListView(padding:const EdgeInsets.all(20),children:[
      Text('PC: ${widget.invitation.name}',style:Theme.of(context).textTheme.titleLarge),
      const SizedBox(height:12),
      if(busy)const Center(child:CircularProgressIndicator()),
      if(response!=null)...[
        const Text('Compará estos 8 dígitos en la PC antes de aprobar:'),
        SelectableText(response!.code,style:Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height:16),
        Center(child:QrImageView(data:response!.token,size:240,backgroundColor:Colors.white)),
        const SizedBox(height:12),
        FilledButton(onPressed:()=>Clipboard.setData(ClipboardData(text:response!.token)),
          child:const Text('Copiar respuesta para Nai Bridge')),
        FilledButton(onPressed:confirm,child:const Text('Verificar confirmación firmada')),
      ],
      if(error!=null)Text(error!,style:TextStyle(color:Theme.of(context).colorScheme.error)),
      const Text('Nunca compartás la clave privada. La respuesta no habilita acceso a memorias.'),
    ]));
}
