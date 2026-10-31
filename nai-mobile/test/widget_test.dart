import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/main.dart';
import 'package:nai_mobile/memory.dart';
import 'package:nai_mobile/memory_store.dart';

class _FakeMemoryStore implements MemoryStore {
  @override
  Future<List<String>> projects() async => ['Demo'];

  @override
  Future<List<MemoryItem>> search({String? project, String query = ''}) async {
    const memory = MemoryItem('engram:1', 'Demo', 'r1', 'Memoria de prueba', false);
    if (project != null && project != memory.project) return [];
    if (!memory.content.toLowerCase().contains(query.toLowerCase())) return [];
    return [memory];
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  testWidgets('muestra memorias locales y permite buscar', (tester) async {
    await tester.pumpWidget(MaterialApp(home: MemoryHome(store: _FakeMemoryStore())));
    await tester.pumpAndSettle();

    expect(find.text('Nai Mobile'), findsOneWidget);
    expect(find.text('Memoria de prueba'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'sin resultados');
    await tester.pumpAndSettle();
    expect(find.text('Memoria de prueba'), findsNothing);
  });
}
