import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'memory.dart';
import 'memory_store.dart';
import 'pairing_scanner.dart';
import 'sync_connection_page.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    final store=await MemoryStore.open();
    runApp(MaterialApp(title:'Nai Mobile',debugShowCheckedModeBanner:false,
      theme:ThemeData.dark(useMaterial3:true),home:MemoryHome(store:store)));
  } catch (_) {
    runApp(MaterialApp(title:'Nai Mobile',debugShowCheckedModeBanner:false,
      theme:ThemeData.dark(useMaterial3:true),home:const Scaffold(
        body:Center(child:Padding(padding:EdgeInsets.all(24),child:Text(
          'La base local no se pudo abrir de forma segura. Los datos existentes se conservaron. '
          'La sincronización está bloqueada hasta completar una migración segura.'))))));
  }
}
class MemoryHome extends StatefulWidget {
  final MemoryStore store;
  const MemoryHome({super.key,required this.store});
  @override State<MemoryHome> createState()=>_MemoryHomeState();
}
class _MemoryHomeState extends State<MemoryHome> {
  List<String> projects=[];
  List<MemoryItem> items=[];
  String? current;
  String query='';
  bool busy=false;
  @override void initState(){super.initState();refresh();}
  Future<void> refresh() async {
    final ps=await widget.store.projects();
    final ms=await widget.store.search(project:current,query:query);
    if(mounted)setState((){projects=ps;items=ms;});
  }
  void note(String value) {
    if(mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content:Text(value)));
  }
  Future<void> importFile() async {
    if(busy)return;
    setState(()=>busy=true);
    try {
      final selected=await FilePicker.pickFile(type:FileType.custom,allowedExtensions:['json']);
      if(selected==null)return;
      final size=selected.lengthSync() ?? await selected.length();
      if(size==null || size>32*1024*1024) throw const FormatException('Archivo inaccesible o demasiado grande.');
      final snapshot=Snapshot.parse(await selected.readAsBytes());
      final stats=await widget.store.importSnapshot(snapshot);
      await refresh();
      note('Importado: ${stats['added']} nuevas, ${stats['updated']} actualizadas.');
    } catch(e) {note('Importacion rechazada: $e');}
    finally {if(mounted)setState(()=>busy=false);}
  }
  @override Widget build(BuildContext context)=>Scaffold(
    appBar:AppBar(title:const Text('Nai Mobile'),actions:[
      IconButton(tooltip:'Conexion TLS segura',onPressed:() async {
        await Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>SyncConnectionPage(store:widget.store)));
        await refresh();
      },icon:const Icon(Icons.devices)),
      IconButton(tooltip:'Escanear invitación QR',onPressed:()=>Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>const PairingScannerPage())),icon:const Icon(Icons.qr_code_scanner)),
      IconButton(onPressed:refresh,icon:const Icon(Icons.refresh))]),
    floatingActionButton:FloatingActionButton.extended(
      onPressed:busy?null:importFile,icon:const Icon(Icons.file_open),label:const Text('Importar JSON')),
    body:Column(children:[
      const Padding(padding:EdgeInsets.all(12),child:Text('Memorias offline · Sin sincronizacion automatica')),
      Padding(padding:const EdgeInsets.symmetric(horizontal:16),child:TextField(
        decoration:const InputDecoration(labelText:'Buscar memorias',prefixIcon:Icon(Icons.search)),
        onChanged:(value){query=value;refresh();})),
      SizedBox(height:54,child:ListView(scrollDirection:Axis.horizontal,children:[
        Padding(padding:const EdgeInsets.all(5),child:ChoiceChip(label:const Text('Todos'),
          selected:current==null,onSelected:(_){setState(()=>current=null);refresh();})),
        ...projects.map((name)=>Padding(padding:const EdgeInsets.all(5),child:ChoiceChip(
          label:Text(name),selected:current==name,
          onSelected:(_){setState(()=>current=name);refresh();}))),
      ])),
      Expanded(child:items.isEmpty?const Center(child:Text('Sin memorias. Importa un JSON de prueba.')):
        ListView.builder(itemCount:items.length,itemBuilder:(context,i){
          final m=items[i];
          return ListTile(title:Text(m.content.split('\n').first,maxLines:1,overflow:TextOverflow.ellipsis),
            subtitle:Text(m.project),trailing:const Icon(Icons.chevron_right),
            onTap:()=>Navigator.of(context).push(MaterialPageRoute<void>(builder:(_)=>Scaffold(
              appBar:AppBar(title:Text(m.project)),body:ListView(padding:const EdgeInsets.all(20),
                children:[SelectableText(m.content)])))));
        }))
    ]));
}
