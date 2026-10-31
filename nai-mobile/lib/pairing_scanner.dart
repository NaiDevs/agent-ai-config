import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'pairing_invitation.dart';
import 'pairing_reply_page.dart';

class PairingScannerPage extends StatefulWidget {
  const PairingScannerPage({super.key});
  @override
  State<PairingScannerPage> createState()=>_PairingScannerPageState();
}
class _PairingScannerPageState extends State<PairingScannerPage> {
  PairingInvitation? invitation;
  String? error;
  bool scanned=false;
  final controller=MobileScannerController();
  @override void dispose(){controller.dispose();super.dispose();}
  void accept(String token) {
    if(scanned)return;
    setState(()=>scanned=true);
    try {
      final parsed=PairingInvitation.decode(token);
      setState((){invitation=parsed;error=null;});
    } catch(e) {
      setState((){error=e.toString();scanned=false;});
    }
  }
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:const Text('Vincular computadora')),
    body:invitation!=null?ListView(padding:const EdgeInsets.all(20),children:[
      const Icon(Icons.shield_outlined,size:55),
      const SizedBox(height:15),
      Text('Invitación de ${invitation!.name}',style:Theme.of(context).textTheme.titleLarge),
      const SizedBox(height:10),
      SelectableText(invitation!.deviceId),
      Text('Vence: ${invitation!.expiry.toLocal()}'),
      const SizedBox(height:20),
      const Text('El siguiente paso verificará criptográficamente la firma Ed25519 antes de responder.'),
      FilledButton(onPressed:()=>Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>PairingReplyPage(invitation:invitation!))),child:const Text('Verificar firma y generar respuesta')),
      const SizedBox(height:12),
      FilledButton(onPressed:()=>Clipboard.setData(ClipboardData(text:invitation!.deviceId)),
        child:const Text('Copiar ID público')),
      TextButton(onPressed:(){setState((){invitation=null;scanned=false;error=null;});},
        child:const Text('Escanear otro código'))
    ]):Column(children:[
      Expanded(child:MobileScanner(controller:controller,
        onDetect:(capture){
          if(scanned || capture.barcodes.isEmpty)return;
          final token=capture.barcodes.first.rawValue;
          if(token!=null)accept(token);
        })),
      Padding(padding:const EdgeInsets.all(16),child:Column(children:[
        const Text('Escaneá la invitación emitida por Nai Bridge en tu PC.'),
        if(error!=null)Text(error!,style:TextStyle(color:Theme.of(context).colorScheme.error)),
      ])),
    ]));
}
