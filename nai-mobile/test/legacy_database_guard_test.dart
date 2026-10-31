import 'dart:io';
import 'package:flutter_test/flutter_test.dart';
import 'package:nai_mobile/memory_store.dart';

void main() {
  test('bloquea apertura si queda base antigua o archivo auxiliar', () async {
    final directory = await Directory.systemTemp.createTemp('nai-legacy-guard-');
    addTearDown(() => directory.delete(recursive: true));
    expect(await hasLegacyDatabaseArtifacts(directory.path), isFalse);
    for (final name in ['nai-mobile.db', 'nai-mobile.db-wal',
      'nai-mobile.db-shm', 'nai-mobile.db-journal']) {
      final artifact = File('${directory.path}${Platform.pathSeparator}$name');
      await artifact.writeAsBytes([1]);
      expect(await hasLegacyDatabaseArtifacts(directory.path), isTrue);
      await artifact.delete();
    }
    expect(await hasLegacyDatabaseArtifacts(directory.path), isFalse);
  });
}
