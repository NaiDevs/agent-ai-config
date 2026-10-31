import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/memory.dart';

List<int> fixture(List<Map<String,Object?>> memories) => utf8.encode(jsonEncode({
 'version':1,'proyecto':'demo','memorias':memories
}));
Map<String,Object?> record([String id='engram:1'])=> {
 'id':id,'proyectoId':'demo','revisionId':'r1','revisionPadreId':null,
 'origen':'engram','contenido':'decision','eliminada':false
};
void main(){
 test('parsea un snapshot valido',(){
  final s=Snapshot.parse(fixture([record()]));
  expect(s.project,'demo'); expect(s.items.single.id,'engram:1');
 });
 test('rechaza IDs duplicados',(){
  expect(()=>Snapshot.parse(fixture([record(),record()])),throwsFormatException);
 });
 test('rechaza proyecto diferente',(){
  expect(()=>Snapshot.parse(fixture([{...record(),'proyectoId':'otro'}])),throwsFormatException);
 });
 test('no acepta export directo de Engram',(){
  expect(()=>Snapshot.parse(utf8.encode('{"observations":[]}')),throwsFormatException);
 });
 test('requiere texto para memorias activas',(){
  expect(()=>Snapshot.parse(fixture([{...record(),'contenido':''}])),throwsFormatException);
 });
 test('admite borrado explicito',(){
  expect(Snapshot.parse(fixture([{...record(),'eliminada':true,'contenido':''}])).items.single.deleted,true);
 });
}
