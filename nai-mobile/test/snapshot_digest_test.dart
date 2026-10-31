import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/snapshot_digest.dart';

Map<String,dynamic> memory(String id)=> {
 'id':id,'proyectoId':'demo','revisionId':'r1','revisionPadreId':null,
 'origen':'engram','contenido':'hola','eliminada':false
};
void main() {
 test('el mismo vector SHA256 de Nai Bridge Node',() async {
  expect(canonicalSnapshotV2([memory('engram:1')]),
    'NAI-SNAPSHOT-V2\nZW5ncmFtOjE.ZGVtbw.cjE.~.ZW5ncmFt.aG9sYQ.0\n');
  expect(await snapshotDigestV2([memory('engram:1')]),
    'd6eb9836d1e12d150654d0128751741307f65d3720622db36840122bb7cb4c0e');
 });
 test('el hash es independiente del orden y de campos extra',() async {
  final a=[memory('engram:a'),memory('engram:b')];
  final b=[{...memory('engram:b'),'extra':'ignorado'},memory('engram:a')];
  expect(await snapshotDigestV2(a),await snapshotDigestV2(b));
 });
 test('contenido modificado cambia el hash',() async {
  final before=await snapshotDigestV2([memory('engram:1')]);
  final after=await snapshotDigestV2([{...memory('engram:1'),'contenido':'alterado'}]);
  expect(before,isNot(after));
 });
}
